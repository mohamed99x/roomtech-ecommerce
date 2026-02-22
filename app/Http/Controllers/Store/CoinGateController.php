<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use CoinGate\Client;
use Illuminate\Support\Facades\Log;
use Exception;

class CoinGateController extends Controller
{
    public function processPayment(Request $request)
    {
        $storeSlug = request()->route('storeSlug') ?? null;
        [$store, $storeSlug] = resolveStore($request, $storeSlug);
        $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
        // Get order_id from request body or URL parameter
        $orderId = $request->input('order_id') ?: $request->query('order_id');
        
        $request->merge(['order_id' => $orderId]);
        
        $request->validate([
            'order_id' => 'required|exists:orders,id'
        ]);

        try {
            $order = Order::findOrFail($request->order_id);
            
            // Get store's CoinGate configuration
            $coingateConfig = getPaymentMethodConfig('coingate', $order->store->user->id, $order->store_id);
            
            if (!$coingateConfig['enabled'] || !$coingateConfig['api_token']) {
                if ($isCustomDomain) {
                    return redirect()->route('store.checkout')
                        ->withErrors(['error' => __('CoinGate payment is not available')]);
                }
                return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => __('CoinGate payment is not available')]);
            }
            
            // Use official CoinGate package
            $client = new Client(
                $coingateConfig['api_token'], 
                ($coingateConfig['mode'] ?? 'sandbox') === 'sandbox'
            );
            
            $orderId = 'store_' . $order->id . '_' . time();
            
            // Get currency from order or default to USD
            $currency = 'USD'; // You can modify this based on your store currency settings
            
            $orderParams = [
                'order_id' => $orderId,
                'price_amount' => (float) $order->total_amount,
                'price_currency' => $currency,
                'receive_currency' => $currency,
                'callback_url' => route('store.coingate.callback'),
                'cancel_url' => route('store.checkout', ['storeSlug' => $storeSlug]),
                'success_url' => route('store.coingate.success', ['storeSlug' => $storeSlug, 'orderNumber' => $order->order_number]),
                'title' => 'Order #' . $order->order_number,
                'description' => 'Payment for order #' . $order->order_number . ' from ' . ($order->store->name ?? 'Store'),
            ];
            
            $orderResponse = $client->order->create($orderParams);
            
            if ($orderResponse && isset($orderResponse->payment_url)) {
                // Update order with CoinGate transaction ID
                $order->update([
                    'payment_transaction_id' => $orderId,
                    'payment_method' => 'coingate',
                    'payment_status' => 'pending'
                ]);
                
                return redirect($orderResponse->payment_url);
            } else {
                if ($isCustomDomain) {
                    return redirect()->route('store.checkout')
                        ->withErrors(['error' => __('Payment initialization failed')]);
                }
                return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => __('Payment initialization failed')]);
            }
            
        } catch (\Exception $e) {
            Log::error('Store CoinGate payment error: ' . $e->getMessage());
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
            
            // Get store's CoinGate configuration
            $coingateConfig = getPaymentMethodConfig('coingate', $order->store->user->id, $order->store_id);
            
            if (!$coingateConfig['enabled']) {
                if ($isCustomDomain) {
                    return redirect()->route('store.checkout')
                        ->withErrors(['error' => __('Payment method not available')]);
                }
                return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => __('Payment method not available')]);
            }
            
            // If payment is still pending, mark as paid (CoinGate only redirects on success)
            if ($order->payment_status === 'pending') {
                $order->update([
                    'status' => 'confirmed',
                    'payment_status' => 'paid',
                    'payment_details' => array_merge($order->payment_details ?? [], [
                        'completed_at' => now(),
                        'payment_method' => 'coingate',
                    ]),
                ]);
            }
            
            if ($isCustomDomain) {
                return redirect()->route('store.order-confirmation', [
                    'orderNumber' => $order->order_number
                ])->with('success', __('Payment completed successfully!'));
            }
            return redirect()->route('store.order-confirmation', [
                'storeSlug' => $storeSlug,
                'orderNumber' => $order->order_number
            ])->with('success', __('Payment completed successfully!'));
            
        } catch (\Exception $e) {
            Log::error('Store CoinGate success error: ' . $e->getMessage());
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
            Log::info('Store CoinGate callback received', $request->all());
            
            $orderId = $request->input('order_id');
            if (!$orderId) {
                Log::error('CoinGate callback: Missing order ID');
                return response()->json(['error' => 'Missing order ID'], 400);
            }
            
            $order = Order::where('payment_transaction_id', $orderId)->first();
            if (!$order) {
                Log::error('CoinGate callback: Order not found', ['order_id' => $orderId]);
                return response()->json(['error' => 'Order not found'], 404);
            }
            
            // Get store's CoinGate configuration
            $coingateConfig = getPaymentMethodConfig('coingate', $order->store->user->id, $order->store_id);
            
            if (!$coingateConfig['enabled'] || !$coingateConfig['api_token']) {
                Log::error('CoinGate not configured for store', ['store_id' => $order->store_id]);
                return response()->json(['error' => 'Payment gateway not configured'], 400);
            }
            
            // Verify payment status with CoinGate API
            $client = new Client(
                $coingateConfig['api_token'], 
                ($coingateConfig['mode'] ?? 'sandbox') === 'sandbox'
            );
            
            $coingateOrder = $client->order->get($orderId);
            
            if ($coingateOrder && $coingateOrder->status === 'paid') {
                // Update order status
                $order->update([
                    'status' => 'confirmed',
                    'payment_status' => 'paid',
                    'payment_details' => array_merge($order->payment_details ?? [], [
                        'coingate_order_id' => $coingateOrder->id,
                        'payment_amount' => $coingateOrder->price_amount,
                        'payment_currency' => $coingateOrder->price_currency,
                        'crypto_amount' => $coingateOrder->receive_amount ?? null,
                        'crypto_currency' => $coingateOrder->receive_currency ?? null,
                        'callback_received_at' => now(),
                    ]),
                ]);
                
                Log::info('Store order payment confirmed via CoinGate callback', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'coingate_order_id' => $coingateOrder->id
                ]);
            }
            
            return response()->json(['status' => 'success']);
            
        } catch (\Exception $e) {
            Log::error('Store CoinGate callback error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Callback processing failed'], 500);
        }
    }
}