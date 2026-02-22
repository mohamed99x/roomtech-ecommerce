<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\User;
use App\Models\Setting;
use App\Models\PlanOrder;
use App\Models\PaymentSetting;
use Illuminate\Http\Request;

class BankPaymentController extends Controller
{
    public function processPayment(Request $request)
    {
        $validated = validatePaymentRequest($request, [
            'amount' => 'required|numeric|min:0',
        ]);

        try {
            $plan = Plan::findOrFail($validated['plan_id']);
            
            $planOrder = createPlanOrder([
                'user_id' => auth()->id(),
                'plan_id' => $plan->id,
                'billing_cycle' => $validated['billing_cycle'],
                'payment_method' => 'bank',
                'coupon_code' => $validated['coupon_code'] ?? null,
                'payment_id' => 'BANK_' . strtoupper(uniqid()),
                'status' => 'pending',
            ]);

            \Log::info('Bank transfer order created', ['order_id' => $planOrder->id, 'user_id' => auth()->id()]);

            return response()->json([
                'success' => true,
                'message' => __('Payment request submitted successfully! Your plan will be activated after payment verification. Order Number: :order', ['order' => $planOrder->order_number]),
                'order_number' => $planOrder->order_number
            ]);

        } catch (\Exception $e) {
            \Log::error('Bank payment error', ['error' => $e->getMessage(), 'user_id' => auth()->id()]);
            return response()->json([
                'success' => false,
                'message' => __('Payment processing failed. Please try again.')
            ], 422);
        }
    }
}