<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class PaystackController extends Controller
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
                if ($isCustomDomain) {
                    return redirect()->route('store.home')
                        ->withErrors(['error' => 'Order not found']);
                }
                return redirect()->route('store.home', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'Order not found']);
            }
            
            // Get reference from request
            $reference = $request->get('reference') ?: $request->get('trxref');
            
            if (!$reference) {
                if ($isCustomDomain) {
                    return redirect()->route('store.home')
                        ->withErrors(['error' => __('Payment reference not found')]);
                }
                return redirect()->route('store.home', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => __('Payment reference not found')]);
            }
            
            // Get store owner's Paystack settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                if ($isCustomDomain) {
                    return redirect()->route('store.home')
                        ->withErrors(['error' => 'Store configuration error']);
                }
                return redirect()->route('store.home', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'Store configuration error']);
            }
            
            $paystackConfig = getPaymentMethodConfig('paystack', $storeModel->user->id, $order->store_id);
            
            if (!$paystackConfig['enabled'] || !$paystackConfig['secret_key']) {
                return redirect()->route('store.home', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'Paystack not configured']);
            }
            
            // Verify payment with Paystack API
            $curl = curl_init();
            curl_setopt_array($curl, [
                CURLOPT_URL => "https://api.paystack.co/transaction/verify/" . $reference,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    "Authorization: Bearer " . $paystackConfig['secret_key'],
                    "Cache-Control: no-cache",
                ],
            ]);
            
            $response = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);
            
            if ($httpCode !== 200) {
                return redirect()->route('store.home', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'Payment verification failed']);
            }
            
            $result = json_decode($response, true);
            
            if (!$result || !$result['status'] || $result['data']['status'] !== 'success') {
                return redirect()->route('store.home', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'Payment was not successful']);
            }
            
            // Verify amount matches
            $paidAmount = $result['data']['amount'] / 100; // Convert from kobo
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
                    'paystack_transaction_id' => $result['data']['id'],
                    'paystack_reference' => $reference,
                    'paid_at' => now(),
                    'verification_response' => $result['data']
                ])
            ]);
            
            if ($isCustomDomain) {
                return redirect()->route('store.order-confirmation', ['orderNumber' => $orderNumber])
                    ->with('success', 'Payment successful! Your order has been confirmed.');
            }
            
            return redirect()->route('store.order-confirmation', [
                'storeSlug' => $storeSlug,
                'orderNumber' => $orderNumber
            ])->with('success', 'Payment successful! Your order has been confirmed.');
            
        } catch (\Exception $e) {
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            if ($isCustomDomain) {
                return redirect()->route('store.home')
                    ->withErrors(['error' => 'Payment verification failed: ' . $e->getMessage()]);
            }
            
            return redirect()->route('store.home', ['storeSlug' => $storeSlug])
                ->withErrors(['error' => 'Payment verification failed']);
        }
    }
}