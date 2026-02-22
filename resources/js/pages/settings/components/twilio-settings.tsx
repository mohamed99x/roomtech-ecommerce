import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsSection } from '@/components/settings-section';
import { Save } from 'lucide-react';

interface TwilioSettingsProps {
  systemSettings: any;
  templates: any[];
}

export default function TwilioSettings({ systemSettings, templates }: TwilioSettingsProps) {
  const { t } = useTranslation();

  const { data, setData, post, processing, errors } = useForm({
    is_twilio_enabled: systemSettings?.is_twilio_enabled === 'on',
    twilio_sid: systemSettings?.twilio_sid || '',
    twilio_token: systemSettings?.twilio_token || '',
    twilio_from: systemSettings?.twilio_from || '',
    ...templates.reduce((acc, template) => {
      const templateKey = `twilio_${template.action.toLowerCase().replace(/\s+/g, '_')}_enabled`;
      acc[templateKey] = systemSettings?.[templateKey] === 'on';
      return acc;
    }, {})
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('settings.twilio'), {
      preserveScroll: true
    });
  };

  return (
    <SettingsSection
      title={t('Twilio Settings')}
      description={t('Configure Twilio SMS settings for your store')}
      action={
        <Button type="submit" form="twilio-form" size="sm" disabled={processing}>
          <Save className="h-4 w-4 mr-2" />
          {processing ? t('Saving...') : t('Save Changes')}
        </Button>
      }
    >
      <form id="twilio-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Enable/Disable Twilio */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <Label htmlFor="is_twilio_enabled" className="font-medium text-gray-900">
            {t('Enable Twilio SMS')}
          </Label>
          <Switch
            id="is_twilio_enabled"
            checked={data.is_twilio_enabled}
            onCheckedChange={(checked) => setData('is_twilio_enabled', checked)}
          />
        </div>

        {/* Twilio Configuration */}
        {data.is_twilio_enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="twilio_sid">{t('Twilio SID')}</Label>
              <Input
                id="twilio_sid"
                type="text"
                value={data.twilio_sid}
                onChange={(e) => setData('twilio_sid', e.target.value)}
                placeholder={t('Enter Twilio SID')}
              />
              {errors.twilio_sid && (
                <p className="text-sm text-red-600">{errors.twilio_sid}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="twilio_token">{t('Twilio Auth Token')}</Label>
              <Input
                id="twilio_token"
                type="password"
                value={data.twilio_token}
                onChange={(e) => setData('twilio_token', e.target.value)}
                placeholder={t('Enter Twilio Auth Token')}
              />
              {errors.twilio_token && (
                <p className="text-sm text-red-600">{errors.twilio_token}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="twilio_from">{t('From Number')}</Label>
              <Input
                id="twilio_from"
                type="text"
                value={data.twilio_from}
                onChange={(e) => setData('twilio_from', e.target.value)}
                placeholder={t('Enter Twilio phone number (e.g., +1234567890)')}
              />
              {errors.twilio_from && (
                <p className="text-sm text-red-600">{errors.twilio_from}</p>
              )}
            </div>
          </div>
        )}

        {/* SMS Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const templateKey = `twilio_${template.action.toLowerCase().replace(/\s+/g, '_')}_enabled`;
            const isEnabled = data[templateKey] || false;
            const isDisabledBySuperAdmin = template.status === 'off' || template.status === 0;
            const templateName = template.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            return (
              <div key={template.id} className={`flex items-center justify-between p-4 rounded-lg ${
                isDisabledBySuperAdmin ? 'bg-gray-200 opacity-60' : 'bg-gray-50'
              }`}>
                <Label htmlFor={templateKey} className={`font-medium ${
                  isDisabledBySuperAdmin ? 'text-gray-500' : 'text-gray-900'
                }`}>
                  {t(templateName)}
                  {isDisabledBySuperAdmin && (
                    <span className="text-xs text-red-600 block">{t('(Disabled by Admin)')}</span>
                  )}
                </Label>
                <Switch
                  id={templateKey}
                  checked={isDisabledBySuperAdmin ? false : isEnabled}
                  onCheckedChange={(checked) => setData(templateKey, checked)}
                  disabled={!data.is_twilio_enabled || isDisabledBySuperAdmin}
                />
              </div>
            );
          })}
        </div>
      </form>
    </SettingsSection>
  );
}