<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreConfiguration extends Model
{
    protected $fillable = ['store_id', 'key', 'value'];
    
    protected static function boot()
    {
        parent::boot();
        
        static::saving(function ($config) {
            if ($config->key === 'store_status' && $config->value === 'true') {
                $store = \App\Models\Store::with('user')->find($config->store_id);
                if ($store?->user?->type === 'company') {
                    $canActivate = \App\Http\Middleware\CheckPlanAccess::canActivateResource(
                        $store->user, 'store'
                    );
                    if (!$canActivate) {
                        throw new \Exception('Cannot activate store. Plan limit exceeded.');
                    }
                }
            }
        });
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public static function getConfiguration($storeId)
    {
        $configs = self::where('store_id', $storeId)->pluck('value', 'key')->toArray();
        
        $defaults = [
            'store_status' => true,
            'maintenance_mode' => false,
            'plan_disabled' => false,
            'logo' => '/storage/media/logo.png',
            'favicon' => '',
            'custom_css' => '',
            'custom_javascript' => ''
        ];
        
        // Convert string boolean values to actual booleans
        $configs = array_map(function($value) {
            return $value === 'true' ? true : ($value === 'false' ? false : $value);
        }, $configs);
        
        return array_merge($defaults, $configs);
    }

    public static function updateConfiguration($storeId, $settings)
    {
        foreach ($settings as $key => $value) {
            self::updateOrCreate(
                ['store_id' => $storeId, 'key' => $key],
                ['value' => is_bool($value) ? ($value ? 'true' : 'false') : (string)$value]
            );
        }
        
        // Check plan limitations if store_status is being set to true
        if (isset($settings['store_status']) && $settings['store_status'] === true) {
            self::enforcePlanLimitations($storeId);
        }
    }
    
    private static function enforcePlanLimitations($storeId)
    {
        $store = \App\Models\Store::with(['user.plan'])->find($storeId);
        if (!$store?->user?->plan || $store->user->type !== 'company') {
            return;
        }
        
        $user = $store->user;
        $maxStores = $user->plan->max_stores ?? 0;
        $stores = $user->stores()->orderBy('created_at', 'asc')->get();
        $activeCount = 0;
        
        foreach ($stores as $userStore) {
            $config = self::getConfiguration($userStore->id);
            if ($config['store_status'] ?? true) {
                $activeCount++;
                if ($activeCount > $maxStores) {
                    self::updateOrCreate(
                        ['store_id' => $userStore->id, 'key' => 'store_status'],
                        ['value' => 'false']
                    );
                    self::updateOrCreate(
                        ['store_id' => $userStore->id, 'key' => 'plan_disabled'],
                        ['value' => 'true']
                    );
                    
                    // If current store was deactivated, throw exception
                    if ($userStore->id == $storeId) {
                        throw new \Exception('Cannot activate store. Plan limit of ' . $maxStores . ' stores exceeded. Please upgrade your plan.');
                    }
                }
            }
        }
    }
}