<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationTemplateLang extends Model
{
    protected $fillable = [
        'parent_id',
        'lang',
        'variables',
        'content',
    ];

    public function notification()
    {
        return $this->belongsTo(Notification::class, 'parent_id');
    }
}
