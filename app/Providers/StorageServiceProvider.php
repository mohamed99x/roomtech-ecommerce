<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\DynamicStorageService;

class StorageServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Configure dynamic storage disks on application boot
        try {
            DynamicStorageService::configureDynamicDisks();
        } catch (\Exception $e) {
            // Log error but don't break the application
            \Log::warning('Failed to configure dynamic storage on boot', [
                'error' => $e->getMessage()
            ]);
        }
    }
}