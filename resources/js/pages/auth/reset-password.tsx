import { useForm, usePage } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/layouts/auth-layout';
import AuthButton from '@/components/auth/auth-button';
import Recaptcha, { executeRecaptcha } from '@/components/recaptcha';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';

interface ResetPasswordProps {
    token: string;
    email: string;
}

type ResetPasswordForm = {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
    recaptcha_token?: string;
};

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { t } = useTranslation();
    const [recaptchaToken, setRecaptchaToken] = useState<string>('');
    const { themeColor, customColor } = useBrand();
    const { settings = {} } = usePage().props as any;
    const recaptchaEnabled = settings.recaptchaEnabled === 'true' || settings.recaptchaEnabled === true || settings.recaptchaEnabled === 1 || settings.recaptchaEnabled === '1';
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { data, setData, post, processing, errors, reset } = useForm<Required<ResetPasswordForm>>({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();

        if (recaptchaEnabled) {
            try {
                const token = await executeRecaptcha();
                if (!token) {
                    alert(t('Please complete the reCAPTCHA verification'));
                    return;
                }
                const formData = { ...data, recaptcha_token: token };
                post(route('password.store'), {
                    data: formData,
                    onFinish: () => reset('password', 'password_confirmation'),
                });
                return;
            } catch {
                alert(t('reCAPTCHA verification failed. Please try again.'));
                return;
            }
        }

        post(route('password.store'), {
            data: { ...data, recaptcha_token: recaptchaToken },
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title={t("Reset your password")}
            description={t("Please enter your new password below")}
            icon={<Lock className="h-6 w-6" />}
        >
            <form className="mt-6" onSubmit={submit}>
                <div className="space-y-5">
                    <div>
                        <Label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1.5">{t("Email")}</Label>
                        <Input
                            id="email"
                            type="email"
                            readOnly
                            value={data.email}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                            style={{ borderColor: 'rgb(209 213 219)' } as React.CSSProperties}
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div>
                        <Label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1.5">{t("Password")}</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder={t("New password")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-offset-0 transition-colors placeholder-gray-400 bg-white"
                            style={{ '--tw-ring-color': primaryColor, borderColor: 'rgb(209 213 219)' } as React.CSSProperties}
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div>
                        <Label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-900 mb-1.5">{t("Confirm password")}</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder={t("Confirm new password")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-offset-0 transition-colors placeholder-gray-400 bg-white"
                            style={{ '--tw-ring-color': primaryColor, borderColor: 'rgb(209 213 219)' } as React.CSSProperties}
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>
                </div>

                {recaptchaEnabled && (
                    <div className="mb-4">
                        <Recaptcha
                            onVerify={setRecaptchaToken}
                            onExpired={() => setRecaptchaToken('')}
                            onError={() => setRecaptchaToken('')}
                        />
                    </div>
                )}

                <AuthButton
                    tabIndex={3}
                    processing={processing}
                    className="mt-4"
                >
                    {t("Reset password")}
                </AuthButton>
            </form>
        </AuthLayout>
    );
}