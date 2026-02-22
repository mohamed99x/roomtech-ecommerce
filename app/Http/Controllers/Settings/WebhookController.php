<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Webhook;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WebhookController extends Controller
{
    public function index(): JsonResponse
    {
        $user = auth()->user();
        $storeId = getCurrentStoreId($user);
        $webhooks = Webhook::where('user_id', $user->id)
            ->where('store_id', $storeId)
            ->get();
        return response()->json($webhooks);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        $storeId = getCurrentStoreId($user);
        
        $request->validate([
            'module' => 'required|in:' . implode(',', Webhook::getModuleKeys()),
            'method' => 'required|in:GET,POST',
            'url' => 'required|url',
        ]);

        // Check if webhook already exists for this module and store
        $existingWebhook = Webhook::where('user_id', $user->id)
            ->where('store_id', $storeId)
            ->where('module', $request->module)
            ->first();

        if ($existingWebhook) {
            return response()->json([
                'message' => 'Webhook for this module already exists for this store'
            ], 422);
        }

        $webhook = Webhook::create([
            'user_id' => $user->id,
            'store_id' => $storeId,
            'module' => $request->module,
            'method' => $request->method,
            'url' => $request->url,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'webhook' => $webhook,
            'message' => __('Webhook created successfully')
        ]);
    }

    public function update(Request $request, Webhook $webhook): JsonResponse
    {
        $user = auth()->user();
        $storeId = getCurrentStoreId($user);
        
        if ($webhook->user_id !== $user->id || $webhook->store_id !== $storeId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'module' => 'required|in:' . implode(',', Webhook::getModuleKeys()),
            'method' => 'required|in:GET,POST',
            'url' => 'required|url',
        ]);

        // Check if webhook already exists for this module and store (excluding current webhook)
        $existingWebhook = Webhook::where('user_id', $user->id)
            ->where('store_id', $storeId)
            ->where('module', $request->module)
            ->where('id', '!=', $webhook->id)
            ->first();

        if ($existingWebhook) {
            return response()->json([
                'message' => 'Webhook for this module already exists for this store'
            ], 422);
        }

        $webhook->update([
            'module' => $request->module,
            'method' => $request->method,
            'url' => $request->url,
            'is_active' => $request->is_active ?? $webhook->is_active,
        ]);

        return response()->json([
            'webhook' => $webhook,
            'message' => __('Webhook updated successfully')
        ]);
    }

    public function destroy(Webhook $webhook): JsonResponse
    {
        $user = auth()->user();
        $storeId = getCurrentStoreId($user);
        
        if ($webhook->user_id !== $user->id || $webhook->store_id !== $storeId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $webhook->delete();

        return response()->json(['message' => __('Webhook deleted successfully')]);
    }
}