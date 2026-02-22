<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PlanOrder extends Model
{
    protected $fillable = [
        'user_id',
        'plan_id',
        'coupon_id',
        'billing_cycle',
        'order_number',
        'original_price',
        'discount_amount',
        'final_price',
        'coupon_code',
        'payment_method',
        'payment_id',
        'status',
        'ordered_at',
        'processed_at',
        'processed_by',
        'notes'
    ];

    protected $casts = [
        'ordered_at' => 'datetime',
        'processed_at' => 'datetime',
        'original_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'final_price' => 'decimal:2'
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($planOrder) {
            if (empty($planOrder->order_number)) {
                $planOrder->order_number = 'PO-' . strtoupper(Str::random(8));
            }
            if (empty($planOrder->ordered_at)) {
                $planOrder->ordered_at = now();
            }
            
            // Validate pricing matches billing cycle
            if ($planOrder->plan_id && $planOrder->billing_cycle) {
                $plan = Plan::find($planOrder->plan_id);
                if ($plan) {
                    $expectedPrice = $plan->getPriceForCycle($planOrder->billing_cycle);
                    if ($planOrder->original_price != $expectedPrice) {
                        \Log::warning('PlanOrder pricing mismatch', [
                            'plan_id' => $planOrder->plan_id,
                            'billing_cycle' => $planOrder->billing_cycle,
                            'expected_price' => $expectedPrice,
                            'actual_price' => $planOrder->original_price
                        ]);
                    }
                }
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }

    public function approve($processedBy = null)
    {
        $this->update([
            'status' => 'approved',
            'processed_at' => now(),
            'processed_by' => $processedBy
        ]);
        
        // Use assignPlanToUser helper for proper enforcement
        assignPlanToUser($this->user, $this->plan, $this->billing_cycle);
        
        // Create referral record if user was referred
        \App\Http\Controllers\ReferralController::createReferralRecord($this->user, $this->billing_cycle);
    }

    public function reject($processedBy = null, $notes = null)
    {
        $this->update([
            'status' => 'rejected',
            'processed_at' => now(),
            'processed_by' => $processedBy,
            'notes' => $notes
        ]);
    }
    
    public function activateSubscription()
    {
        // Use assignPlanToUser helper for proper enforcement
        assignPlanToUser($this->user, $this->plan, $this->billing_cycle);
        
        // Create referral record if user was referred
        \App\Http\Controllers\ReferralController::createReferralRecord($this->user, $this->billing_cycle);
    }

    public function calculatePrices($plan, $coupon = null, $billingCycle = 'monthly')
    {
        // Get correct price based on billing cycle
        $planPrice = $plan->getPriceForCycle($billingCycle);
        
        $this->original_price = $planPrice;
        $this->discount_amount = 0;
        $this->final_price = $planPrice;
        $this->billing_cycle = $billingCycle;

        if ($coupon && $coupon->status) {
            if ($coupon->type === 'percentage') {
                $this->discount_amount = ($planPrice * $coupon->discount_amount) / 100;
            } else {
                $this->discount_amount = min($coupon->discount_amount, $planPrice);
            }
            
            $this->final_price = $planPrice - $this->discount_amount;
            $this->coupon_id = $coupon->id;
            $this->coupon_code = $coupon->code;
        }
    }
}
