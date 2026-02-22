<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\NotificationTemplateLang;
use Illuminate\Database\Seeder;

class NotificationTemplatesSeeder extends Seeder
{
    public function run(): void
    {
        $languages = json_decode(file_get_contents(resource_path('lang/language.json')), true);
        $langCodes = collect($languages)->pluck('code')->toArray();
        
        $templates = [
            'Order Created' => [
                'variables' => '{"company_name": "company_name", "store_name": "store_name", "order_number": "order_number", "customer_name": "customer_name"}',
                'content' => [
                    'en' => 'New order #{order_number} created for {customer_name} at {store_name} by {company_name}.',
                    'es' => 'Nueva orden #{order_number} creada para {customer_name} en {store_name} por {company_name}.',
                    'ar' => 'طلب جديد #{order_number} تم إنشاؤه لـ {customer_name} في {store_name} بواسطة {company_name}.',
                    'da' => 'Ny ordre #{order_number} oprettet for {customer_name} hos {store_name} af {company_name}.',
                    'de' => 'Neue Bestellung #{order_number} für {customer_name} bei {store_name} von {company_name} erstellt.',
                    'fr' => 'Nouvelle commande #{order_number} créée pour {customer_name} chez {store_name} par {company_name}.',
                    'he' => 'הזמנה חדשה #{order_number} נוצרה עבור {customer_name} ב-{store_name} על ידי {company_name}.',
                    'it' => 'Nuovo ordine #{order_number} creato per {customer_name} presso {store_name} da {company_name}.',
                    'ja' => '新しい注文 #{order_number} が {customer_name} のために {store_name} で {company_name} によって作成されました。',
                    'nl' => 'Nieuwe bestelling #{order_number} aangemaakt voor {customer_name} bij {store_name} door {company_name}.',
                    'pl' => 'Nowe zamówienie #{order_number} utworzone dla {customer_name} w {store_name} przez {company_name}.',
                    'pt' => 'Novo pedido #{order_number} criado para {customer_name} em {store_name} por {company_name}.',
                    'pt-BR' => 'Novo pedido #{order_number} criado para {customer_name} em {store_name} por {company_name}.',
                    'ru' => 'Новый заказ #{order_number} создан для {customer_name} в {store_name} компанией {company_name}.',
                    'tr' => 'Yeni sipariş #{order_number}, {customer_name} için {store_name} mağazasında {company_name} tarafından oluşturuldu.',
                    'zh' => '新订单 #{order_number} 已为 {customer_name} 在 {store_name} 由 {company_name} 创建。',
                ]
            ],
            'Order Status Updated' => [
                'variables' => '{"company_name": "company_name", "store_name": "store_name", "order_number": "order_number", "status": "status"}',
                'content' => [
                    'en' => 'Order #{order_number} status updated to {status} at {store_name} by {company_name}.',
                    'es' => 'Estado de la orden #{order_number} actualizado a {status} en {store_name} por {company_name}.',
                    'ar' => 'تم تحديث حالة الطلب #{order_number} إلى {status} في {store_name} بواسطة {company_name}.',
                    'da' => 'Ordre #{order_number} status opdateret til {status} hos {store_name} af {company_name}.',
                    'de' => 'Bestellstatus #{order_number} auf {status} bei {store_name} von {company_name} aktualisiert.',
                    'fr' => 'Statut de la commande #{order_number} mis à jour vers {status} chez {store_name} par {company_name}.',
                    'he' => 'סטטוס הזמנה #{order_number} עודכן ל-{status} ב-{store_name} על ידי {company_name}.',
                    'it' => 'Stato ordine #{order_number} aggiornato a {status} presso {store_name} da {company_name}.',
                    'ja' => '注文 #{order_number} のステータスが {store_name} で {company_name} によって {status} に更新されました。',
                    'nl' => 'Bestelstatus #{order_number} bijgewerkt naar {status} bij {store_name} door {company_name}.',
                    'pl' => 'Status zamówienia #{order_number} zaktualizowany do {status} w {store_name} przez {company_name}.',
                    'pt' => 'Status do pedido #{order_number} atualizado para {status} em {store_name} por {company_name}.',
                    'pt-BR' => 'Status do pedido #{order_number} atualizado para {status} em {store_name} por {company_name}.',
                    'ru' => 'Статус заказа #{order_number} обновлен на {status} в {store_name} компанией {company_name}.',
                    'tr' => 'Sipariş #{order_number} durumu {store_name} mağazasında {company_name} tarafından {status} olarak güncellendi.',
                    'zh' => '订单 #{order_number} 状态已在 {store_name} 由 {company_name} 更新为 {status}。',
                ]
            ],
            'New Customer' => [
                'variables' => '{"company_name": "company_name", "store_name": "store_name", "customer_name": "customer_name"}',
                'content' => [
                    'en' => 'Welcome {customer_name}! You have successfully registered at {store_name} by {company_name}.',
                    'es' => '¡Bienvenido {customer_name}! Te has registrado exitosamente en {store_name} por {company_name}.',
                    'ar' => 'مرحباً {customer_name}! لقد تم تسجيلك بنجاح في {store_name} بواسطة {company_name}.',
                    'da' => 'Velkommen {customer_name}! Du har registreret dig hos {store_name} af {company_name}.',
                    'de' => 'Willkommen {customer_name}! Sie haben sich erfolgreich bei {store_name} von {company_name} registriert.',
                    'fr' => 'Bienvenue {customer_name}! Vous vous êtes inscrit avec succès chez {store_name} par {company_name}.',
                    'he' => 'ברוכים הבאים {customer_name}! נרשמת בהצלחה ב-{store_name} על ידי {company_name}.',
                    'it' => 'Benvenuto {customer_name}! Ti sei registrato con successo presso {store_name} da {company_name}.',
                    'ja' => 'ようこそ {customer_name}! {company_name} の {store_name} に正常に登録されました。',
                    'nl' => 'Welkom {customer_name}! Je hebt je succesvol geregistreerd bij {store_name} door {company_name}.',
                    'pl' => 'Witamy {customer_name}! Pomyślnie zarejestrowaliś się w {store_name} przez {company_name}.',
                    'pt' => 'Bem-vindo {customer_name}! Você se registrou com sucesso em {store_name} por {company_name}.',
                    'pt-BR' => 'Bem-vindo {customer_name}! Você se registrou com sucesso em {store_name} por {company_name}.',
                    'ru' => 'Добро пожаловать {customer_name}! Вы успешно зарегистрировались в {store_name} компанией {company_name}.',
                    'tr' => 'Hoş geldiniz {customer_name}! {company_name} tarafından {store_name} mağazasına başarıyla kayıt oldunuz.',
                    'zh' => '欢迎 {customer_name}! 您已成功在 {company_name} 的 {store_name} 注册。',
                ]
            ],
        ];

        foreach ($templates as $action => $template) {
            // Check if notification already exists
            $notification = Notification::where('action', $action)
                ->where('type', 'SMS')
                ->first();
                
            if (!$notification) {
                // Only create if doesn't exist
                $notification = Notification::create([
                    'action' => $action,
                    'type' => 'SMS',
                    'status' => 'on',
                ]);
                
                // Create template languages only for new notifications
                foreach ($langCodes as $lang) {
                    $content = $template['content'][$lang] ?? $template['content']['en'];
                    NotificationTemplateLang::create([
                        'parent_id' => $notification->id,
                        'lang' => $lang,
                        'variables' => $template['variables'],
                        'content' => $content,
                    ]);
                }
            }
        }
    }
}
