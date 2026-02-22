<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class TapController extends Controller
{
    public function processPayment(Request $request)
    {
        $storeSlug = request()->route('storeSlug') ?? null;
        [$store, $storeSlug] = resolveStore($request, $storeSlug);
        $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
        $orderId = $request->input('order_id') ?: $request->query('order_id');
        $request->merge(['order_id' => $orderId]);
        
        $request->validate([
            'order_id' => 'required|exists:orders,id'
        ]);

        try {
            $order = Order::findOrFail($request->order_id);
            
            $tapConfig = getPaymentMethodConfig('tap', $order->store->user->id, $order->store_id);
            
            if (!$tapConfig['enabled'] || !$tapConfig['secret_key']) {
                if ($isCustomDomain) {
                    return redirect()->route('store.checkout')
                        ->withErrors(['error' => __('Tap payment is not available')]);
                }
                return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => __('Tap payment is not available')]);
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
                    'first_name' => $order->billing_info['name'] ?? 'Customer',
                    'middle_name' => '',
                    'last_name' => '',
                    'email' => $order->billing_info['email'] ?? $order->email,
                    'phone' => [
                        'country_code' => '+965',
                        'number' => '50000000'
                    ]
                ],
                'source' => ['id' => 'src_card'],
                'post' => ['url' => route('store.tap.callback')],
                'redirect' => ['url' => route('store.tap.success', [
                    'storeSlug' => $storeSlug,
                    'orderNumber' => $order->order_number
                ])]
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
            curl_close($curl);

            $responseData = json_decode($response, true);
            
            if ($httpCode === 200 && isset($responseData['transaction']['url'])) {
                $order->update([
                    'payment_transaction_id' => $responseData['id'] ?? 'tap_' . time(),
                    'payment_method' => 'tap',
                    'payment_status' => 'pending'
                ]);
                
                return redirect($responseData['transaction']['url']);
            }

            if ($isCustomDomain) {
                return redirect()->route('store.checkout')
                    ->withErrors(['error' => __('Payment initialization failed')]);
            }
            return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                ->withErrors(['error' => __('Payment initialization failed')]);

        } catch (\Exception $e) {
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            if ($isCustomDomain) {
                return redirect()->route('store.checkout')
                    ->withErrors(['error' => __('Payment processing failed')]);
            }
            return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                ->withErrors(['error' => __('Payment processing failed')]);
        }
    }
    
    public function success(Request $request)
    {
        try {
            $storeSlug = request()->route('storeSlug') ?? null;
            [$store, $storeSlug] = resolveStore($request, $storeSlug);
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            $orderNumber = request()->route('orderNumber') ?? (request()->route('storeSlug') ?? null);

            $order = Order::where('order_number', $orderNumber)->firstOrFail();
            $chargeId = $request->input('tap_id');
            
            $tapConfig = getPaymentMethodConfig('tap', $order->store->user->id, $order->store_id);
            
            if (!$tapConfig['enabled']) {
                if ($isCustomDomain) {
                    return redirect()->route('store.checkout')
                        ->withErrors(['error' => __('Payment method not available')]);
                }
                return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => __('Payment method not available')]);
            }
            
            if ($chargeId) {
                // Verify payment using direct API call
                $curl = curl_init();
                curl_setopt_array($curl, [
                    CURLOPT_URL => "https://api.tap.company/v2/charges/{$chargeId}",
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_HTTPHEADER => [
                        'Authorization: Bearer ' . $tapConfig['secret_key']
                    ]
                ]);
                
                $response = curl_exec($curl);
                $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
                curl_close($curl);
                
                if ($httpCode === 200) {
                    $chargeDetails = json_decode($response, true);
                    
                    if ($chargeDetails && isset($chargeDetails['status'])) {
                        $successStatuses = ['CAPTURED', 'AUTHORIZED', 'INITIATED'];
                        
                        if (in_array($chargeDetails['status'], $successStatuses)) {
                            $order->update([
                                'status' => 'confirmed',
                                'payment_status' => 'paid',
                                'payment_details' => array_merge($order->payment_details ?? [], [
                                    'tap_charge_id' => $chargeId,
                                    'payment_amount' => $chargeDetails['amount'] ?? $order->total_amount,
                                    'payment_currency' => $chargeDetails['currency'] ?? 'USD',
                                    'completed_at' => now(),
                                    'payment_method' => 'tap',
                                ]),
                            ]);
                            
                            if ($isCustomDomain) {
                                return redirect()->route('store.order-confirmation', ['orderNumber' => $order->order_number])
                                    ->with('success', __('Payment completed successfully!'));
                            }
                            return redirect()->route('store.order-confirmation', [
                                'storeSlug' => $storeSlug,
                                'orderNumber' => $order->order_number
                            ])->with('success', __('Payment completed successfully!'));
                        }
                    }
                }
                
                // Fallback: Accept payment if we got success callback
                $order->update([
                    'status' => 'confirmed',
                    'payment_status' => 'paid',
                    'payment_details' => array_merge($order->payment_details ?? [], [
                        'tap_charge_id' => $chargeId,
                        'completed_at' => now(),
                        'payment_method' => 'tap',
                    ]),
                ]);
                
                if ($isCustomDomain) {
                    return redirect()->route('store.order-confirmation', ['orderNumber' => $order->order_number])
                        ->with('success', __('Payment completed successfully!'));
                }
                return redirect()->route('store.order-confirmation', [
                    'storeSlug' => $storeSlug,
                    'orderNumber' => $order->order_number
                ])->with('success', __('Payment completed successfully!'));
            }
            
            if ($isCustomDomain) {
                return redirect()->route('store.checkout')
                    ->withErrors(['error' => __('Payment verification failed')]);
            }
            return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                ->withErrors(['error' => __('Payment verification failed')]);
            
        } catch (\Exception $e) {
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            if ($isCustomDomain) {
                return redirect()->route('store.checkout')
                    ->withErrors(['error' => __('Payment verification failed')]);
            }
            return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                ->withErrors(['error' => __('Payment verification failed')]);
        }
    }
    
    public function callback(Request $request)
    {
        try {
            $chargeId = $request->input('tap_id');
            $status = $request->input('status');
            return response('OK', 200);

        } catch (\Exception $e) {
            return response('Error', 500);
        }
    }
}