<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\PaymentSetting;
use App\Models\Setting;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class TwilioSettingController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'is_twilio_enabled' => 'required|boolean',
            'twilio_sid' => 'required_if:is_twilio_enabled,true|string|max:255',
            'twilio_token' => 'required_if:is_twilio_enabled,true|string|max:255',
            'twilio_from' => 'required_if:is_twilio_enabled,true|string|max:255',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->with('error', 'Validation failed');
        }

        $user = auth()->user();
        $storeId = $user->type === 'company' ? getCurrentStoreId($user) : null;
        
        try {
            // Store all Twilio settings in settings table
            Setting::setSetting('is_twilio_enabled', $request->boolean('is_twilio_enabled') ? 'on' : 'off', $user->id, $storeId);
            
            if ($request->boolean('is_twilio_enabled')) {
                Setting::setSetting('twilio_sid', $request->twilio_sid, $user->id, $storeId);
                Setting::setSetting('twilio_token', $request->twilio_token, $user->id, $storeId);
                Setting::setSetting('twilio_from', $request->twilio_from, $user->id, $storeId);
            }

            // Save template settings
            $templates = Notification::all();
            foreach ($templates as $template) {
                $templateKey = "twilio_" . strtolower(str_replace(' ', '_', $template->action)) . "_enabled";
                if ($request->has($templateKey)) {
                    $value = $request->boolean($templateKey) ? 'on' : 'off';
                    Setting::setSetting($templateKey, $value, $user->id, $storeId);
                }
            }

            return back()->with('success', 'Twilio settings updated successfully');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to update Twilio settings: ' . $e->getMessage());
        }
    }
}