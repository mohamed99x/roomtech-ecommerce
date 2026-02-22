<?php

namespace App\Listeners;

use App\Events\CustomerCreated;
use App\Events\OrderCreated;
use App\Events\OrderStatusChanged;
use App\Events\ProductCreated;
use App\Events\UserCreated;
use App\Services\WebhookService;

class HandleWebhooks
{
    private static array $processed = [];
    
    public function __construct(private WebhookService $webhookService)
    {
    }
    
    private function isProcessed(string $key): bool
    {
        if (isset(self::$processed[$key])) {
            return true;
        }
        self::$processed[$key] = true;
        return false;
    }

    public function handleOrderCreated(OrderCreated $event): void
    {
        $order = $event->order;
        
        if ($this->isProcessed('order_created_' . $order->id)) {
            return;
        }
        
        $store = $order->store;
        
        $webhookData = [
            'event' => 'order.created',
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'total' => $order->total_amount,
                'status' => $order->status,
                'payment_method' => $order->payment_method,
                'customer' => [
                    'name' => $order->customer_first_name . ' ' . $order->customer_last_name,
                    'email' => $order->customer_email,
                    'phone' => $order->customer_phone,
                ],
                'created_at' => $order->created_at->toISOString(),
            ],
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
            ],
            'timestamp' => now()->toISOString(),
        ];

        $this->webhookService->triggerWebhooks(
            \App\Models\Webhook::MODULE_NEW_ORDER, 
            $webhookData, 
            $store->user_id,
            $store->id
        );
    }

    public function handleOrderStatusChanged(OrderStatusChanged $event): void
    {
        $order = $event->order;
        
        if ($this->isProcessed('order_status_' . $order->id . '_' . $order->status)) {
            return;
        }
        
        $store = $order->store;
        
        $webhookData = [
            'event' => 'order.status_changed',
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'old_status' => $event->oldStatus,
                'new_status' => $order->status,
                'total' => $order->total_amount,
                'customer' => [
                    'name' => $order->customer_first_name . ' ' . $order->customer_last_name,
                    'email' => $order->customer_email,
                    'phone' => $order->customer_phone,
                ],
                'updated_at' => $order->updated_at->toISOString(),
            ],
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
            ],
            'timestamp' => now()->toISOString(),
        ];

        $this->webhookService->triggerWebhooks(
            \App\Models\Webhook::MODULE_STATUS_CHANGE, 
            $webhookData, 
            $store->user_id,
            $store->id
        );
    }

    public function handleUserCreated(UserCreated $event): void
    {
        $user = $event->user;
        
        if ($this->isProcessed('user_created_' . $user->id)) {
            return;
        }
        
        $webhookData = [
            'event' => 'user.created',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'type' => $user->type,
                'created_at' => $user->created_at->toISOString(),
            ],
            'timestamp' => now()->toISOString(),
        ];

        $webhookUserId = $user->type === 'superadmin' ? $user->id : ($user->created_by ?: $user->id);
        
        $this->webhookService->triggerWebhooks(
            \App\Models\Webhook::MODULE_NEW_USER, 
            $webhookData, 
            $webhookUserId
        );
    }

    public function handleProductCreated(ProductCreated $event): void
    {
        $product = $event->product;
        
        if ($this->isProcessed('product_created_' . $product->id)) {
            return;
        }
        
        $store = $product->store;
        
        $webhookData = [
            'event' => 'product.created',
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'sku' => $product->sku,
                'price' => $product->price,
                'sale_price' => $product->sale_price,
                'stock' => $product->stock,
                'status' => $product->status,
                'created_at' => $product->created_at->toISOString(),
            ],
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
            ],
            'timestamp' => now()->toISOString(),
        ];

        $this->webhookService->triggerWebhooks(
            \App\Models\Webhook::MODULE_NEW_PRODUCT, 
            $webhookData, 
            $store->user_id,
            $store->id
        );
    }

    public function handleCustomerCreated(CustomerCreated $event): void
    {
        $customer = $event->customer;
        
        if ($this->isProcessed('customer_created_' . $customer->id)) {
            return;
        }
        
        $store = $customer->store;
        
        $webhookData = [
            'event' => 'customer.created',
            'customer' => [
                'id' => $customer->id,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'date_of_birth' => $customer->date_of_birth,
                'gender' => $customer->gender,
                'status' => $customer->status,
                'created_at' => $customer->created_at->toISOString(),
            ],
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
            ],
            'timestamp' => now()->toISOString(),
        ];

        $this->webhookService->triggerWebhooks(
            \App\Models\Webhook::MODULE_NEW_CUSTOMER, 
            $webhookData, 
            $store->user_id,
            $store->id
        );
    }
}