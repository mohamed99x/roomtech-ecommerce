import { useForm, router, usePage } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect } from 'react';
import { generateStoreUrl } from '@/utils/store-url-helper';
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
import { Button } from '@/components/ui/button';
import { getStoreThemes } from '@/data/storeThemes';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
    recaptcha_token?: string;
};

interface DemoStore {
    id: number;
    name: string;
    slug: string;
    theme: string;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    demoStores?: DemoStore[];
}

export default function Login({ status, canResetPassword, demoStores = [] }: LoginProps) {
    const { t } = useTranslation();
    const [recaptchaToken, setRecaptchaToken] = useState<string>('');
    const { themeColor, customColor } = useBrand();
    const { settings = {} } = usePage().props as any;
    const recaptchaEnabled = settings.recaptchaEnabled === 'true' || settings.recaptchaEnabled === true || settings.recaptchaEnabled === 1 || settings.recaptchaEnabled === '1';
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const [isDemo, setIsDemo] = useState<boolean>(false);
    const [hoveredStore, setHoveredStore] = useState<string | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        // Check if demo mode is enabled
        const isDemoMode = (window as any).isDemo === true;
        setIsDemo(isDemoMode);

        // Set default credentials if in demo mode
        if (isDemoMode) {
            setData({
                email: 'company@example.com',
                password: 'password',
                remember: false
            });
        }
    }, []);

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
                post(route('login'), formData, {
                    onFinish: () => reset('password'),
                });
                return;
            } catch {
                alert(t('reCAPTCHA verification failed. Please try again.'));
                return;
            }
        }

        const formData = { ...data, recaptcha_token: recaptchaToken };
        post(route('login'), formData, {
            onFinish: () => reset('password'),
        });
    };

    const openStoreInNewTab = (store: any, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const url = generateStoreUrl('store.home', store);
        window.open(url, '_blank');
    };

    const getThemeThumbnail = (themeId: string) => {
        const theme = getStoreThemes().find(t => t.id === themeId);
        return theme?.thumbnail || '';
    };

    return (
        <AuthLayout
            title={t("Log in to your account")}
            description={t("Enter your email and password below to log in")}
            status={status}
        >
            <form className="mt-6" onSubmit={submit}>
                <div className="space-y-5">
                    <div>
                        <Label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1.5">{t("Email")}</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
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
                        <div className="flex items-center justify-between mb-1.5">
                            <Label htmlFor="password" className="block text-sm font-medium text-gray-900">{t("Password")}</Label>
                            {canResetPassword && (
                                <TextLink
                                    href={route('password.request')}
                                    className="text-sm font-medium hover:underline"
                                    style={{ color: primaryColor }}
                                    tabIndex={5}
                                >
                                    {t("Forgot password?")}
                                </TextLink>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder={t("Enter your password")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-offset-0 transition-colors placeholder-gray-400 bg-white"
                            style={{ '--tw-ring-color': primaryColor, borderColor: 'rgb(209 213 219)' } as React.CSSProperties}
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center !mt-4 !mb-5">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onClick={() => setData('remember', !data.remember)}
                            tabIndex={3}
                            className="w-[14px] h-[14px] border border-gray-300 rounded"
                            style={{ '--tw-ring-color': primaryColor, color: primaryColor } as React.CSSProperties}
                        />
                        <Label htmlFor="remember" className="ml-2 text-sm text-gray-600 font-normal">{t("Remember me")}</Label>
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
                    tabIndex={4}
                    processing={processing}
                >
                    {t("SIGN IN")}
                </AuthButton>

                <div className="text-center mt-5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("Don't have an account?")}{' '}
                        <TextLink
                            href={route('register')}
                            className="font-medium hover:underline"
                            style={{ color: primaryColor }}
                            tabIndex={6}
                        >
                            {t("Create one")}
                        </TextLink>
                    </p>
                </div>

                {/* Divider */}
                <div className="my-5">
                    <div className="flex items-center">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <div className="w-2 h-2 rotate-45 mx-4" style={{ backgroundColor: primaryColor }}></div>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                </div>

                {isDemo && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300 tracking-wider mb-4 text-center">{t('Quick Access')}</h3>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={async () => {
                                    if (recaptchaEnabled) {
                                        try {
                                            const token = await executeRecaptcha();
                                            if (!token) {
                                                alert(t('Please complete the reCAPTCHA verification'));
                                                return;
                                            }
                                            router.post(route('login'), {
                                                email: 'superadmin@example.com',
                                                password: 'password',
                                                remember: false,
                                                recaptcha_token: token
                                            });
                                        } catch {
                                            alert(t('reCAPTCHA verification failed. Please try again.'));
                                        }
                                    } else {
                                        router.post(route('login'), {
                                            email: 'superadmin@example.com',
                                            password: 'password',
                                            remember: false,
                                            recaptcha_token: recaptchaToken
                                        });
                                    }
                                }}
                                className="group relative py-2 px-4 border text-[13px] font-medium text-white transition-all duration-200 rounded-md shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                                style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                            >
                                {t('Super Admin')}
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (recaptchaEnabled) {
                                        try {
                                            const token = await executeRecaptcha();
                                            if (!token) {
                                                alert(t('Please complete the reCAPTCHA verification'));
                                                return;
                                            }
                                            router.post(route('login'), {
                                                email: 'company@example.com',
                                                password: 'password',
                                                remember: false,
                                                recaptcha_token: token
                                            });
                                        } catch {
                                            alert(t('reCAPTCHA verification failed. Please try again.'));
                                        }
                                    } else {
                                        router.post(route('login'), {
                                            email: 'company@example.com',
                                            password: 'password',
                                            remember: false,
                                            recaptcha_token: recaptchaToken
                                        });
                                    }
                                }}
                                className="group relative py-2 px-4 border text-[13px] font-medium text-white transition-all duration-200 rounded-md shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                                style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                            >
                                {t('Shop Owner')}
                            </button>
                        </div>

                        {/* Divider */}
                <div className="my-5">
                    <div className="flex items-center">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <div className="w-2 h-2 rotate-45 mx-4" style={{ backgroundColor: primaryColor }}></div>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                </div>

                        {demoStores && demoStores.length > 0 && (
                            <div className='mt-4'>
                                <h3 className="text-sm font-medium text-gray-900 tracking-wider mb-4 text-center">{t('Store Themes')}</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {demoStores.map((store) => (
                                        <div key={store.id} className="relative group w-full">
                                            <button
                                                type="button"
                                                onClick={(e) => openStoreInNewTab(store, e)}
                                                onMouseEnter={() => setHoveredStore(store.theme)}
                                                onMouseLeave={() => setHoveredStore(null)}
                                                style={{ '--btn-color': primaryColor } as React.CSSProperties}
                                                className="w-full py-2 px-3 text-[13px] text-gray-700 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 rounded-md border border-gray-200 hover:border-gray-300 font-medium cursor-pointer"
                                            >
                                                {store.theme
                                                    .split('-')
                                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                    .join(' ')}
                                            </button>

                                            {/* Theme Preview Tooltip */}
                                            {hoveredStore === store.theme && getThemeThumbnail(store.theme) && (
                                                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white p-1.5 rounded-lg shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200 w-48 pointer-events-none">
                                                    <div className="relative rounded overflow-hidden bg-gray-50 aspect-[16/10]">
                                                        <img
                                                            src={getThemeThumbnail(store.theme)}
                                                            alt={store.theme}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                    {/* Tooltip Arrow */}
                                                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45 shadow-sm"></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </form>
        </AuthLayout>
    );
}