import { useForm } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/layouts/auth-layout';
import AuthButton from '@/components/auth/auth-button';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';

export default function ConfirmPassword() {
    const { t } = useTranslation();
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { data, setData, post, processing, errors, reset } = useForm<Required<{ password: string }>>({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title={t("Confirm your password")}
            description={t("This is a secure area of the application. Please confirm your password before continuing.")}
            icon={<Lock className="h-6 w-6" />}
        >
            <form onSubmit={submit} className="mt-6">
                <div className="space-y-5">
                    <div>
                        <Label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1.5">{t("Password")}</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder={t("Enter your password")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-offset-0 transition-colors placeholder-gray-400 bg-white"
                            style={{ '--tw-ring-color': primaryColor, borderColor: 'rgb(209 213 219)' } as React.CSSProperties}
                        />
                        <InputError message={errors.password} />
                    </div>
                </div>

                <AuthButton 
                    tabIndex={2} 
                    processing={processing}
                    className="mt-4"
                >
                    {t("Confirm password")}
                </AuthButton>
            </form>
        </AuthLayout>
    );
}