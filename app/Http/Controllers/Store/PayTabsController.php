<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class PayTabsController extends Controller
{
    public function success(Request $request)
    {
        try {
            $storeSlug = request()->route('storeSlug') ?? null;
            [$store, $storeSlug] = resolveStore($request, $storeSlug);
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            $orderNumber = request()->route('orderNumber') ?? (request()->route('storeSlug') ?? null);
            $cartId = $request->input('cart_id');
            $order = Order::where('order_number', $orderNumber)->firstOrFail();
            
            // Verify cart_id matches if provided
            if ($cartId) {
                $orderCartId = $order->payment_details['paytabs_cart_id'] ?? null;
                if ($orderCartId && $orderCartId !== $cartId) {
                    if ($isCustomDomain) {
                        return redirect()->route('store.checkout')
                            ->withErrors(['error' => 'Invalid payment session']);
                    }
                    return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                        ->withErrors(['error' => 'Invalid payment session']);
                }
            }
            
            // PayTabs only redirects to success URL on successful payment
            if ($order->payment_status === 'pending') {
                $order->update([
                    'status' => 'confirmed',
                    'payment_status' => 'paid',
                    'payment_details' => array_merge($order->payment_details ?? [], [
                        'completed_at' => now(),
                        'payment_method' => 'paytabs',
                    ]),
                ]);
            }
            
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
                return redirect()->route('store.checkout')
                    ->withErrors(['error' => 'Payment verification failed: ' . $e->getMessage()]);
            }
            return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                ->withErrors(['error' => 'Payment verification failed: ' . $e->getMessage()]);
        }
    }
    
    public function callback(Request $request)
    {
        try {
            $cartId = $request->input('cart_id');
            $respStatus = $request->input('resp_status');
            $tranRef = $request->input('tran_ref');
            
            if (!$cartId) {
                return response('Missing cart ID', 400);
            }
            
            $order = Order::where('payment_details->paytabs_cart_id', $cartId)->first();
            
            if (!$order) {
                return response('Order not found', 404);
            }
            
            if ($respStatus === 'A') {
                if ($order->payment_status === 'pending') {
                    $order->update([
                        'status' => 'confirmed',
                        'payment_status' => 'paid',
                        'payment_details' => array_merge($order->payment_details ?? [], [
                            'completed_at' => now(),
                            'transaction_ref' => $tranRef,
                        ])
                    ]);
                }
            } else {
                $order->update([
                    'status' => 'failed',
                    'payment_status' => 'failed'
                ]);
            }
            
            return response('OK', 200);
            
        } catch (\Exception $e) {
            return response('Callback processing failed', 500);
        }
    }
}