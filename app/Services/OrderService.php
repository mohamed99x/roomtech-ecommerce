<?php

namespace App\Services;

use App\Events\OrderCreated;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Checkout\Session;
use MercadoPago\SDK;
use MercadoPago\Preference;
use MercadoPago\Item;
use MercadoPago\Payer;


class OrderService
{
    public function createOrder(array $orderData, array $cartItems): Order
    {
        return DB::transaction(function () use ($orderData, $cartItems) {
            // For PayFast, create order with awaiting_payment status to prevent premature completion
            $initialStatus = $orderData['payment_method'] === 'payfast' ? 'awaiting_payment' : 'pending';
            $initialPaymentStatus = $orderData['payment_method'] === 'payfast' ? 'awaiting_payment' : 'pending';
            
            // Get customer ID and validate it exists
            $customerId = Auth::guard('customer')->id();
            if ($customerId && !Customer::where('id', $customerId)->where('store_id', $orderData['store_id'])->exists()) {
                // Customer doesn't exist or doesn't belong to this store, logout and treat as guest
                Auth::guard('customer')->logout();
                $customerId = null;
                \Log::warning('Invalid customer session detected during order creation', [
                    'attempted_customer_id' => Auth::guard('customer')->id(),
                    'store_id' => $orderData['store_id']
                ]);
            }
            
            // Create the order
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'store_id' => $orderData['store_id'],
                'customer_id' => $customerId, // This can be null for guest orders
                'session_id' => session()->getId(),
                'status' => $initialStatus,
                'payment_status' => $initialPaymentStatus,
                
                // Customer info
                'customer_email' => $orderData['customer_email'],
                'customer_phone' => $orderData['customer_phone'],
                'customer_first_name' => $orderData['customer_first_name'],
                'customer_last_name' => $orderData['customer_last_name'],
                
                // Shipping address
                'shipping_address' => $orderData['shipping_address'],
                'shipping_city' => $orderData['shipping_city'],
                'shipping_state' => $orderData['shipping_state'],
                'shipping_postal_code' => $orderData['shipping_postal_code'],
                'shipping_country' => $orderData['shipping_country'],
                
                // Billing address
                'billing_address' => $orderData['billing_address'],
                'billing_city' => $orderData['billing_city'],
                'billing_state' => $orderData['billing_state'],
                'billing_postal_code' => $orderData['billing_postal_code'],
                'billing_country' => $orderData['billing_country'],
                
                // Pricing
                'subtotal' => $orderData['subtotal'],
                'tax_amount' => $orderData['tax_amount'],
                'shipping_amount' => $orderData['shipping_amount'],
                'discount_amount' => $orderData['discount_amount'],
                'total_amount' => $orderData['total_amount'],
                
                // Payment info
                'payment_method' => $orderData['payment_method'],
                'payment_gateway' => $orderData['payment_gateway'] ?? null,
                // 'bank_transfer_receipt' => $orderData['bank_transfer_receipt'] ?? null,
                
                // Shipping info
                'shipping_method_id' => $orderData['shipping_method_id'] ?? null,
                
                // Additional info
                'notes' => $orderData['notes'] ?? null,
                'coupon_code' => $orderData['coupon_code'] ?? null,
                'coupon_discount' => $orderData['coupon_discount'] ?? 0,
                'whatsapp_number' => $orderData['whatsapp_number'] ?? null,
            ]);

            // Create order items and update inventory
            foreach ($cartItems as $cartItem) {
                $unitPrice = $cartItem['sale_price'] ?? $cartItem['price'];
                
                // Check and update product inventory
                $product = Product::find($cartItem['product_id']);
                if ($product) {
                    if ($product->stock < $cartItem['quantity']) {
                        throw new \Exception("Insufficient stock for product: {$cartItem['name']}");
                    }
                    
                    // Reduce product stock
                    $product->decrement('stock', $cartItem['quantity']);
                }
                
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $cartItem['product_id'],
                    'product_name' => $cartItem['name'],
                    'product_sku' => $cartItem['sku'] ?? null,
                    'product_price' => $cartItem['price'],
                    'quantity' => $cartItem['quantity'],
                    'product_variants' => $cartItem['variants'] ?? null,
                    'unit_price' => $unitPrice,
                    'total_price' => $unitPrice * $cartItem['quantity'],
                ]);
            }

            // Clear cart items after order creation
            $this->clearCart($orderData['store_id']);

            // Dispatch order created event for email notifications
            event(new OrderCreated($order));

            return $order;
        });
    }

    public function processPayment(Order $order, string $storeSlug = null): array
    {
        switch ($order->payment_method) {
            case 'cod':
                return $this->processCashOnDelivery($order);
            case 'whatsapp':
                return $this->processWhatsAppPayment($order);
            case 'telegram':
                return $this->processTelegramPayment($order);
            case 'stripe':
                return $this->processStripePayment($order, $storeSlug);
            case 'paypal':
                return $this->processPayPalPayment($order, $storeSlug);
            case 'payfast':
                return $this->processPayFastPayment($order, $storeSlug);
            case 'mercadopago':
                return $this->processMercadoPagoPayment($order, $storeSlug);
            case 'razorpay':
                return $this->processRazorpayPayment($order, $storeSlug);
            case 'cashfree':
                return $this->processCashfreePayment($order, $storeSlug);
            case 'paystack':
                return $this->processPaystackPayment($order, $storeSlug);
            case 'flutterwave':
                return $this->processFlutterwavePayment($order, $storeSlug);
            case 'bank':
                return $this->processBankTransferPayment($order);
            case 'paytabs':
                return $this->processPayTabsPayment($order, $storeSlug);
            case 'coingate':
                return $this->processCoinGatePayment($order, $storeSlug);
            case 'tap':
                return $this->processTapPayment($order, $storeSlug);
            default:
                return ['success' => false, 'message' => 'Unsupported payment method: ' . $order->payment_method];
        }
    }

    private function processCashOnDelivery(Order $order): array
    {
        $order->update([
            'status' => 'pending',
            'payment_status' => 'pending',
            'payment_gateway' => 'cod',
        ]);

        return [
            'success' => true,
            'message' => 'Order placed successfully. Payment will be collected on delivery.',
            'order_id' => $order->id,
            'order_number' => $order->order_number,
        ];
    }

    private function processWhatsAppPayment(Order $order): array
    {
        
        $order->update([
            'status' => 'pending',
            'payment_status' => 'pending',
            'payment_gateway' => 'whatsapp',
        ]);

        // Send WhatsApp message
        if ($order->whatsapp_number) {
            $whatsappService = new \App\Services\WhatsAppService();
            $result = $whatsappService->sendOrderConfirmation($order, $order->whatsapp_number);
        } else {
            \Log::warning('No WhatsApp number provided for order', ['order_id' => $order->id]);
        }

        return [
            'success' => true,
            'message' => 'Order placed successfully. You will be contacted via WhatsApp for payment confirmation.',
            'order_id' => $order->id,
            'order_number' => $order->order_number,
        ];
    }

    private function processTelegramPayment(Order $order): array
    {
        
        $order->update([
            'status' => 'pending',
            'payment_status' => 'pending',
            'payment_gateway' => 'telegram',
        ]);

        // Telegram message will be sent by the OrderCreated event listener

        return [
            'success' => true,
            'message' => 'Order placed successfully. You will receive a Telegram notification.',
            'order_id' => $order->id,
            'order_number' => $order->order_number,
        ];
    }

    private function processBankTransferPayment(Order $order): array
    {
        $order->update([
            'status' => 'pending',
            'payment_status' => 'awaiting_payment',
            'payment_gateway' => 'bank_transfer',
        ]);

        return [
            'success' => true,
            'message' => 'Order placed successfully. Please transfer the payment to the provided bank details. Your order will be processed after payment verification.',
            'order_id' => $order->id,
            'order_number' => $order->order_number,
        ];
    }

    private function processStripePayment(Order $order, string $storeSlug = null): array
    {
        try {
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            // Get store owner's Stripe settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                return ['success' => false, 'message' => 'Store configuration error'];
            }
            
            $stripeConfig = getPaymentMethodConfig('stripe', $storeModel->user->id, $order->store_id);
            
            if (!$stripeConfig['enabled'] || !$stripeConfig['secret']) {
                return ['success' => false, 'message' => 'Stripe is not configured for this store'];
            }
            
            Stripe::setApiKey($stripeConfig['secret']);
            
            // Generate proper URLs for custom domain or regular store
            if ($isCustomDomain) {
                $successUrl = url('/stripe/success/' . $order->order_number);
                $cancelUrl = url('/checkout');
            } else {
                $successUrl = route('store.stripe.success', ['storeSlug' => $storeSlug ?: $storeModel->slug, 'orderNumber' => $order->order_number]);
                $cancelUrl = route('store.checkout', ['storeSlug' => $storeSlug ?: $storeModel->slug]);
            }
            
            // Log URLs for debugging
            \Log::info('Stripe checkout URLs', [
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
                'is_custom_domain' => $isCustomDomain,
                'host' => request()->getHost()
            ]);
            
            // Create checkout session
            $checkoutSession = Session::create([
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'usd',
                        'product_data' => [
                            'name' => "Order #{$order->order_number}",
                        ],
                        'unit_amount' => intval($order->total_amount * 100),
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
                'metadata' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'store_id' => $order->store_id,
                ],
            ]);
            
            $order->update([
                'payment_gateway' => 'stripe',
                'payment_transaction_id' => $checkoutSession->id,
                'payment_details' => [
                    'checkout_session_id' => $checkoutSession->id,
                ],
            ]);
            
            return [
                'success' => true,
                'message' => 'Stripe checkout session created',
                'checkout_url' => $checkoutSession->url,
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Stripe payment failed: ' . $e->getMessage()
            ];
        }
    }

    private function processPayPalPayment(Order $order, string $storeSlug = null): array
    {
        try {
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            // Get store owner's PayPal settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                return ['success' => false, 'message' => 'Store configuration error'];
            }
            
            $paypalConfig = getPaymentMethodConfig('paypal', $storeModel->user->id, $order->store_id);
            
            if (!$paypalConfig['enabled'] || !$paypalConfig['client_id'] || !$paypalConfig['secret']) {
                return ['success' => false, 'message' => 'PayPal is not configured for this store'];
            }
            
            // Use direct PayPal API calls
            $baseUrl = $paypalConfig['mode'] === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';
            
            // Get access token
            $tokenResponse = \Http::withBasicAuth($paypalConfig['client_id'], $paypalConfig['secret'])
                ->asForm()
                ->post($baseUrl . '/v1/oauth2/token', [
                    'grant_type' => 'client_credentials'
                ]);
            
            if (!$tokenResponse->successful()) {
                return ['success' => false, 'message' => 'PayPal authentication failed'];
            }
            
            $accessToken = $tokenResponse->json()['access_token'];
            
            // Create PayPal order
            $orderResponse = \Http::withToken($accessToken)
                ->post($baseUrl . '/v2/checkout/orders', [
                    'intent' => 'CAPTURE',
                    'application_context' => [
                        'return_url' => $isCustomDomain ? url('/paypal/success/' . $order->order_number) : url(($storeSlug ?: $storeModel->slug) . '/paypal/success/' . $order->order_number),
                        'cancel_url' => $isCustomDomain ? url('/checkout') : url(($storeSlug ?: $storeModel->slug) . '/checkout'),
                    ],
                    'purchase_units' => [
                        [
                            'amount' => [
                                'currency_code' => 'USD',
                                'value' => number_format($order->total_amount, 2, '.', ''),
                            ],
                            'description' => "Order #{$order->order_number}",
                        ]
                    ],
                ]);
            
            if (!$orderResponse->successful()) {
                return ['success' => false, 'message' => 'PayPal order creation failed: ' . $orderResponse->body()];
            }
            
            $paypalOrder = $orderResponse->json();
            
            if (isset($paypalOrder['id'])) {
                $order->update([
                    'payment_gateway' => 'paypal',
                    'payment_transaction_id' => $paypalOrder['id'],
                    'payment_details' => [
                        'paypal_order_id' => $paypalOrder['id'],
                    ],
                ]);
                
                // Get approval URL
                $approvalUrl = collect($paypalOrder['links'])->firstWhere('rel', 'approve')['href'] ?? null;
                
                return [
                    'success' => true,
                    'message' => 'PayPal order created successfully',
                    'checkout_url' => $approvalUrl,
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                ];
            } else {
                return ['success' => false, 'message' => 'Failed to create PayPal order: ' . json_encode($paypalOrder)];
            }
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'PayPal payment failed: ' . $e->getMessage()
            ];
        }
    }

    private function processPayFastPayment(Order $order, string $storeSlug = null): array
    {
        try {
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            // Get store owner's PayFast settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                return ['success' => false, 'message' => 'Store configuration error'];
            }
            
            $payfastConfig = getPaymentMethodConfig('payfast', $storeModel->user->id, $order->store_id);
            
            if (!$payfastConfig['enabled'] || !$payfastConfig['merchant_id'] || !$payfastConfig['merchant_key']) {
                return ['success' => false, 'message' => 'PayFast is not configured for this store'];
            }
            
            if ($order->total_amount < 5.00) {
                return ['success' => false, 'message' => 'Minimum amount is R5.00'];
            }
            
            $paymentId = 'store_pf_' . $order->id . '_' . time() . '_' . uniqid();
            
            $data = [
                'merchant_id' => $payfastConfig['merchant_id'],
                'merchant_key' => $payfastConfig['merchant_key'],
                'return_url' => $isCustomDomain ? route('store.payfast.success', ['orderNumber' => $order->order_number]) : route('store.payfast.success', ['storeSlug' => $storeSlug ?: $storeModel->slug, 'orderNumber' => $order->order_number]),
                'cancel_url' => $isCustomDomain ? route('store.checkout') : route('store.checkout', ['storeSlug' => $storeSlug ?: $storeModel->slug]),
                'notify_url' => route('store.payfast.callback'),
                'name_first' => $order->customer_first_name,
                'name_last' => $order->customer_last_name,
                'email_address' => $order->customer_email,
                'm_payment_id' => $paymentId,
                'amount' => number_format($order->total_amount, 2, '.', ''),
                'item_name' => "Order #{$order->order_number}",
            ];
            
            $passphrase = $payfastConfig['passphrase'] ?? '';
            $signature = $this->generatePayFastSignature($data, $passphrase);
            $data['signature'] = $signature;
            
            $order->update([
                'payment_gateway' => 'payfast',
                'payment_transaction_id' => $paymentId,
                'payment_details' => [
                    'payfast_payment_id' => $paymentId,
                ],
            ]);
            
            $htmlForm = '';
            foreach ($data as $name => $value) {
                $htmlForm .= '<input name="' . $name . '" type="hidden" value="' . $value . '" />';
            }
            
            $isLive = ($payfastConfig['mode'] ?? 'sandbox') === 'live';
            $endpoint = $isLive 
                ? 'https://www.payfast.co.za/eng/process' 
                : 'https://sandbox.payfast.co.za/eng/process';
            
            return [
                'success' => true,
                'message' => 'PayFast payment form created',
                'payfast_data' => $data,
                'payfast_endpoint' => $endpoint,
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'PayFast payment failed: ' . $e->getMessage()
            ];
        }
    }
    
    private function generatePayFastSignature($data, $passPhrase = null)
    {
        $pfOutput = '';
        foreach ($data as $key => $val) {
            if ($val !== '') {
                $pfOutput .= $key . '=' . urlencode(trim($val)) . '&';
            }
        }
        
        $getString = substr($pfOutput, 0, -1);
        if ($passPhrase !== null) {
            $getString .= '&passphrase=' . urlencode(trim($passPhrase));
        }
        return md5($getString);
    }

    private function processMercadoPagoPayment(Order $order, string $storeSlug = null): array
    {
        try {
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            // Get store owner's MercadoPago settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                return ['success' => false, 'message' => 'Store configuration error'];
            }
            
            $mercadopagoConfig = getPaymentMethodConfig('mercadopago', $storeModel->user->id, $order->store_id);
            
            if (!$mercadopagoConfig['enabled'] || !$mercadopagoConfig['access_token']) {
                return ['success' => false, 'message' => 'MercadoPago is not configured for this store'];
            }
            
            // Initialize MercadoPago SDK
            SDK::setAccessToken($mercadopagoConfig['access_token']);
            SDK::setIntegratorId("dev_vcardgo");
            
            // Create preference
            $preference = new Preference();
            
            // Create item
            $item = new Item();
            $item->title = "Order #{$order->order_number}";
            $item->quantity = 1;
            $item->unit_price = (float)$order->total_amount;
            $item->currency_id = $mercadopagoConfig['currency'] ?? ($mercadopagoConfig['mode'] === 'live' ? 'BRL' : 'BRL');
            $item->id = "order_" . $order->id;
            
            $preference->items = [$item];
            
            // Set back URLs
            $preference->back_urls = [
                "success" => $isCustomDomain ? route('store.mercadopago.success', ['orderNumber' => $order->order_number]) : route('store.mercadopago.success', ['storeSlug' => $storeSlug ?: $storeModel->slug, 'orderNumber' => $order->order_number]),
                "failure" => $isCustomDomain ? route('store.checkout') : route('store.checkout', ['storeSlug' => $storeSlug ?: $storeModel->slug]),
                "pending" => $isCustomDomain ? route('store.mercadopago.success', ['orderNumber' => $order->order_number]) : route('store.mercadopago.success', ['storeSlug' => $storeSlug ?: $storeModel->slug, 'orderNumber' => $order->order_number])
            ];
            
            // Set external reference
            $preference->external_reference = 'store_order_' . $order->id . '_' . time();
            
            // Set notification URL
            $preference->notification_url = route('store.mercadopago.callback');
            
            // Set binary mode
            $preference->binary_mode = true;
            
            // Set payer information
            $payer = new Payer();
            $payer->name = $order->customer_first_name . ' ' . $order->customer_last_name;
            $payer->email = $order->customer_email;
            $preference->payer = $payer;
            
            // Save preference
            $result = $preference->save();
            
            if (!$result || !$preference->id) {
                return ['success' => false, 'message' => 'Failed to create MercadoPago preference'];
            }
            
            // Update order with payment details
            $order->update([
                'payment_gateway' => 'mercadopago',
                'payment_transaction_id' => $preference->id,
                'payment_details' => [
                    'preference_id' => $preference->id,
                ],
            ]);
            
            // Determine redirect URL based on mode
            $redirectUrl = ($mercadopagoConfig['mode'] ?? 'sandbox') === 'sandbox' 
                ? $preference->sandbox_init_point 
                : $preference->init_point;
            
            return [
                'success' => true,
                'message' => 'MercadoPago preference created successfully',
                'checkout_url' => $redirectUrl,
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'MercadoPago payment failed: ' . $e->getMessage()
            ];
        }
    }

    private function processRazorpayPayment(Order $order, string $storeSlug = null): array
    {
        try {
            // Get store owner's Razorpay settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                return ['success' => false, 'message' => 'Store configuration error'];
            }
            
            $razorpayConfig = getPaymentMethodConfig('razorpay', $storeModel->user->id, $order->store_id);
            
            if (!$razorpayConfig['enabled'] || !$razorpayConfig['key'] || !$razorpayConfig['secret']) {
                return ['success' => false, 'message' => 'Razorpay is not configured for this store'];
            }
            
            // Initialize Razorpay API
            $api = new \Razorpay\Api\Api($razorpayConfig['key'], $razorpayConfig['secret']);
            
            // Generate unique order ID for Razorpay
            $razorpayOrderId = 'store_rp_' . $order->id . '_' . time() . '_' . uniqid();
            
            // Create Razorpay order
            $orderData = [
                'receipt' => $razorpayOrderId,
                'amount' => (int)($order->total_amount * 100), // Amount in paise
                'currency' => $razorpayConfig['currency'] ?? 'INR',
                'notes' => [
                    'store_order_id' => (string)$order->id,
                    'order_number' => $order->order_number,
                    'store_id' => (string)$order->store_id
                ]
            ];
            
            $razorpayOrder = $api->order->create($orderData);
            
            // Update order with Razorpay details
            $order->update([
                'payment_gateway' => 'razorpay',
                'payment_transaction_id' => $razorpayOrder->id,
                'payment_details' => [
                    'razorpay_order_id' => $razorpayOrder->id,
                    'receipt' => $razorpayOrderId,
                ],
            ]);
            
            return [
                'success' => true,
                'message' => 'Razorpay order created successfully',
                'razorpay_order_id' => $razorpayOrder->id,
                'amount' => (int)($order->total_amount * 100),
                'currency' => $razorpayConfig['currency'] ?? 'INR',
                'key_id' => $razorpayConfig['key'],
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Razorpay payment failed: ' . $e->getMessage()
            ];
        }
    }

    private function processCashfreePayment(Order $order, string $storeSlug = null): array
    {
        try {
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            // Get store owner's Cashfree settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                return ['success' => false, 'message' => 'Store configuration error'];
            }
            
            $cashfreeConfig = getPaymentMethodConfig('cashfree', $storeModel->user->id, $order->store_id);
            
            if (!$cashfreeConfig['enabled'] || !$cashfreeConfig['public_key'] || !$cashfreeConfig['secret_key']) {
                return ['success' => false, 'message' => 'Cashfree is not configured for this store'];
            }
            
            // Generate unique order ID for Cashfree
            $cashfreeOrderId = 'store_cf_' . $order->id . '_' . time() . '_' . uniqid();
            
            // Prepare API headers
            $baseUrl = $cashfreeConfig['mode'] === 'production'
                ? 'https://api.cashfree.com/pg'
                : 'https://sandbox.cashfree.com/pg';
            
            $headers = [
                'x-client-id' => $cashfreeConfig['public_key'],
                'x-client-secret' => $cashfreeConfig['secret_key'],
                'x-api-version' => '2023-08-01',
                'Content-Type' => 'application/json'
            ];
            
            // Clean phone number
            $phone = $order->customer_phone ?: '9999999999';
            $phone = preg_replace('/[^0-9]/', '', $phone);
            if (strlen($phone) !== 10) {
                $phone = '9999999999';
            }
            
            // Prepare order data
            $orderData = [
                'order_id' => $cashfreeOrderId,
                'order_amount' => $order->total_amount,
                'order_currency' => 'INR',
                'customer_details' => [
                    'customer_id' => substr('store_' . ($order->customer_id ?: session()->getId()), 0, 50),
                    'customer_name' => substr(trim($order->customer_first_name . ' ' . $order->customer_last_name), 0, 50),
                    'customer_email' => $order->customer_email,
                    'customer_phone' => $phone
                ],
                'order_meta' => [
                    'return_url' => $isCustomDomain ? route('store.cashfree.success', [
                        'orderNumber' => $order->order_number ]) : route('store.cashfree.success', [
                        'storeSlug' => $storeSlug ?: $storeModel->slug,
                        'orderNumber' => $order->order_number
                    ]),
                    'notify_url' => route('store.cashfree.webhook')
                ],
                'order_note' => 'Store Order #' . $order->order_number,
                'order_tags' => [
                    'store_order_id' => (string)$order->id,
                    'order_number' => $order->order_number,
                    'store_id' => (string)$order->store_id
                ]
            ];
            
            // Make API call
            $response = \Http::withHeaders($headers)->post($baseUrl . '/orders', $orderData);
            
            if (!$response->successful()) {
                return ['success' => false, 'message' => 'Cashfree API error: ' . $response->body()];
            }
            
            $responseData = $response->json();
            
            // Update order with Cashfree details
            $order->update([
                'payment_gateway' => 'cashfree',
                'payment_transaction_id' => $cashfreeOrderId,
                'payment_details' => [
                    'cashfree_order_id' => $cashfreeOrderId,
                    'payment_session_id' => $responseData['payment_session_id'],
                ],
            ]);
            
            return [
                'success' => true,
                'message' => 'Cashfree payment session created successfully',
                'payment_session_id' => $responseData['payment_session_id'],
                'cashfree_order_id' => $cashfreeOrderId,
                'mode' => $cashfreeConfig['mode'],
                'public_key' => $cashfreeConfig['public_key'],
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Cashfree payment failed: ' . $e->getMessage()
            ];
        }
    }

    private function processPaystackPayment(Order $order, string $storeSlug = null): array
    {
        try {
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            // Get store owner's Paystack settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                return ['success' => false, 'message' => 'Store configuration error'];
            }
            
            $paystackConfig = getPaymentMethodConfig('paystack', $storeModel->user->id, $order->store_id);
            
            if (!$paystackConfig['enabled'] || !$paystackConfig['public_key'] || !$paystackConfig['secret_key']) {
                return ['success' => false, 'message' => 'Paystack is not configured for this store'];
            }
            
            // Generate unique reference for Paystack
            $paystackRef = 'store_ps_' . $order->id . '_' . time() . '_' . uniqid();
            
            // Initialize Paystack transaction
            $curl = curl_init();
            curl_setopt_array($curl, [
                CURLOPT_URL => "https://api.paystack.co/transaction/initialize",
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CUSTOMREQUEST => "POST",
                CURLOPT_POSTFIELDS => json_encode([
                    'amount' => intval($order->total_amount * 100), // Amount in kobo
                    'email' => $order->customer_email,
                    'reference' => $paystackRef,
                    'callback_url' => route('store.paystack.success', [
                        'storeSlug' => $storeSlug ?: $storeModel->slug,
                        'orderNumber' => $order->order_number
                    ]),
                    'channels' => ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
                    'metadata' => [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'store_id' => $order->store_id,
                        'customer_name' => $order->customer_first_name . ' ' . $order->customer_last_name,
                        'cancel_action' => $isCustomDomain ? route('store.checkout') : route('store.checkout', ['storeSlug' => $storeSlug ?: $storeModel->slug])
                    ]
                ]),
                CURLOPT_HTTPHEADER => [
                    "Authorization: Bearer " . $paystackConfig['secret_key'],
                    "Content-Type: application/json",
                ],
            ]);
            
            $response = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);
            
            if ($httpCode !== 200) {
                return ['success' => false, 'message' => 'Paystack API error'];
            }
            
            $result = json_decode($response, true);
            
            if (!$result || !$result['status'] || !isset($result['data']['authorization_url'])) {
                return ['success' => false, 'message' => 'Failed to initialize Paystack payment'];
            }
            
            // Update order with Paystack details
            $order->update([
                'payment_gateway' => 'paystack',
                'payment_transaction_id' => $paystackRef,
                'payment_details' => [
                    'paystack_reference' => $paystackRef,
                    'access_code' => $result['data']['access_code'],
                ],
            ]);
            
            return [
                'success' => true,
                'message' => 'Paystack payment initialized successfully',
                'checkout_url' => $result['data']['authorization_url'],
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Paystack payment failed: ' . $e->getMessage()
            ];
        }
    }

    private function processFlutterwavePayment(Order $order, string $storeSlug = null): array
    {
        try {
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            // Get store owner's Flutterwave settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                return ['success' => false, 'message' => 'Store configuration error'];
            }
            
            $flutterwaveConfig = getPaymentMethodConfig('flutterwave', $storeModel->user->id, $order->store_id);
            
            if (!$flutterwaveConfig['enabled'] || !$flutterwaveConfig['public_key'] || !$flutterwaveConfig['secret_key']) {
                return ['success' => false, 'message' => 'Flutterwave is not configured for this store'];
            }
            
            // Generate unique reference for Flutterwave
            $flutterwaveRef = 'store_fw_' . $order->id . '_' . time() . '_' . uniqid();
            
            // Initialize Flutterwave transaction
            $curl = curl_init();
            curl_setopt_array($curl, [
                CURLOPT_URL => "https://api.flutterwave.com/v3/transactions/" . $flutterwaveRef . "/verify",
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    "Authorization: Bearer " . $flutterwaveConfig['secret_key'],
                    "Content-Type: application/json",
                ],
            ]);
            
            // Update order with Flutterwave details
            $order->update([
                'payment_gateway' => 'flutterwave',
                'payment_transaction_id' => $flutterwaveRef,
                'payment_details' => [
                    'flutterwave_tx_ref' => $flutterwaveRef,
                ],
            ]);
            
            return [
                'success' => true,
                'message' => 'Flutterwave payment initialized successfully',
                'payment_method' => 'flutterwave',
                'payment_data' => [
                    'public_key' => $flutterwaveConfig['public_key'],
                    'tx_ref' => $flutterwaveRef,
                    'amount' => $order->total_amount,
                    'currency' => 'USD',
                    'customer_email' => $order->customer_email,
                    'customer_name' => $order->customer_first_name . ' ' . $order->customer_last_name,
                    'customer_phone' => $order->customer_phone ?: '+1234567890',
                    'redirect_url' => $isCustomDomain ? route('store.flutterwave.success', [
                        'orderNumber' => $order->order_number
                    ]) : route('store.flutterwave.success', [
                        'storeSlug' => $storeSlug ?: $storeModel->slug,
                        'orderNumber' => $order->order_number
                    ]),
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                ]
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Flutterwave payment failed: ' . $e->getMessage()
            ];
        }
    }

    private function clearCart(int $storeId): void
    {
        $query = CartItem::where('store_id', $storeId);
        
        if (Auth::guard('customer')->check()) {
            $query->where('customer_id', Auth::guard('customer')->id());
        } else {
            $query->where('session_id', session()->getId())
                  ->whereNull('customer_id');
        }
        
        $query->delete();
    }
    
    private function processPayTabsPayment(Order $order, string $storeSlug = null): array
    {
        try {
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            // Get store owner's PayTabs settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                return ['success' => false, 'message' => 'Store configuration error'];
            }
            
            $paytabsConfig = getPaymentMethodConfig('paytabs', $storeModel->user->id, $order->store_id);
            
            if (!$paytabsConfig['enabled'] || !$paytabsConfig['server_key'] || !$paytabsConfig['profile_id']) {
                return ['success' => false, 'message' => 'PayTabs is not configured for this store'];
            }
            
            // Generate unique cart ID for PayTabs
            $cartId = 'store_pt_' . $order->id . '_' . time() . '_' . uniqid();
            
            // Force PayTabs configuration (same as working plan purchase)
            config([
                'paytabs.profile_id' => $paytabsConfig['profile_id'],
                'paytabs.server_key' => $paytabsConfig['server_key'],
                'paytabs.region' => $paytabsConfig['region'],
                'paytabs.currency' => 'INR'
            ]);
            
            $successUrl = $isCustomDomain ? (route('store.paytabs.success', [
                'orderNumber' => $order->order_number
            ]) . '?cart_id=' . $cartId) : (route('store.paytabs.success', [
                'storeSlug' => $storeSlug ?: $storeModel->slug,
                'orderNumber' => $order->order_number
            ]) . '?cart_id=' . $cartId);
            
            $callbackUrl = route('store.paytabs.callback');
            
            $pay = \Paytabscom\Laravel_paytabs\Facades\paypage::sendPaymentCode('all')
                ->sendTransaction('sale', 'ecom')
                ->sendCart($cartId, $order->total_amount, "Store Order #{$order->order_number}")
                ->sendCustomerDetails(
                    $order->customer_first_name . ' ' . $order->customer_last_name,
                    $order->customer_email,
                    $order->customer_phone ?? '1234567890',
                    'Address',
                    'City',
                    'State',
                    'SA',
                    '12345',
                    request()->ip()
                )
                ->sendURLs($successUrl, $callbackUrl)
                ->sendLanguage('en')
                ->sendFramed(false)
                ->create_pay_page();
            
            if ($pay) {
                // Update order with PayTabs details
                $order->update([
                    'payment_gateway' => 'paytabs',
                    'payment_transaction_id' => $cartId,
                    'payment_details' => [
                        'paytabs_cart_id' => $cartId,
                    ],
                ]);
                
                // Extract redirect URL from PayTabs response
                $redirectUrl = method_exists($pay, 'getTargetUrl') ? $pay->getTargetUrl() : (string)$pay;
                
                return [
                    'success' => true,
                    'message' => 'PayTabs payment page created successfully',
                    'checkout_url' => $redirectUrl,
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                ];
            }
            
            return ['success' => false, 'message' => 'PayTabs payment initialization failed'];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'PayTabs payment failed: ' . $e->getMessage()
            ];
        }
    }

    private function processCoinGatePayment(Order $order, string $storeSlug = null): array
    {
        try {
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            // Get store model
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                return ['success' => false, 'message' => 'Store configuration error'];
            }
            
            // Get CoinGate configuration
            $coingateConfig = getPaymentMethodConfig('coingate', $storeModel->user->id, $order->store_id);
            
            if (!$coingateConfig['enabled'] || !$coingateConfig['api_token']) {
                return ['success' => false, 'message' => 'CoinGate is not configured for this store'];
            }
            
            // Update order with pending status
            $order->update([
                'payment_gateway' => 'coingate',
                'payment_status' => 'pending',
            ]);
            
            // Return success to redirect to CoinGate controller
            return [
                'success' => true,
                'message' => 'Redirecting to CoinGate payment',
                'checkout_url' => $isCustomDomain ? (route('store.coingate.payment') . '?order_id=' . $order->id) :(route('store.coingate.payment', [
                    'storeSlug' => $storeSlug ?: $storeModel->slug
                ]) . '?order_id=' . $order->id),
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'CoinGate payment failed: ' . $e->getMessage()
            ];
        }
    }

    private function processTapPayment(Order $order, string $storeSlug = null): array
    {
        try {
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            // Get store model
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                return ['success' => false, 'message' => 'Store configuration error'];
            }
            
            // Get Tap configuration
            $tapConfig = getPaymentMethodConfig('tap', $storeModel->user->id, $order->store_id);
            
            if (!$tapConfig['enabled'] || !$tapConfig['secret_key']) {
                return ['success' => false, 'message' => 'Tap is not configured for this store'];
            }

            $postData = [
                'amount' => $order->total_amount,
                'currency' => 'USD',
                'threeDSecure' => true,
                'save_card' => false,
                'description' => 'Order #' . $order->order_number,
                'statement_descriptor' => 'Store Purchase',
                'metadata' => [
                    'udf1' => 'order_' . $order->id,
                    'udf2' => 'store_' . $order->store_id
                ],
                'reference' => [
                    'transaction' => 'store_txn_' . time(),
                    'order' => 'store_ord_' . $order->id . '_' . time()
                ],
                'receipt' => [
                    'email' => true,
                    'sms' => false
                ],
                'customer' => [
                    'first_name' => $order->customer_first_name ?? 'Customer',
                    'middle_name' => '',
                    'last_name' => $order->customer_last_name ?? '',
                    'email' => $order->customer_email,
                    'phone' => [
                        'country_code' => '+965',
                        'number' => '50000000'
                    ]
                ],
                'source' => ['id' => 'src_card'],
                'post' => ['url' => route('store.tap.callback')],
                'redirect' => ['url' => $isCustomDomain ? (route('store.tap.success', [
                    'orderNumber' => $order->order_number
                    ])) : (route('store.tap.success', [
                    'storeSlug' => $storeSlug ?: $storeModel->slug,
                    'orderNumber' => $order->order_number
                ]))]
            ];

            $curl = curl_init();
            curl_setopt_array($curl, [
                CURLOPT_URL => 'https://api.tap.company/v2/charges',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($postData),
                CURLOPT_HTTPHEADER => [
                    'Authorization: Bearer ' . $tapConfig['secret_key'],
                    'Content-Type: application/json'
                ]
            ]);

            $response = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            $curlError = curl_error($curl);
            curl_close($curl);

            if ($curlError) {
                return ['success' => false, 'message' => 'Tap payment connection failed'];
            }

            $responseData = json_decode($response, true);
            
            if ($httpCode === 200 && isset($responseData['transaction']['url'])) {
                $order->update([
                    'payment_gateway' => 'tap',
                    'payment_transaction_id' => $responseData['id'] ?? 'tap_' . time(),
                    'payment_status' => 'pending'
                ]);
                
                return [
                    'success' => true,
                    'message' => 'Tap payment created successfully',
                    'checkout_url' => $responseData['transaction']['url'],
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                ];
            }

            return ['success' => false, 'message' => 'Tap payment initialization failed'];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Tap payment failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Cancel order and restore inventory for failed payments
     */
    public function cancelOrder(Order $order): void
    {
        DB::transaction(function () use ($order) {
            // Restore product inventory
            foreach ($order->items as $orderItem) {
                $product = Product::find($orderItem->product_id);
                if ($product) {
                    $product->increment('stock', $orderItem->quantity);
                }
            }
            
            // Update order status
            $order->update([
                'status' => 'cancelled',
                'payment_status' => 'failed',
                'payment_details' => array_merge($order->payment_details ?? [], [
                    'cancelled_at' => now(),
                    'cancellation_reason' => 'Payment not completed'
                ])
            ]);
        });
    }
}