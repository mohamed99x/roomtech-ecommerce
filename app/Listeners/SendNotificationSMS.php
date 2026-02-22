<?php

namespace App\Listeners;

use App\Events\OrderCreated;
use App\Events\OrderStatusChanged;
use App\Events\CustomerCreated;

class SendNotificationSMS
{
    private static array $processedEvents = [];
    
    public function handleOrderCreated(OrderCreated $event): void
    {
        $order = $event->order;
        $eventKey = 'order_created_' . $order->id;
        
        if ($this->isProcessed($eventKey) || empty($order->customer_phone)) {
            return;
        }

        $variables = [
            'company_name' => $order->store->user->name ?? config('app.name'),
            'store_name' => $order->store->name ?? config('app.name'),
            'order_number' => $order->order_number,
            'customer_name' => trim($order->customer_first_name . ' ' . $order->customer_last_name)
        ];

        sendNotification('sms', $order->customer_phone, 'Order Created', $variables);
    }

    public function handleOrderStatusChanged(OrderStatusChanged $event): void
    {
        $order = $event->order;
        $eventKey = 'order_status_' . $order->id . '_' . $order->updated_at->timestamp;
        
        if ($this->isProcessed($eventKey) || empty($order->customer_phone)) {
            return;
        }

        $variables = [
            'company_name' => $order->store->user->name ?? config('app.name'),
            'store_name' => $order->store->name ?? config('app.name'),
            'order_number' => $order->order_number,
            'status' => ucfirst($order->status)
        ];

        sendNotification('sms', $order->customer_phone, 'Order Status Updated', $variables);
    }

    public function handleCustomerCreated(CustomerCreated $event): void
    {
        $customer = $event->customer;
        $eventKey = 'customer_created_' . $customer->id;
        
        if ($this->isProcessed($eventKey) || empty($customer->phone)) {
            return;
        }

        $variables = [
            'company_name' => $customer->store->user->name ?? config('app.name'),
            'store_name' => $customer->store->name ?? config('app.name'),
            'customer_name' => trim($customer->first_name . ' ' . $customer->last_name)
        ];

        sendNotification('sms', $customer->phone, 'New Customer', $variables);
    }

    private function isProcessed(string $key): bool
    {
        if (in_array($key, self::$processedEvents)) {
            return true;
        }
        self::$processedEvents[] = $key;
        return false;
    }
}