<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\NotificationTemplateLang;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationTemplateController extends Controller
{
    public function index()
    {
        $notifications = Notification::with('templateLangs')->get();
        
        return Inertia::render('SuperAdmin/NotificationTemplates/Index', [
            'notifications' => $notifications
        ]);
    }

    public function show(Notification $notification)
    {
        $notification->load('templateLangs');
        $languages = json_decode(file_get_contents(resource_path('lang/language.json')), true);
        
        return Inertia::render('SuperAdmin/NotificationTemplates/Show', [
            'notification' => $notification,
            'languages' => $languages
        ]);
    }

    public function update(Request $request, Notification $notification)
    {
        $request->validate([
            'status' => 'required|in:on,off',
            'templates' => 'required|array',
            'templates.*.lang' => 'required|string',
            'templates.*.content' => 'required|string',
        ]);

        $notification->update([
            'status' => $request->status
        ]);

        foreach ($request->templates as $template) {
            NotificationTemplateLang::updateOrCreate(
                [
                    'parent_id' => $notification->id,
                    'lang' => $template['lang']
                ],
                [
                    'content' => $template['content']
                ]
            );
        }

        return redirect()->back()->with('success', 'Notification template updated successfully.');
    }
}
