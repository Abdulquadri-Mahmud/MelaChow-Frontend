"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ProfileProvider } from "@/app/context/ProfileContext";
import { CartProvider } from "@/app/context/CartContext";
import CustomerBootstrapper from "./components/CustomerBootstrapper";
import ConditionalBottomNav from "@/app/components/conditional_bottom_nav/ConditionalBottomNav";
import PWAUpdateManager from "@/app/components/PWA/PWAUpdateManager";
import PWAInstallPrompt from "@/app/components/PWA/PWAInstallPrompt";
import PushNotificationPrompt from "@/app/components/notifications/PushNotificationPrompt";
import RealtimeNotificationListener from "@/app/components/notifications/RealtimeNotificationListener";
import { registerServiceWorker } from "@/app/lib/pwa-utils";
import { TokenManager } from "@/app/lib/auth-token";
import GlobalFoodModal from "@/app/components/modals/GlobalFoodModal";

export default function CustomerLayout({ children }) {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        TokenManager.initialize();
        if (process.env.NODE_ENV === 'development') {
            console.log('[CustomerLayout] TokenManager initialized');
        }
        registerServiceWorker();
    }, []);

    // ✅ Only check route after mount to prevent hydration mismatch
    const isAuthRoute = isMounted && pathname?.startsWith("/auth/");

    // ✅ Show loading state during SSR to prevent hydration mismatch
    // CRITICAL SEO FIX: We MUST render the children and Footer so Googlebot
    // actually receives the HTML. We only delay purely client-side features.
    if (!isMounted) {
        return (
            <ProfileProvider>
                <CartProvider>
                    {isAuthRoute ? (
                        <>
                            {children}
                        </>
                    ) : (
                        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
                            {children}
                        </div>
                    )}
                    <GlobalFoodModal />
                </CartProvider>
            </ProfileProvider>
        );
    }

    return (
        <ProfileProvider>
            <CartProvider>
                {isAuthRoute ? (
                    // Auth routes: no bootstrapper, no bottom nav
                    <>
                        {children}
                        <PWAUpdateManager />
                        <PWAInstallPrompt />
                        <PushNotificationPrompt />
                        <RealtimeNotificationListener />
                    </>
                ) : (
                    // Protected routes: full bootstrapper
                    <CustomerBootstrapper>
                        {children}
                        <ConditionalBottomNav />
                        <PWAUpdateManager />
                        <PWAInstallPrompt />
                        <PushNotificationPrompt />
                        <RealtimeNotificationListener />
                    </CustomerBootstrapper>
                )}
                <GlobalFoodModal />
            </CartProvider>
        </ProfileProvider>
    );
}
