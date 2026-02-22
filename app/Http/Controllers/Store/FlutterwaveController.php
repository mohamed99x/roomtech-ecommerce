<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class FlutterwaveController extends Controller
{
    public function success(Request $request)
    {
        try {
            $storeSlug = request()->route('storeSlug') ?? null;
            [$store, $storeSlug] = resolveStore($request, $storeSlug);
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            $orderNumber = request()->route('orderNumber') ?? (request()->route('storeSlug') ?? null);
            $order = Order::where('order_number', $orderNumber)->first();
            
            if (!$order) {
                return redirect()->route('store.home', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'Order not found']);
            }
            
            // Get transaction ID from request
            $transactionId = $request->get('transaction_id');
            $txRef = $request->get('tx_ref');
            
            if (!$transactionId || !$txRef) {
                if ($isCustomDomain) {
                    return redirect()->route('store.home')
                        ->withErrors(['error' => __('Transaction details not found')]);
                }
                return redirect()->route('store.home', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => __('Transaction details not found')]);
            }
            
            // Get store owner's Flutterwave settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                if ($isCustomDomain) {
                    return redirect()->route('store.home')
                        ->withErrors(['error' => 'Store configuration error']);
                }
                return redirect()->route('store.home', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'Store configuration error']);
            }
            
            $flutterwaveConfig = getPaymentMethodConfig('flutterwave', $storeModel->user->id, $order->store_id);
            
            if (!$flutterwaveConfig['enabled'] || !$flutterwaveConfig['secret_key']) {
                if ($isCustomDomain) {
                    return redirect()->route('store.home')
                        ->withErrors(['error' => 'Flutterwave not configured']);
                }
                return redirect()->route('store.home', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'Flutterwave not configured']);
            }
            
            // Verify payment with Flutterwave API
            $curl = curl_init();
            curl_setopt_array($curl, [
                CURLOPT_URL => "https://api.flutterwave.com/v3/transactions/" . $transactionId . "/verify",
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    "Authorization: Bearer " . $flutterwaveConfig['secret_key'],
                    "Content-Type: application/json",
                ],
            ]);
            
            $response = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);
            
            if ($httpCode !== 200) {
                if ($isCustomDomain) {
                    return redirect()->route('store.home')
                        ->withErrors(['error' => 'Payment verification failed']);
                }
                return redirect()->route('store.home', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'Payment verification failed']);
            }
            
            $result = json_decode($response, true);
            
            if (!$result || $result['status'] !== 'success' || $result['data']['status'] !== 'successful') {
                if ($isCustomDomain) {
                    return redirect()->route('store.home')
                        ->withErrors(['error' => 'Payment was not successful']);
                }
                return redirect()->route('store.home', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'Payment was not successful']);
            }
            
            // Verify amount matches
            $paidAmount = $result['data']['amount'];
            if (abs($paidAmount - $order->total_amount) > 0.01) {
                if ($isCustomDomain) {
                    return redirect()->route('store.home')
                        ->withErrors(['error' => 'Payment amount mismatch']);
                }
                return redirect()->route('store.home', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'Payment amount mismatch']);
            }
            
            // Update order status
            $order->update([
                'status' => 'confirmed',
                'payment_status' => 'paid',
                'payment_details' => array_merge($order->payment_details ?? [], [
                    'flutterwave_transaction_id' => $transactionId,
                    'flutterwave_tx_ref' => $txRef,
                    'paid_at' => now(),
                    'verification_response' => $result['data']
                ])
            ]);
            
            if ($isCustomDomain) {
                return redirect()->route('store.order-confirmation', [
                    'orderNumber' => $order->order_number
                ])->with('success', 'Payment successful! Your order has been confirmed.');
            }
            return redirect()->route('store.order-confirmation', [
                'storeSlug' => $storeSlug,
                'orderNumber' => $orderNumber
            ])->with('success', 'Payment successful! Your order has been confirmed.');
            
        } catch (\Exception $e) {
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            if ($isCustomDomain) {
                return redirect()->route('store.home')
                    ->withErrors(['error' => 'Payment verification failed']);
            }
            return redirect()->route('store.home', ['storeSlug' => $storeSlug])
                ->withErrors(['error' => 'Payment verification failed']);
        }
    }
}