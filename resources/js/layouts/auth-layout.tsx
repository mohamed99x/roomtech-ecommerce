import { Head } from '@inertiajs/react';
import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useBrand } from '@/contexts/BrandContext';
import { useAppearance, THEME_COLORS } from '@/hooks/use-appearance';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
    icon?: ReactNode;
    status?: string;
    statusType?: 'success' | 'error';
}

export default function AuthLayout({
    children,
    title,
    description,
    icon,
    status,
    statusType = 'success',
}: AuthLayoutProps) {
    const { t } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const { logoLight, logoDark, themeColor, customColor, favicon, themeMode } = useBrand();
    const { appearance } = useAppearance();

    // Determine effective appearance
    const isSystemDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = themeMode === 'dark' || (themeMode === 'system' && isSystemDark) || appearance === 'dark';

    const currentLogo = isDark ? logoLight : logoDark;
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
            <Head>
                <title>{title}</title>
                {favicon && <link rel="icon" href={favicon} />}
            </Head>

            {/* Enhanced Background Design */}
            <div className="absolute inset-0 z-0">
                {/* Base Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300"></div>



                {/* Elegant Pattern Overlay */}
                <div className="absolute inset-0 opacity-70" style={{
                    backgroundImage: `radial-gradient(circle at 30% 70%, ${primaryColor} 1px, transparent 1px)`,
                    backgroundSize: '80px 80px'
                }}></div>
            </div>

            {/* Language Dropdown */}
            <div className="absolute top-6 right-6 z-20 md:block hidden">
                <LanguageSwitcher />
            </div>

            <div className="flex items-center justify-center min-h-screen p-6 relative z-10">
                <div
                    className={`w-full max-w-md transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                >
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="relative inline-block px-6 rounded-xl">
                            {currentLogo ? (
                                <img src={currentLogo} alt="Logo" className="w-auto h-6 sm:h-7 mx-auto object-contain" />
                            ) : (
                                <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>StoreGo</h2>
                            )}
                        </div>
                    </div>

                    {/* Main Card */}
                    <div className="relative">
                        {/* Corner accents */}
                        <div
                            className="absolute -top-3 -left-3 w-6 h-6 border-l-2 border-t-2 rounded-tl-md transition-colors duration-300"
                            style={{ borderColor: primaryColor }}
                        ></div>
                        <div
                            className="absolute -bottom-3 -right-3 w-6 h-6 border-r-2 border-b-2 rounded-br-md transition-colors duration-300"
                            style={{ borderColor: primaryColor }}
                        ></div>

                        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg lg:p-8 p-4 lg:pt-5 shadow-sm">
                            {/* Header */}
                            <div className="text-center mb-6">
                                <h1 className="md:text-2xl text-xl font-semibold text-gray-900 mb-1.5 tracking-wide">{title}</h1>

                                <div className="w-12 h-px mx-auto mb-2.5" style={{ backgroundColor: primaryColor }}></div>

                                {description && (
                                    <p className="text-gray-600 text-sm">{description}</p>
                                )}
                            </div>

                            {status && (
                                <div className={`mb-5 text-center text-sm font-medium ${statusType === 'success'
                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                    : 'text-rose-700 bg-rose-50 border-rose-200'
                                    } p-3 rounded-md border`}>
                                    {status}
                                </div>
                            )}

                            {/* Content */}
                            {children}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-6">
                        <div className="inline-flex items-center space-x-2 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-md px-4 py-2 border border-gray-200 dark:border-slate-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} {appearance === 'dark' ? 'StoreGo' : 'StoreGo'} SaaS</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}