"use client";

import { useEffect } from "react";
import { ProfileProvider } from "@/app/context/ProfileContext";
import { CartProvider } from "@/app/context/CartContext";
import CustomerBootstrapper from "./components/CustomerBootstrapper";
import ConditionalBottomNav from "@/app/components/conditional_bottom_nav/ConditionalBottomNav";
import PWAUpdateManager from "@/app/components/PWA/PWAUpdateManager";
import PWAInstallPrompt from "@/app/components/PWA/PWAInstallPrompt";
import { registerServiceWorker } from "@/app/lib/pwa-utils";
import { TokenManager } from "@/app/lib/auth-token";

export default function CustomerLayout({ children }) {
    // Initialize TokenManager and PWA on mount
    useEffect(() => {
        TokenManager.initialize();
        if (process.env.NODE_ENV === 'development') {
            console.log('[CustomerLayout] TokenManager initialized');
        }
        registerServiceWorker();
    }, []);

    return (
        <ProfileProvider>
            <CartProvider>
                <CustomerBootstrapper>
                    {children}
                    <ConditionalBottomNav />
                    <PWAUpdateManager />
                    <PWAInstallPrompt />
                </CustomerBootstrapper>
            </CartProvider>
        </ProfileProvider>
    );
}
