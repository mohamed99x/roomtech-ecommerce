<?php

namespace App\Services;

use App\Models\Webhook;

class WebhookService
{
    public function triggerWebhooks(string $module, array $data, int $userId, int $storeId = null): void
    {
        $webhook = $this->webhookSetting($module, $userId, $storeId);
        
        if ($webhook) {
            $parameter = json_encode($data);
            $this->webhookCall($webhook['url'], $parameter, $webhook['method']);
        }
    }
    
    private function webhookSetting($module, $userId, $storeId = null)
    {
        $query = Webhook::where('module', $module)
                       ->where('user_id', $userId)
                       ->where('is_active', true);
        
        if ($storeId) {
            $query->where('store_id', $storeId);
        }
        
        $webhook = $query->first();
        
        if (!empty($webhook)) {
            return [
                'url' => $webhook->url,
                'method' => $webhook->method,
            ];
        }
        return false;
    }
    
    private function webhookCall($url = null, $parameter = null, $method = 'POST')
    {
        if (!empty($url) && !empty($parameter)) {
            try {
                $curlHandle = curl_init($url);
                curl_setopt($curlHandle, CURLOPT_POSTFIELDS, $parameter);
                curl_setopt($curlHandle, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($curlHandle, CURLOPT_CUSTOMREQUEST, strtoupper($method));
                curl_setopt($curlHandle, CURLOPT_TIMEOUT, 30);
                curl_setopt($curlHandle, CURLOPT_CONNECTTIMEOUT, 10);
                curl_setopt($curlHandle, CURLOPT_HTTPHEADER, [
                    'Content-Type: application/json',
                    'User-Agent: StoreGo-SaaS-Webhook/1.0'
                ]);
                
                curl_exec($curlHandle);
                curl_close($curlHandle);
            } catch (\Throwable $th) {
                // Silent fail
            }
        }
    }
}