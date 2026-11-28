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
import GlobalComboModal from "@/app/components/modals/GlobalComboModal";
import NavigationFeedback from "@/app/components/NavigationFeedback";
import { CallProvider } from "@/app/context/CallContext";
import CallOverlay from "@/app/components/call/CallOverlay";
import PostHogProvider from "@/app/providers/PostHogProvider";

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

    // Keep the wrapper tree consistent across SSR and client hydration so
    // RootPage / SplashScreen is never unmounted and remounted on mount.
    return (
        <ProfileProvider>
            <PostHogProvider>
            <CartProvider>
                <CallProvider>
                    {isAuthRoute ? (
                        // Auth routes: no bootstrapper, no bottom nav
                        <>
                            {children}
                            {isMounted && (
                                <>
                                    <PWAUpdateManager />
                                    <PWAInstallPrompt />
                                    <PushNotificationPrompt />
                                    <RealtimeNotificationListener />
                                </>
                            )}
                        </>
                    ) : (
                        // Protected routes: full bootstrapper
                        <CustomerBootstrapper>
                            {children}
                            {isMounted && (
                                <>
                                    <ConditionalBottomNav />
                                    <PWAUpdateManager />
                                    <PWAInstallPrompt />
                                    <PushNotificationPrompt />
                                    <RealtimeNotificationListener />
                                </>
                            )}
                        </CustomerBootstrapper>
                    )}
                    <GlobalFoodModal />
                    <GlobalComboModal />
                    <CallOverlay />
                </CallProvider>
            </CartProvider>
            </PostHogProvider>
        </ProfileProvider>
    );
}
