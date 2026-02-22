<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $storeSlug = request()->route('storeSlug') ?? null;
        [$store, $storeSlug] = resolveStore($request, $storeSlug);
        
        // If store not found, return 404
        if (!$store) {
            abort(404, 'Store not found');
        }
        
        // If already logged in, redirect to home
        if (Auth::guard('customer')->check()) {
            if ($storeSlug) {
                return redirect()->route('store.home', $storeSlug);
            }
            return redirect()->route('store.home');
        }
        
        if ($request->isMethod('post')) {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            $customer = Customer::where('store_id', $store->id)
                ->where('email', $request->email)
                ->where('is_active', true)
                ->first();

            if ($customer && Hash::check($request->password, $customer->password)) {
                Auth::guard('customer')->login($customer, $request->boolean('remember'));
                
                if ($storeSlug) {
                    return redirect()->intended(route('store.home', $storeSlug));
                }
                return redirect()->intended(route('store.home'));
            }

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Get dynamic content from database
        $storeContent = \App\Models\StoreSetting::getSettings($store->id, $store->theme ?? 'default');

        // Use theme-specific login page
        $loginPage = 'store/auth/login'; // default
        if ($store->theme === 'fashion') $loginPage = 'store/fashion/FashionLogin';
        if ($store->theme === 'electronics') $loginPage = 'store/electronics/ElectronicsLogin';
        if ($store->theme === 'beauty-cosmetics') $loginPage = 'store/beauty-cosmetics/BeautyLogin';
        if ($store->theme === 'jewelry') $loginPage = 'store/jewelry/JewelryLogin';
        if ($store->theme === 'watches') $loginPage = 'store/watches/WatchesLogin';
        if ($store->theme === 'cars-automotive') $loginPage = 'store/cars-automotive/CarsLogin';
        if ($store->theme === 'baby-kids') $loginPage = 'store/baby-kids/BabyKidsLogin';
        
        $configuration = \App\Models\StoreConfiguration::getConfiguration($store->id);
        $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;

        return inertia($loginPage, [
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'logo' => $configuration['logo'] ?: '/storage/media/logo.png',
                'theme' => $store->theme ?? 'default',
                'slug' => $store->slug,
                'enable_custom_domain' => $store->enable_custom_domain,
                'enable_custom_subdomain' => $store->enable_custom_subdomain
            ],
            'theme' => $store->theme ?? 'default',
            'storeContent' => $storeContent,
            'isLoggedIn' => Auth::guard('customer')->check(),
            'customPages' => \App\Models\CustomPage::where('store_id', $store->id)
                ->where('status', 'published')
                ->where('show_in_navigation', true)
                ->orderBy('order')
                ->get()->map(function($page) use ($storeSlug, $isCustomDomain) {
                    return [
                        'id' => $page->id,
                        'name' => $page->title,
                        'href' => $isCustomDomain ? '/page/' . $page->slug : route('store.page', ['storeSlug' => $storeSlug, 'slug' => $page->slug])
                    ];
                }),
        ]);
    }

    public function register(Request $request)
    {
        $storeSlug = request()->route('storeSlug') ?? null;
        [$store, $storeSlug] = resolveStore($request, $storeSlug);
        $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
        
        // If already logged in, redirect to home
        if (Auth::guard('customer')->check()) {
            if ($storeSlug) {
                return redirect()->route('store.home', $storeSlug);
            }
            return redirect()->route('store.home');
        }
        
        if ($request->isMethod('post')) {
            // Handle both name formats (single name field or first_name/last_name)
            if ($request->has('name') && !$request->has('first_name')) {
                $nameParts = explode(' ', trim($request->name), 2);
                $request->merge([
                    'first_name' => $nameParts[0] ?? '',
                    'last_name' => $nameParts[1] ?? '',
                ]);
            }
            
            $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'email' => 'required|string|email|max:255',
                'password' => 'required|string|min:8|confirmed',
            ]);

            $existingCustomer = Customer::where('store_id', $store->id)
                ->where('email', $request->email)
                ->first();

            if ($existingCustomer) {
                throw ValidationException::withMessages([
                    'email' => ['A customer with this email already exists.'],
                ]);
            }

            $customer = Customer::create([
                'store_id' => $store->id,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name ?: '',
                'email' => $request->email,
                'password' => $request->password,
                'is_active' => true,
            ]);

            // Dispatch CustomerCreated event for webhooks
            \App\Events\CustomerCreated::dispatch($customer);

            Auth::guard('customer')->login($customer);

            // Clear any validation errors and redirect
            session()->forget('errors');
            if ($storeSlug) {
                return redirect()->route('store.home', $storeSlug)->with('success', 'Account created successfully! Welcome to ' . $store->name);
            }
            return redirect()->route('store.home')->with('success', 'Account created successfully! Welcome to ' . $store->name);
        }

        // Get dynamic content from database
        $storeContent = \App\Models\StoreSetting::getSettings($store->id, $store->theme ?? 'default');
        
        // Use theme-specific register page
        $registerPage = 'store/auth/register'; // default
        if ($store->theme === 'fashion') $registerPage = 'store/fashion/FashionRegister';
        if ($store->theme === 'electronics') $registerPage = 'store/electronics/ElectronicsRegister';
        if ($store->theme === 'beauty-cosmetics') $registerPage = 'store/beauty-cosmetics/BeautyRegister';
        if ($store->theme === 'jewelry') $registerPage = 'store/jewelry/JewelryRegister';
        if ($store->theme === 'watches') $registerPage = 'store/watches/WatchesRegister';
        if ($store->theme === 'cars-automotive') $registerPage = 'store/cars-automotive/CarsRegister';
        if ($store->theme === 'baby-kids') $registerPage = 'store/baby-kids/BabyKidsRegister';
        
        $configuration = \App\Models\StoreConfiguration::getConfiguration($store->id);
        
        return inertia($registerPage, [
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'logo' => $configuration['logo'] ?: '/storage/media/logo.png',
                'theme' => $store->theme ?? 'default',
                'slug' => $store->slug,
                'enable_custom_domain' => $store->enable_custom_domain,
                'enable_custom_subdomain' => $store->enable_custom_subdomain
            ],
            'theme' => $store->theme ?? 'default',
            'storeContent' => $storeContent,
            'isLoggedIn' => Auth::guard('customer')->check(),
            'customPages' => \App\Models\CustomPage::where('store_id', $store->id)
                ->where('status', 'published')
                ->where('show_in_navigation', true)
                ->orderBy('order')
                ->get()->map(function($page) use ($storeSlug, $isCustomDomain) {
                    return [
                        'id' => $page->id,
                        'name' => $page->title,
                        'href' => $isCustomDomain ? '/page/' . $page->slug : route('store.page', ['storeSlug' => $storeSlug, 'slug' => $page->slug])
                    ];
                }),
        ]);
    }

    public function logout(Request $request)
    {
        $storeSlug = request()->route('storeSlug') ?? null;
        [$store, $storeSlug] = resolveStore($request, $storeSlug);
        
        Auth::guard('customer')->logout();
        
        // Only regenerate token, don't invalidate entire session
        // This prevents affecting backend user authentication
        $request->session()->regenerateToken();
        if ($storeSlug) {
            return redirect()->route('store.home', $storeSlug);
        }
        return redirect()->route('store.home');
    }

    public function forgotPassword(Request $request)
    {
        $storeSlug = request()->route('storeSlug') ?? null;
        // Get store from resolved domain or slug
        if ($request->attributes->has('resolved_store')) {
            $store = $request->attributes->get('resolved_store');
            $storeSlug = $store->slug;
        } else {
            $store = Store::where('slug', $storeSlug)->firstOrFail();
        }
        
        if ($request->isMethod('post')) {
            $request->validate([
                'email' => 'required|email',
            ]);

            $customer = Customer::where('store_id', $store->id)
                ->where('email', $request->email)
                ->where('is_active', true)
                ->first();

            // Only send email if customer exists in this store
            if ($customer) {
                // Generate reset token
                $token = Str::random(64);
                
                // Store reset token
                DB::table('customer_password_resets')->updateOrInsert(
                    ['email' => $request->email, 'store_id' => $store->id],
                    ['token' => $token, 'created_at' => now()]
                );
                
                // Configure store-specific mail settings
                $this->configureStoreMailSettings($store);
                
                // Send reset email
                $resetUrl = route('store.reset-password', ['storeSlug' => $storeSlug, 'token' => $token]) . '?email=' . urlencode($request->email);
                
                try {
                    // Send HTML email without blade template
                    Mail::html(
                        $this->getPasswordResetEmailContent($customer, $store, $resetUrl),
                        function ($message) use ($request, $store) {
                            $message->to($request->email)
                                    ->subject('Reset Password - ' . $store->name);
                        }
                    );
                } catch (\Exception $e) {
                    \Log::error('Password reset email failed: ' . $e->getMessage());
                }
            }
            // Always show success message for security (don't reveal if email exists)
            
            return back()->with('status', 'A reset link will be sent if the account exists.');
        }
        
        // Show forgot password form
        return $this->showForgotPasswordForm($store, $storeSlug);
    }

    public function resetPassword(Request $request)
    {
        $storeSlug = request()->route('storeSlug') ?? null;
        $token = request()->route('token') ?? (request()->route('storeSlug') ?? null);
        // Get store from resolved domain or slug
        if ($request->attributes->has('resolved_store')) {
            $store = $request->attributes->get('resolved_store');
            $storeSlug = $store->slug;
        } else {
            $store = Store::where('slug', $storeSlug)->firstOrFail();
        }
        
        // Get token from URL if not passed as parameter
        if (!$token) {
            $token = $request->route('token') ?? request()->segment(2);
        }
        
        if ($request->isMethod('post')) {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required|min:8|confirmed',
                'token' => 'required'
            ]);

            // Verify token
            $resetRecord = DB::table('customer_password_resets')
                ->where('email', $request->email)
                ->where('token', $request->token)
                ->where('store_id', $store->id)
                ->where('created_at', '>', Carbon::now()->subHours(1))
                ->first();

            if (!$resetRecord) {
                throw ValidationException::withMessages([
                    'email' => ['Invalid or expired reset token.'],
                ]);
            }

            // Find customer
            $customer = Customer::where('store_id', $store->id)
                ->where('email', $request->email)
                ->where('is_active', true)
                ->first();

            if (!$customer) {
                throw ValidationException::withMessages([
                    'email' => ['Customer not found.'],
                ]);
            }

            // Update password
            $customer->update([
                'password' => Hash::make($request->password)
            ]);

            // Delete reset token
            DB::table('customer_password_resets')
                ->where('email', $request->email)
                ->where('store_id', $store->id)
                ->delete();

            // Login customer
            Auth::guard('customer')->login($customer);

            if ($storeSlug) {
                return redirect()->route('store.home', $storeSlug)->with('success', 'Password reset successfully!');
            }
            return redirect()->route('store.home')->with('success', 'Password reset successfully!');
        }
        
        // Show reset password form
        return $this->showResetPasswordForm($store, $storeSlug, $token, $request->email);
    }

    private function configureStoreMailSettings($store)
    {
        if (!$store->user) return;
        
        $userId = $store->user->id;
        $storeId = $store->id;
        
        $settings = [
            'driver' => getSetting('email_driver', 'smtp', $userId, $storeId),
            'host' => getSetting('email_host', 'smtp.example.com', $userId, $storeId),
            'port' => getSetting('email_port', '587', $userId, $storeId),
            'username' => getSetting('email_username', '', $userId, $storeId),
            'password' => getSetting('email_password', '', $userId, $storeId),
            'encryption' => getSetting('email_encryption', 'tls', $userId, $storeId),
            'fromAddress' => getSetting('email_from_address', 'noreply@example.com', $userId, $storeId),
            'fromName' => getSetting('email_from_name', $store->name, $userId, $storeId)
        ];
        
        // Only configure if we have valid settings
        if (!empty($settings['username']) && !empty($settings['password'])) {
            config([
                'mail.default' => $settings['driver'],
                'mail.mailers.smtp.host' => $settings['host'],
                'mail.mailers.smtp.port' => $settings['port'],
                'mail.mailers.smtp.encryption' => $settings['encryption'] === 'none' ? null : $settings['encryption'],
                'mail.mailers.smtp.username' => $settings['username'],
                'mail.mailers.smtp.password' => $settings['password'],
                'mail.from.address' => $settings['fromAddress'],
                'mail.from.name' => $settings['fromName'],
            ]);
        }
    }

    private function getPasswordResetEmailContent($customer, $store, $resetUrl)
    {
        return '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Reset Password</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .container { border: 1px solid #ddd; border-radius: 5px; padding: 20px; }
                .header { background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
                .button { display: inline-block; padding: 10px 20px; background-color: #007cba; color: white; text-decoration: none; border-radius: 5px; }
                .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Reset Your Password</h2>
                </div>
                
                <p>Hello ' . $customer->first_name . ',</p>
                
                <p>You requested a password reset for your account at <strong>' . $store->name . '</strong>.</p>
                
                <p>Click the button below to reset your password:</p>
                
                <p><a href="' . $resetUrl . '" class="button">Reset Password</a></p>
                
                <p>If the button doesn\'t work, copy and paste this link into your browser:</p>
                <p>' . $resetUrl . '</p>
                
                <p>This link will expire in 1 hour for security reasons.</p>
                
                <p>If you didn\'t request this password reset, please ignore this email.</p>
                
                <p>Thank you!</p>
                
                <div class="footer">
                    <p>This email was sent from ' . $store->name . '</p>
                </div>
            </div>
        </body>
        </html>';
    }

    private function showForgotPasswordForm($store, $storeSlug)
    {
        $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
        $customPages = \App\Models\CustomPage::where('store_id', $store->id)
            ->where('status', 'published')
            ->where('show_in_navigation', true)
            ->orderBy('order')
            ->get()->map(function($page) use ($storeSlug, $isCustomDomain) {
                return [
                    'id' => $page->id,
                    'name' => $page->title,
                    'href' => $isCustomDomain ? '/page/' . $page->slug : route('store.page', ['storeSlug' => $storeSlug, 'slug' => $page->slug])
                ];
            });

        $storeContent = \App\Models\StoreSetting::getSettings($store->id, $store->theme ?? 'default');
        $configuration = \App\Models\StoreConfiguration::getConfiguration($store->id);
        
        // Use theme-specific forgot password page
        $forgotPasswordPage = 'store/auth/forgot-password';
        if ($store->theme === 'fashion') $forgotPasswordPage = 'store/fashion/FashionForgotPassword';
        if ($store->theme === 'electronics') $forgotPasswordPage = 'store/electronics/ElectronicsForgotPassword';
        if ($store->theme === 'beauty-cosmetics') $forgotPasswordPage = 'store/beauty-cosmetics/BeautyForgotPassword';
        if ($store->theme === 'jewelry') $forgotPasswordPage = 'store/jewelry/JewelryForgotPassword';
        if ($store->theme === 'watches') $forgotPasswordPage = 'store/watches/WatchesForgotPassword';
        if ($store->theme === 'cars-automotive') $forgotPasswordPage = 'store/cars-automotive/CarsForgotPassword';
        if ($store->theme === 'baby-kids') $forgotPasswordPage = 'store/baby-kids/BabyKidsForgotPassword';
        
        return inertia($forgotPasswordPage, [
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'logo' => $configuration['logo'] ?: '/storage/media/logo.png',
                'theme' => $store->theme ?? 'default',
                'slug' => $store->slug,
                'enable_custom_domain' => $store->enable_custom_domain,
                'enable_custom_subdomain' => $store->enable_custom_subdomain
            ],
            'theme' => $store->theme ?? 'default',
            'storeContent' => $storeContent,
            'isLoggedIn' => Auth::guard('customer')->check(),
            'customPages' => $customPages,
        ]);
    }

    private function showResetPasswordForm($store, $storeSlug, $token, $email)
    {
        $storeSlug = request()->route('storeSlug') ?? null;
        $isCustomDomain = request() && request()->attributes->has('resolved_store') ?? false;
        $customPages = \App\Models\CustomPage::where('store_id', $store->id)
            ->where('status', 'published')
            ->where('show_in_navigation', true)
            ->orderBy('order')
            ->get()->map(function($page) use ($storeSlug, $isCustomDomain) {
                return [
                    'id' => $page->id,
                    'name' => $page->title,
                    'href' => $isCustomDomain ? '/page/' . $page->slug : route('store.page', ['storeSlug' => $storeSlug, 'slug' => $page->slug])
                ];
            });

        $storeContent = \App\Models\StoreSetting::getSettings($store->id, $store->theme ?? 'default');
        $configuration = \App\Models\StoreConfiguration::getConfiguration($store->id);
        
        // Use theme-specific reset password page
        $resetPasswordPage = 'store/auth/reset-password';
        if ($store->theme === 'fashion') $resetPasswordPage = 'store/fashion/FashionResetPassword';
        if ($store->theme === 'electronics') $resetPasswordPage = 'store/electronics/ElectronicsResetPassword';
        if ($store->theme === 'beauty-cosmetics') $resetPasswordPage = 'store/beauty-cosmetics/BeautyResetPassword';
        if ($store->theme === 'jewelry') $resetPasswordPage = 'store/jewelry/JewelryResetPassword';
        if ($store->theme === 'watches') $resetPasswordPage = 'store/watches/WatchesResetPassword';
        if ($store->theme === 'cars-automotive') $resetPasswordPage = 'store/cars-automotive/CarsResetPassword';
        if ($store->theme === 'baby-kids') $resetPasswordPage = 'store/baby-kids/BabyKidsResetPassword';
        
        return inertia($resetPasswordPage, [
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'logo' => $configuration['logo'] ?: '/storage/media/logo.png',
                'theme' => $store->theme ?? 'default',
                'slug' => $store->slug,
                'enable_custom_domain' => $store->enable_custom_domain,
                'enable_custom_subdomain' => $store->enable_custom_subdomain
            ],
            'theme' => $store->theme ?? 'default',
            'storeContent' => $storeContent,
            'isLoggedIn' => Auth::guard('customer')->check(),
            'customPages' => $customPages,
            'token' => $token,
            'email' => $email,
        ]);
    }

}