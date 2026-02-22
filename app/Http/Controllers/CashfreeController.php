<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\User;
use App\Models\PaymentSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class CashfreeController extends Controller
{
    /**
     * Get Cashfree API credentials and configuration
     *
     * @return array
     */
    private function getCashfreeCredentials()
    {
        $settings = getPaymentGatewaySettings();

        // Handle both string and numeric mode values
        $modeValue = $settings['payment_settings']['cashfree_mode'] ?? 'sandbox';

        // Convert to consistent string format
        if ($modeValue === 0 || $modeValue === '0' || $modeValue === 'sandbox') {
            $mode = 'sandbox';
        } else {
            $mode = 'production';
        }

        $baseUrl = $mode === 'production'
            ? 'https://api.cashfree.com/pg'
            : 'https://sandbox.cashfree.com/pg';

        return [
            'app_id' => $settings['payment_settings']['cashfree_public_key'] ?? null,
            'secret_key' => $settings['payment_settings']['cashfree_secret_key'] ?? null,
            'mode' => $mode,
            'base_url' => $baseUrl,
            'currency' => $settings['general_settings']['defaultCurrency'] ?? 'INR'
        ];
    }

    /**
     * Make Cashfree API call
     */
    private function makeCashfreeApiCall($method, $endpoint, $data = null)
    {
        $credentials = $this->getCashfreeCredentials();

        if (!$credentials['app_id'] || !$credentials['secret_key']) {
            throw new \Exception('Cashfree API credentials not found');
        }

        $headers = [
            'x-client-id' => $credentials['app_id'],
            'x-client-secret' => $credentials['secret_key'],
            'x-api-version' => '2023-08-01'
        ];

        if ($data) {
            $headers['Content-Type'] = 'application/json';
        }

        $url = $credentials['base_url'] . $endpoint;

        $response = Http::withHeaders($headers)->$method($url, $data);

        if (!$response->successful()) {
            throw new \Exception('API Error: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Create a Cashfree payment session
     */
    public function createPaymentSession(Request $request)
    {
        $validated = validatePaymentRequest($request);
        $credentials = null;

        try {
            $plan = Plan::findOrFail($validated['plan_id']);
            $pricing = calculatePlanPricing($plan, $validated['coupon_code'] ?? null,$validated['billing_cycle']);

            $credentials = $this->getCashfreeCredentials();

            if (!$credentials['app_id'] || !$credentials['secret_key']) {
                throw new \Exception(__('Cashfree API credentials not found'));
            }

            $amount = (float)$pricing['final_price'];
            if ($amount < 1) {
                throw new \Exception(__('Order amount must be at least 1 INR'));
            }

            $orderId = 'plan_' . $plan->id . '_' . time() . '_' . uniqid();
            $user = auth()->user();

            // Clean phone number
            $phone = $user->phone ?: '9999999999';
            $phone = preg_replace('/[^0-9]/', '', $phone);
            if (strlen($phone) !== 10) {
                $phone = '9999999999';
            }

            // Prepare API request data
            $orderData = [
                'order_id' => $orderId,
                'order_amount' => $amount,
                'order_currency' => 'INR',
                'customer_details' => [
                    'customer_id' => 'user_' . $user->id,
                    'customer_name' => $user->name ?: 'Customer',
                    'customer_email' => $user->email ?: 'customer@example.com',
                    'customer_phone' => $phone
                ],
                'order_meta' => [
                    'return_url' => route('dashboard'),
                    'notify_url' => route('cashfree.webhook')
                ],
                'order_note' => 'Plan Subscription - ' . $plan->name,
                'order_tags' => [
                    'plan_id' => (string)$plan->id,
                    'billing_cycle' => (string)($validated['billing_cycle'] ?? 'monthly'),
                    'user_id' => (string)$user->id
                ]
            ];

            // Make API call
            $responseData = $this->makeCashfreeApiCall('post', '/orders', $orderData);

            return response()->json([
                'payment_session_id' => $responseData['payment_session_id'],
                'order_id' => $orderId,
                'amount' => $amount,
                'currency' => 'INR',
                'mode' => $credentials['mode']
            ]);
        } catch (\Exception $e) {


            return response()->json([
                'error' => 'Failed to create payment session: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Verify Cashfree payment
     */
    public function verifyPayment(Request $request)
    {
        $validated = validatePaymentRequest($request, [
            'order_id' => 'required|string',
            'cf_payment_id' => 'nullable|string'
        ]);

        try {
            $credentials = $this->getCashfreeCredentials();

            if (!$credentials['app_id'] || !$credentials['secret_key']) {
                throw new \Exception(__('Cashfree API credentials not found'));
            }

            // Fetch order status
            $orderData = $this->makeCashfreeApiCall('get', '/orders/' . $validated['order_id']);



            // Check multiple possible status values
            $orderStatus = $orderData['order_status'] ?? $orderData['status'] ?? null;
            if (!in_array($orderStatus, ['PAID', 'SUCCESS', 'ACTIVE'])) {
                throw new \Exception(__('Payment not completed successfully. Status: ') . $orderStatus);
            }

            // Get payment details
            $payments = $this->makeCashfreeApiCall('get', '/orders/' . $validated['order_id'] . '/payments');
            

            
            $successfulPayment = null;

            if (is_array($payments) && !empty($payments)) {
                foreach ($payments as $payment) {
                    $paymentStatus = $payment['payment_status'] ?? $payment['status'] ?? null;
                    if (in_array($paymentStatus, ['SUCCESS', 'PAID', 'COMPLETED'])) {
                        $successfulPayment = $payment;
                        break;
                    }
                }
            }

            if (!$successfulPayment) {

                throw new \Exception(__('No successful payment found for this order'));
            }

            $paymentData = [
                'user_id' => auth()->id(),
                'plan_id' => $validated['plan_id'],
                'billing_cycle' => $validated['billing_cycle'],
                'payment_method' => 'cashfree',
                'coupon_code' => $validated['coupon_code'] ?? null,
                'payment_id' => $successfulPayment['cf_payment_id'],
            ];

            $planOrder = processPaymentSuccess($paymentData);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {

            return response()->json(['error' => __('Payment verification failed: ') . $e->getMessage()], 500);
        }
    }
    
    /**
     * Handle Cashfree webhook
     */
    public function webhook(Request $request)
    {
        try {
            $credentials = $this->getCashfreeCredentials();

            // Verify webhook signature
            $signature = $request->header('x-webhook-signature');
            $timestamp = $request->header('x-webhook-timestamp');
            $rawBody = $request->getContent();

            $expectedSignature = base64_encode(hash_hmac('sha256', $timestamp . $rawBody, $credentials['secret_key'], true));

            if (!hash_equals($expectedSignature, $signature)) {
                return response()->json(['error' => 'Invalid signature'], 400);
            }

            $data = $request->json()->all();

            if ($data['type'] === 'PAYMENT_SUCCESS_WEBHOOK') {
                $paymentData = $data['data'];

                // Extract plan and user info from order tags
                $orderTags = $paymentData['order']['order_tags'] ?? [];

                if (isset($orderTags['plan_id']) && isset($orderTags['user_id'])) {
                    processPaymentSuccess([
                        'user_id' => $orderTags['user_id'],
                        'plan_id' => $orderTags['plan_id'],
                        'billing_cycle' => $orderTags['billing_cycle'] ?? 'monthly',
                        'payment_method' => 'cashfree',
                        'payment_id' => $paymentData['cf_payment_id'],
                    ]);
                }
            }

            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            return response()->json(['error' => __('Webhook processing failed')], 500);
        }
    }
}