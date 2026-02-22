import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/layouts/auth-layout';
import AuthButton from '@/components/auth/auth-button';
import Recaptcha, { executeRecaptcha } from '@/components/recaptcha';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    terms: boolean;
    recaptcha_token?: string;
    plan_id?: string;
    referral_code?: string;
};

export default function Register({ referralCode, planId }: { referralCode?: string; planId?: string }) {
    const { t } = useTranslation();
    const [recaptchaToken, setRecaptchaToken] = useState<string>('');
    const { themeColor, customColor } = useBrand();
    const { settings = {} } = usePage().props as any;
    const recaptchaEnabled = settings.recaptchaEnabled === 'true' || settings.recaptchaEnabled === true || settings.recaptchaEnabled === 1 || settings.recaptchaEnabled === '1';
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false,
        plan_id: planId,
        referral_code: referralCode,
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
                post(route('register'), {
                    data: formData,
                });
            } catch {
                alert(t('reCAPTCHA verification failed. Please try again.'));
                return;
            }
        } else {
            post(route('register'), {
                data: { ...data, recaptcha_token: recaptchaToken },
                onFinish: () => reset('password', 'password_confirmation'),
            });
        }
    };


    return (
        <AuthLayout
            title={t("Create your account")}
            description={t("Enter your details below to get started")}
        >
            <form className="mt-6" onSubmit={submit}>
                <div className="space-y-5">
                    <div>
                        <Label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-1.5">{t("Full name")}</Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder={t("John Doe")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-offset-0 transition-colors placeholder-gray-400 bg-white"
                            style={{ '--tw-ring-color': primaryColor, borderColor: 'rgb(209 213 219)' } as React.CSSProperties}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div>
                        <Label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1.5">{t("Email address")}</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder={t("Enter your email")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-offset-0 transition-colors placeholder-gray-400 bg-white"
                            style={{ '--tw-ring-color': primaryColor, borderColor: 'rgb(209 213 219)' } as React.CSSProperties}
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div>
                        <Label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1.5">{t("Password")}</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={3}
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder={t("Create a password")}
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
                            tabIndex={4}
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder={t("Confirm your password")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-offset-0 transition-colors placeholder-gray-400 bg-white"
                            style={{ '--tw-ring-color': primaryColor, borderColor: 'rgb(209 213 219)' } as React.CSSProperties}
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <div className="flex items-start !mt-4 !mb-5">
                        <Checkbox
                            id="terms"
                            name="terms"
                            checked={data.terms}
                            onClick={() => setData('terms', !data.terms)}
                            tabIndex={5}
                            className="mt-0.5 w-[14px] h-[14px] border border-gray-300 rounded"
                            style={{ '--tw-ring-color': primaryColor, color: primaryColor } as React.CSSProperties}
                        />
                        <Label htmlFor="terms" className="ml-2 text-sm text-gray-600 font-normal">
                            {t("I agree to the")}{' '}
                            <a href="#" className="font-medium hover:underline" style={{ color: primaryColor }}>
                                {t("Terms and Conditions")}
                            </a>
                        </Label>
                    </div>
                    <InputError message={errors.terms} />
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
                    tabIndex={6}
                    processing={processing}
                >
                    {t("Create account")}
                </AuthButton>

                <div className="text-center mt-5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("Already have an account?")}{' '}
                        <TextLink
                            href={route('login')}
                            className="font-medium hover:underline"
                            style={{ color: primaryColor }}
                            tabIndex={7}
                        >
                            {t("Log in")}
                        </TextLink>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
}