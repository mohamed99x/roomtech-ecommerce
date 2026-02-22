<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use App\Services\CartCalculationService;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrderController extends Controller
{
    protected $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public function placeOrder(Request $request)
    {
        $storeSlug = request()->route('storeSlug') ?? null;
        [$store, $storeSlug] = resolveStore($request, $storeSlug);
        try {
            $validationRules = [
                'store_id' => 'required|exists:stores,id',
                'customer_first_name' => 'required|string|max:255',
                'customer_last_name' => 'required|string|max:255',
                'customer_email' => 'required|email|max:255',
                'customer_phone' => 'nullable|string|max:20',
                'shipping_address' => 'required|string|max:255',
                'shipping_city' => 'required|string|max:100',
                'shipping_state' => 'required|string|max:100',
                'shipping_postal_code' => 'required|string|max:20',
                'shipping_country' => 'required|string|max:100',
                'billing_address' => 'required|string|max:255',
                'billing_city' => 'required|string|max:100',
                'billing_state' => 'required|string|max:100',
                'billing_postal_code' => 'required|string|max:20',
                'billing_country' => 'required|string|max:100',
                'payment_method' => 'required|string',
                'shipping_method_id' => 'nullable|exists:shippings,id',
                'notes' => 'nullable|string',
                'coupon_code' => 'nullable|string',
                'whatsapp_number' => 'nullable|string|max:20',
                'bank_transfer_receipt' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            ];
            
            // Add WhatsApp number validation if payment method is WhatsApp
            if ($request->payment_method === 'whatsapp') {
                $validationRules['whatsapp_number'] = 'required|string|regex:/^[+]?[0-9]{10,15}$/|max:20';
            }
            
            // Add bank transfer file validation if payment method is bank
            if ($request->payment_method === 'bank') {
                $validationRules['bank_transfer_receipt'] = 'required|file|mimes:jpg,jpeg,png,pdf|max:5120';
            }
            
            $validator = \Validator::make($request->all(), $validationRules);

            if ($validator->fails()) {
                if ($request->expectsJson() || $request->ajax()) {
                    return response()->json([
                        'success' => false,
                        'message' => $validator->errors()->first(),
                        'errors' => $validator->errors()
                    ], 422);
                }
                return back()->withErrors($validator)->withInput();
            }
            // Get cart calculation
            $calculation = CartCalculationService::calculateCartTotals(
                $request->store_id,
                session()->getId(),
                $request->coupon_code,
                $request->shipping_method_id
            );

            if ($calculation['items']->isEmpty()) {
                return back()->withErrors(['cart' => 'Your cart is empty']);
            }

            // Handle bank transfer receipt upload
            $bankTransferReceiptPath = null;
            if ($request->payment_method === 'bank' && $request->hasFile('bank_transfer_receipt')) {
                $file = $request->file('bank_transfer_receipt');
                $bankTransferReceiptPath = $file->store('bank_transfers', 'public');
            }
            
            // Prepare order data
            $orderData = [
                'store_id' => $request->store_id,
                'customer_first_name' => $request->customer_first_name,
                'customer_last_name' => $request->customer_last_name,
                'customer_email' => $request->customer_email,
                'customer_phone' => $request->customer_phone,
                'shipping_address' => $request->shipping_address,
                'shipping_city' => $request->shipping_city,
                'shipping_state' => $request->shipping_state,
                'shipping_postal_code' => $request->shipping_postal_code,
                'shipping_country' => $request->shipping_country,
                'billing_address' => $request->billing_address,
                'billing_city' => $request->billing_city,
                'billing_state' => $request->billing_state,
                'billing_postal_code' => $request->billing_postal_code,
                'billing_country' => $request->billing_country,
                'subtotal' => $calculation['subtotal'],
                'tax_amount' => $calculation['tax'],
                'shipping_amount' => $calculation['shipping'],
                'discount_amount' => $calculation['discount'],
                'total_amount' => $calculation['total'],
                'payment_method' => $request->payment_method,
                'shipping_method_id' => $request->shipping_method_id,
                'notes' => $request->notes,
                'coupon_code' => $request->coupon_code,
                'coupon_discount' => $calculation['discount'],
                'whatsapp_number' => $request->whatsapp_number,
            ];

            if ($request->payment_method === 'bank') {
                $orderData['bank_transfer_receipt'] = $bankTransferReceiptPath;
            }

            // Prepare cart items
            $cartItems = $calculation['items']->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    'name' => $item->product->name,
                    'sku' => $item->product->sku,
                    'price' => $item->product->price,
                    'sale_price' => $item->product->sale_price,
                    'quantity' => $item->quantity,
                    'variants' => $item->variants,
                ];
            })->toArray();

            // Create order
            $order = $this->orderService->createOrder($orderData, $cartItems);

            // Update coupon usage if coupon was used
            if ($request->coupon_code && $calculation['coupon']) {
                $calculation['coupon']->increment('used_count');
            }

            // Process payment
            $paymentResult = $this->orderService->processPayment($order, $storeSlug);

            if ($paymentResult['success']) {
                // For Stripe, PayPal, PayFast, MercadoPago, Paystack, PayTabs, CoinGate, and Tap, redirect to checkout URL
                if (in_array($request->payment_method, ['stripe', 'paypal', 'payfast', 'mercadopago', 'paystack', 'paytabs', 'coingate', 'tap']) && isset($paymentResult['checkout_url'])) {
                    return redirect($paymentResult['checkout_url']);
                }
                
                // For Cashfree, return payment session data for frontend processing
                if ($request->payment_method === 'cashfree') {
                    return response()->json([
                        'success' => true,
                        'payment_method' => 'cashfree',
                        'payment_session_id' => $paymentResult['payment_session_id'],
                        'cashfree_order_id' => $paymentResult['cashfree_order_id'],
                        'mode' => $paymentResult['mode'],
                        'public_key' => $paymentResult['public_key'],
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'return_url' => route('store.order-confirmation', [
                            'storeSlug' => $storeSlug,
                            'orderNumber' => $order->order_number
                        ])
                    ]);
                }
                
                // For Razorpay, return payment data for frontend processing
                if ($request->payment_method === 'razorpay') {
                    return response()->json([
                        'success' => true,
                        'payment_method' => 'razorpay',
                        'payment_data' => [
                            'razorpay_order_id' => $paymentResult['razorpay_order_id'],
                            'amount' => $paymentResult['amount'],
                            'currency' => $paymentResult['currency'],
                            'key_id' => $paymentResult['key_id'],
                            'order_id' => $order->id,
                            'order_number' => $order->order_number,
                        ]
                    ]);
                }
                
                // For Flutterwave, return payment data for frontend processing
                if ($request->payment_method === 'flutterwave') {
                    return response()->json([
                        'success' => true,
                        'payment_method' => 'flutterwave',
                        'payment_data' => $paymentResult['payment_data']
                    ]);
                }
                
                // For Flutterwave, return payment data for frontend processing
                if ($request->payment_method === 'flutterwave') {
                    return response()->json([
                        'success' => true,
                        'payment_method' => 'flutterwave',
                        'payment_data' => $paymentResult['payment_data']
                    ]);
                }
                
                // For PayFast, create auto-submit form
                if ($request->payment_method === 'payfast' && isset($paymentResult['payfast_data'])) {
                    $htmlForm = '';
                    foreach ($paymentResult['payfast_data'] as $name => $value) {
                        $htmlForm .= '<input name="' . $name . '" type="hidden" value="' . $value . '" />';
                    }
                    
                    $autoSubmitForm = '<html><body><form id="payfast-form" method="POST" action="' . $paymentResult['payfast_endpoint'] . '">' . 
                        $htmlForm . 
                        '</form><script>document.getElementById("payfast-form").submit();</script></body></html>';
                    
                    return response($autoSubmitForm);
                }
                
                // For WhatsApp payment
                if ($request->payment_method === 'whatsapp') {
                    if ($request->expectsJson() || $request->ajax()) {
                        return response()->json([
                            'success' => true,
                            'order_number' => $order->order_number,
                            'message' => $paymentResult['message']
                        ]);
                    }
                    return redirect()->route('store.order-confirmation', [
                        'storeSlug' => $storeSlug,
                        'orderNumber' => $order->order_number
                    ])->with('success', $paymentResult['message']);
                }
                
                // For Telegram payment
                if ($request->payment_method === 'telegram') {
                    if ($request->expectsJson() || $request->ajax()) {
                        return response()->json([
                            'success' => true,
                            'order_number' => $order->order_number,
                            'message' => $paymentResult['message']
                        ]);
                    }
                    return redirect()->route('store.order-confirmation', [
                        'storeSlug' => $storeSlug,
                        'orderNumber' => $order->order_number
                    ])->with('success', $paymentResult['message']);
                }
                
                // For other payment methods (COD, Bank Transfer, etc.)
                if ($request->expectsJson() || $request->ajax()) {
                    return response()->json([
                        'success' => true,
                        'order_number' => $order->order_number,
                        'message' => $paymentResult['message']
                    ]);
                }
                
                return redirect()->route('store.order-confirmation', [
                    'storeSlug' => $storeSlug,
                    'orderNumber' => $order->order_number
                ])->with('success', $paymentResult['message']);
            } else {
                // If payment failed, cancel the order and restore inventory
                if (isset($order)) {
                    $this->orderService->cancelOrder($order);
                }
                
                // Return JSON response for AJAX requests (like Cashfree)
                if ($request->expectsJson() || $request->ajax()) {
                    return response()->json(['error' => $paymentResult['message']], 400);
                }
                
                return back()->withErrors(['payment' => $paymentResult['message']]);
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->validator->errors()->first(),
                    'errors' => $e->validator->errors()
                ], 422);
            }
            throw $e;
        } catch (\Exception $e) {
            // If order was created but payment failed, cancel it
            if (isset($order)) {
                try {
                    $this->orderService->cancelOrder($order);
                } catch (\Exception $cancelException) {
                    // Silently handle cancellation error
                }
            }
            
            // Return JSON response for AJAX requests (like Cashfree)
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => 'Failed to place order: ' . $e->getMessage()], 500);
            }
            
            return back()->withErrors(['error' => 'Failed to place order: ' . $e->getMessage()]);
        }
    }


}