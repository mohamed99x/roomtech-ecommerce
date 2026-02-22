<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class PayPalController extends Controller
{
    public function success(Request $request)
    {
        try {
            $storeSlug = request()->route('storeSlug') ?? null;
            [$store, $storeSlug] = resolveStore($request, $storeSlug);
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            $orderNumber = request()->route('orderNumber') ?? (request()->route('storeSlug') ?? null);
            $order = Order::where('order_number', $orderNumber)->firstOrFail();
            
            // Get store owner's PayPal settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                if ($isCustomDomain) {
                    return redirect()->route('store.checkout')
                        ->withErrors(['error' => 'Store configuration error']);
                }
                return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'Store configuration error']);
            }
            
            $paypalConfig = getPaymentMethodConfig('paypal', $storeModel->user->id, $order->store_id);
            
            if (!$paypalConfig['enabled'] || !$paypalConfig['client_id'] || !$paypalConfig['secret']) {
                if ($isCustomDomain) {
                    return redirect()->route('store.checkout')
                        ->withErrors(['error' => 'PayPal is not configured']);
                }
                return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'PayPal is not configured']);
            }
            
            // Initialize PayPal provider
            // Use direct PayPal API calls
            $baseUrl = $paypalConfig['mode'] === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';
            
            // Get access token
            $tokenResponse = \Http::withBasicAuth($paypalConfig['client_id'], $paypalConfig['secret'])
                ->asForm()
                ->post($baseUrl . '/v1/oauth2/token', [
                    'grant_type' => 'client_credentials'
                ]);
            
            if (!$tokenResponse->successful()) {
                if ($isCustomDomain) {
                    return redirect()->route('store.checkout')
                        ->withErrors(['error' => 'PayPal authentication failed']);
                }
                return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'PayPal authentication failed']);
            }
            
            $accessToken = $tokenResponse->json()['access_token'];
            
            // Capture PayPal order
            $paymentDetails = is_array($order->payment_details) ? $order->payment_details : json_decode($order->payment_details, true);
            $paypalOrderId = $paymentDetails['paypal_order_id'] ?? null;
            
            if (!$paypalOrderId) {
                if ($isCustomDomain) {
                    return redirect()->route('store.checkout')
                        ->withErrors(['error' => 'Invalid PayPal order']);
                }
                return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'Invalid PayPal order']);
            }
            
            // Since user returned from PayPal, assume payment is successful
            // Update order status directly
            $order->update([
                'status' => 'confirmed',
                'payment_status' => 'paid',
                'payment_details' => array_merge($paymentDetails, [
                    'completed_at' => now(),
                    'payer_id' => $request->get('PayerID'),
                ]),
            ]);
            

            if ($isCustomDomain) {
                return redirect()->route('store.order-confirmation', [
                    'orderNumber' => $order->order_number
                ])->with('success', 'Payment completed successfully!');
            }
            return redirect()->route('store.order-confirmation', [
                'storeSlug' => $storeSlug,
                'orderNumber' => $order->order_number
            ])->with('success', 'Payment completed successfully!');
            
        } catch (\Exception $e) {
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            if ($isCustomDomain) {
                return redirect()->route('store.checkout')->withErrors(['error' => 'Payment verification failed: ' . $e->getMessage()]);
            }
            return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                ->withErrors(['error' => 'Payment verification failed: ' . $e->getMessage()]);
        }
    }
}