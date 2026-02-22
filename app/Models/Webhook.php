<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Webhook extends Model
{
    use HasFactory;

    // Webhook module constants
    const MODULE_NEW_USER = 'New User';
    const MODULE_NEW_PRODUCT = 'New Product';
    const MODULE_NEW_ORDER = 'New Order';
    const MODULE_STATUS_CHANGE = 'Status Change';
    const MODULE_NEW_CUSTOMER = 'New Customer';

    protected $fillable = [
        'user_id',
        'store_id',
        'module',
        'method',
        'url',
        'is_active',
    ];
    
    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public static function modules()
    {
        return [
            self::MODULE_NEW_USER => self::MODULE_NEW_USER,
            self::MODULE_NEW_PRODUCT => self::MODULE_NEW_PRODUCT,
            self::MODULE_NEW_ORDER => self::MODULE_NEW_ORDER,
            self::MODULE_STATUS_CHANGE => self::MODULE_STATUS_CHANGE,
            self::MODULE_NEW_CUSTOMER => self::MODULE_NEW_CUSTOMER,
        ];
    }

    public static function getModuleKeys()
    {
        return array_keys(self::modules());
    }

    public static function methods()
    {
        return [
            'GET' => 'GET',
            'POST' => 'POST'
        ];
    }
}