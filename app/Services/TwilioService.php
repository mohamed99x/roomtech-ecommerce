<?php

namespace App\Services;

use App\Models\NotificationTemplateLang;
use App\Models\Notification;
use App\Models\Setting;
use Exception;
use Illuminate\Support\Facades\Log;

class TwilioService
{
    public static function sendSMS($userId, $storeId, $to, $templateAction, $variables = [], $lang = 'en')
    {
        try {
            // Get Twilio settings from settings table
            $settings = Setting::getUserSettings($userId, $storeId);
            
            if (($settings['is_twilio_enabled'] ?? 'off') !== 'on') {
                return false;
            }

            // Check if template is enabled for this company
            $templateKey = 'twilio_' . strtolower(str_replace(' ', '_', $templateAction)) . '_enabled';
            if (($settings[$templateKey] ?? 'off') !== 'on') {
                return false;
            }

            // Check if template is enabled by superadmin
            $notification = Notification::where('action', $templateAction)->first();
            if (!$notification || $notification->status !== 'on') {
                return false;
            }

            $sid = $settings['twilio_sid'] ?? null;
            $token = $settings['twilio_token'] ?? null;
            $fromNumber = $settings['twilio_from'] ?? null;

            if (!$sid || !$token || !$fromNumber) {
                throw new Exception('Twilio credentials not configured');
            }

            // Get template content
            $template = NotificationTemplateLang::whereHas('notification', function($query) use ($templateAction) {
                $query->where('action', $templateAction);
            })->where('lang', $lang)->first();

            if (!$template) {
                // Fallback to English
                $template = NotificationTemplateLang::whereHas('notification', function($query) use ($templateAction) {
                    $query->where('action', $templateAction);
                })->where('lang', 'en')->first();
            }

            if (!$template) {
                throw new Exception('Template not found: ' . $templateAction);
            }

            $message = self::replaceVariables($template->content, $variables);

            // Send SMS using cURL (like other services in project)
            $url = 'https://api.twilio.com/2010-04-01/Accounts/' . $sid . '/Messages.json';
            
            $data = [
                'From' => $fromNumber,
                'To' => $to,
                'Body' => $message
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_USERPWD, $sid . ':' . $token);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 201) {
                Log::info('Twilio SMS sent successfully', ['to' => $to, 'template' => $templateAction]);
                return true;
            } else {
                Log::error('Twilio SMS failed', ['response' => $response, 'http_code' => $httpCode]);
                return false;
            }

        } catch (Exception $e) {
            Log::error('Twilio SMS error: ' . $e->getMessage());
            return false;
        }
    }

    private static function replaceVariables($content, $variables)
    {
        foreach ($variables as $key => $value) {
            $content = str_replace('{' . $key . '}', $value, $content);
        }
        return $content;
    }
}