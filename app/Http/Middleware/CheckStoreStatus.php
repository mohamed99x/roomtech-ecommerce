<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Store;
use App\Models\StoreConfiguration;
use Inertia\Inertia;

class CheckStoreStatus
{
    public function handle(Request $request, Closure $next)
    {
        // Get store from route parameter
        $storeSlug = $request->route('storeSlug');

        if ($storeSlug) {
            $store = Store::where('slug', $storeSlug)->first();
            
            if ($store) {
                // If store has custom domain or subdomain enabled, block regular route access
                // BUT allow if this is a custom domain request (resolved by DomainResolver)
                if (($store->enable_custom_domain || $store->enable_custom_subdomain) && 
                    !$request->attributes->has('resolved_store')) {
                    return Inertia::render('store/StoreNotFound', [
                        'requestedSlug' => htmlspecialchars($storeSlug, ENT_QUOTES, 'UTF-8')
                    ])->toResponse($request)->setStatusCode(404);
                }
                
                $config = StoreConfiguration::getConfiguration($store->id);
                
                // Check if store is disabled
                if (!($config['store_status'] ?? true)) {
                    $reason = ($config['plan_disabled'] ?? false) ? 'Plan limit exceeded' : 'Store disabled by owner';
                    return Inertia::render('store/StoreDisabled', [
                        'store' => $store,
                        'reason' => $reason
                    ])->toResponse($request)->setStatusCode(503);
                }
                
                // Check if store is in maintenance mode
                if ($config['maintenance_mode'] ?? false) {
                    return Inertia::render('store/StoreMaintenance', [
                        'store' => $store
                    ])->toResponse($request)->setStatusCode(503);
                }
            }
        }
        
        return $next($request);
    }
}