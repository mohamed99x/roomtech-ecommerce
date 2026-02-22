<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\PaymentIntent;

class StripeController extends Controller
{
    public function success(Request $request)
    {
        try {
            $storeSlug = request()->route('storeSlug') ?? null;
            [$store, $storeSlug] = resolveStore($request, $storeSlug);
            $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
            $orderNumber = request()->route('orderNumber') ?? (request()->route('storeSlug') ?? null);
            $order = Order::where('order_number', $orderNumber)->firstOrFail();
            
            // Get store owner's Stripe settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                if ($isCustomDomain) {
                    return redirect()->route('store.checkout')
                        ->withErrors(['error' => 'Store configuration error']);
                }
                return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                        ->withErrors(['error' => 'Store configuration error']);
            }
            
            $stripeConfig = getPaymentMethodConfig('stripe', $storeModel->user->id, $order->store_id);
            
            if (!$stripeConfig['enabled'] || !$stripeConfig['secret']) {
                if ($isCustomDomain) {
                    return redirect()->route('store.checkout')
                        ->withErrors(['error' => 'Stripe is not configured']);
                }
                return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'Stripe is not configured']);
            }
            
            Stripe::setApiKey($stripeConfig['secret']);
            
            // Retrieve checkout session
            $sessionId = $order->payment_details['checkout_session_id'] ?? null;
            if (!$sessionId) {
                if ($isCustomDomain) {
                    return redirect()->route('store.checkout')
                        ->withErrors(['error' => 'Invalid payment session']);
                }
                return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'Invalid payment session']);
            }
            
            $session = \Stripe\Checkout\Session::retrieve($sessionId);
            
            if ($session->payment_status === 'paid') {
                $order->update([
                    'status' => 'confirmed',
                    'payment_status' => 'paid',
                    'payment_details' => array_merge($order->payment_details ?? [], [
                        'payment_intent_id' => $session->payment_intent,
                        'amount_total' => $session->amount_total,
                        'payment_status' => $session->payment_status,
                    ]),
                ]);
                
                if ($isCustomDomain) {
                    return redirect()->route('store.order-confirmation', ['orderNumber' => $order->order_number])
                        ->withErrors(['error' => 'Payment completed successfully']);
                }
                return redirect()->route('store.order-confirmation', [
                    'storeSlug' => $storeSlug,
                    'orderNumber' => $order->order_number
                ])->with('success', 'Payment completed successfully!');
            } else {
                if ($isCustomDomain) {
                    return redirect()->route('store.checkout')
                        ->withErrors(['error' => 'Payment was not completed']);
                }
                return redirect()->route('store.checkout', ['storeSlug' => $storeSlug])
                    ->withErrors(['error' => 'Payment was not completed']);
            }
            
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
}