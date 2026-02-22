<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Currency;
use App\Models\PaymentSetting;
use App\Models\Webhook;
use App\Models\Notification;

class SettingsController extends Controller
{
    /**
     * Display the main settings page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = auth()->user();
        $storeId = $user->type === 'company' ? getCurrentStoreId($user) : null;
        
        // Get system settings - store-specific for company users
        if ($storeId) {
            // For company users, get store-specific settings with fallback to global
            $systemSettings = Setting::getUserSettings($user->id, $storeId);
            
            // If no store-specific settings exist, fall back to global settings
            if (empty($systemSettings)) {
                $globalSettings = settings();
                $systemSettings = $globalSettings;
            } else {
                // Merge with global settings for missing keys
                $globalSettings = settings();
                $systemSettings = array_merge($globalSettings, $systemSettings);
            }
        } else {
            // For superadmin/admin, use global settings
            $systemSettings = settings();
        }
        
        $currencies = Currency::all();
        $paymentSettings = PaymentSetting::getUserSettings($user->id, $storeId);
        // Get webhooks - store-specific for company users
        if ($storeId) {
            $webhooks = Webhook::where('user_id', $user->id)
                ->where('store_id', $storeId)
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            $webhooks = Webhook::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }
        
        // WhatsApp and Telegram settings are now included in paymentSettings
        if ($user->type === 'company' && $storeId) {
            // Convert \n to actual line breaks for message templates
            if (isset($paymentSettings['messaging_message_template'])) {
                $paymentSettings['messaging_message_template'] = str_replace('\\n', "\n", $paymentSettings['messaging_message_template']);
            }
            if (isset($paymentSettings['messaging_item_template'])) {
                $paymentSettings['messaging_item_template'] = str_replace('\\n', "\n", $paymentSettings['messaging_item_template']);
                $paymentSettings['whatsapp_item_variable'] = $paymentSettings['messaging_item_template'];
            }
        }
        
        // Get WhatsApp settings and variables for company users from PaymentSetting
        $whatsappVariables = ['orderVariables' => [], 'itemVariables' => []];
        $whatsappSettings = [];
        if ($user->type === 'company' && $storeId) {
            $whatsappKeys = ['messaging_order_variables', 'messaging_item_variables', 'is_whatsapp_enabled', 'whatsapp_phone_number', 'messaging_message_template', 'messaging_item_template'];
            $settings = PaymentSetting::where('user_id', $user->id)
                ->where('store_id', $storeId)
                ->whereIn('key', $whatsappKeys)
                ->get()
                ->keyBy('key');
            
            $whatsappVariables = [
                'orderVariables' => isset($settings['messaging_order_variables']) ? json_decode($settings['messaging_order_variables']->value, true) : [],
                'itemVariables' => isset($settings['messaging_item_variables']) ? json_decode($settings['messaging_item_variables']->value, true) : []
            ];
            
            $whatsappSettings = [
                'is_whatsapp_enabled' => $settings['is_whatsapp_enabled']->value ?? '0',
                'whatsapp_phone_number' => $settings['whatsapp_phone_number']->value ?? '',
                'messaging_message_template' => $settings['messaging_message_template']->value ?? '',
                'messaging_item_template' => $settings['messaging_item_template']->value ?? ''
            ];
        }
        
        // Get notification templates for Twilio settings
        $notificationTemplates = [];
        if ($user->type === 'company') {
            $notificationTemplates = Notification::all()
                ->map(function ($template) {
                    return [
                        'id' => $template->id,
                        'module' => $template->module,
                        'action' => $template->action,
                        'status' => $template->status
                    ];
                });
        }
        
        return Inertia::render('settings/index', [
            'systemSettings' => $systemSettings,
            'settings' => $systemSettings, // For helper functions
            'cacheSize' => getCacheSize(),
            'currencies' => $currencies,
            'timezones' => config('timezones'),
            'dateFormats' => config('dateformat'),
            'timeFormats' => config('timeformat'),
            'paymentSettings' => $paymentSettings,
            'webhooks' => $webhooks,
            'availableModules' => Webhook::modules(),
            'whatsappVariables' => $whatsappVariables,
            'whatsappSettings' => $whatsappSettings,
            'notificationTemplates' => $notificationTemplates,
        ]);
    }
}