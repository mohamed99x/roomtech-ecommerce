<?php

namespace App\Providers;

use App\Events\CustomerCreated;
use App\Events\OrderCreated;
use App\Events\OrderStatusChanged;
use App\Events\ProductCreated;
use App\Events\StoreCreated;
use App\Events\UserCreated;
use App\Listeners\HandleWebhooks;
use App\Listeners\SendOrderCreatedEmail;
use App\Listeners\SendOrderCreatedWhatsApp;
use App\Listeners\SendOrderStatusChangedEmail;
use App\Listeners\SendStoreCreatedEmail;
use App\Listeners\SendUserCreatedEmail;
use App\Listeners\SendNotificationSMS;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        UserCreated::class => [
            SendUserCreatedEmail::class,
            HandleWebhooks::class . '@handleUserCreated',
        ],
        OrderCreated::class => [
            SendOrderCreatedEmail::class,
            SendOrderCreatedWhatsApp::class,
            SendNotificationSMS::class . '@handleOrderCreated',
            HandleWebhooks::class . '@handleOrderCreated',
        ],
        OrderStatusChanged::class => [
            SendOrderStatusChangedEmail::class,
            SendNotificationSMS::class . '@handleOrderStatusChanged',
            HandleWebhooks::class . '@handleOrderStatusChanged',
        ],
        StoreCreated::class => [
            SendStoreCreatedEmail::class,
        ],
        CustomerCreated::class => [
            SendNotificationSMS::class . '@handleCustomerCreated',
            HandleWebhooks::class . '@handleCustomerCreated',
        ],
        ProductCreated::class => [
            HandleWebhooks::class . '@handleProductCreated',
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }

    /**
     * Get the listener directories that should be used to discover events.
     */
    protected function discoverEventsWithin(): array
    {
        return [];
    }
}