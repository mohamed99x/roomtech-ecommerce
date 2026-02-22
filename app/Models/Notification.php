<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'type',
        'action',
        'status',
    ];

    public function templateLangs()
    {
        return $this->hasMany(NotificationTemplateLang::class, 'parent_id');
    }
}
