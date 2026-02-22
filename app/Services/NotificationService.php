<?php

namespace App\Services;

use App\Models\Notification;
use Exception;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send notification via specified channel
     */
    public static function send($userId, $storeId, $type, $to, $templateAction, $variables = [], $lang = 'en')
    {
        try {
            // Check if template exists and is enabled by superadmin
            $notification = Notification::where('action', $templateAction)->first();
            
            if (!$notification) {
                return false;
            }
            
            if ($notification->status !== 'on') {
                return false;
            }

            switch (strtolower($type)) {
                case 'sms':
                case 'twilio':
                    return TwilioService::sendSMS($userId, $storeId, $to, $templateAction, $variables, $lang);
                    
                case 'whatsapp':
                    return WhatsAppService::sendMessage($userId, $storeId, $to, $templateAction, $variables, $lang);
                    
                case 'telegram':
                    return TelegramService::sendMessage($userId, $storeId, $to, $templateAction, $variables, $lang);
                    
                default:
                    throw new Exception('Invalid notification type: ' . $type);
            }
        } catch (Exception $e) {
            Log::error('Notification service error: ' . $e->getMessage(), [
                'type' => $type,
                'template' => $templateAction,
                'user_id' => $userId,
                'store_id' => $storeId
            ]);
            return false;
        }
    }

    /**
     * Send multiple notifications
     */
    public static function sendMultiple($userId, $storeId, $notifications)
    {
        $results = [];
        
        foreach ($notifications as $notification) {
            $result = self::send(
                $userId,
                $storeId,
                $notification['type'],
                $notification['to'],
                $notification['template'],
                $notification['variables'] ?? [],
                $notification['lang'] ?? 'en'
            );
            
            $results[] = [
                'type' => $notification['type'],
                'template' => $notification['template'],
                'success' => $result
            ];
        }
        
        return $results;
    }
}