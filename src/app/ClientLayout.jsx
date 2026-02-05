"use client";

import { useEffect } from "react";
import AppBootstrapper from "./components/AppBootstrapper";
import { ApiProvider } from "./context/ApiContext";
import QueryProvider from "./providers/QueryProvider";
import { ProfileProvider } from "./context/ProfileContext";
import { AdminProvider } from "./context/AdminContext";
import { CartProvider } from "./context/CartContext";
import GlobalLogoutHandler from "./components/GlobalLogoutHandler";
import ConditionalBottomNav from "./components/conditional_bottom_nav/ConditionalBottomNav";
import PWAUpdateManager from "./components/PWA/PWAUpdateManager";
import PWAInstallPrompt from "./components/PWA/PWAInstallPrompt";
import { registerServiceWorker } from "./lib/pwa-utils";
import { Toaster } from "react-hot-toast";
import "@/app/lib/api"; // Register axios interceptors
import { TokenManager } from "./lib/auth-token";

export default function ClientLayout({ children }) {
    // Register service worker on mount & Initialize TokenManager
    useEffect(() => {
        TokenManager.initialize();
        if (process.env.NODE_ENV === 'development') {
            console.log('[TokenManager] Initialized on app boot');
        }
        registerServiceWorker();
    }, []);

    return (
        <>
            <ApiProvider>
                <QueryProvider>
                    <AdminProvider>
                        <CartProvider>
                            <ProfileProvider>
                                <AppBootstrapper>
                                    {children}
                                    <GlobalLogoutHandler />
                                    <ConditionalBottomNav />
                                    {/* PWA Components - Non-blocking, additive */}
                                    <PWAUpdateManager />
                                    <PWAInstallPrompt />
                                </AppBootstrapper>
                            </ProfileProvider>
                        </CartProvider>
                    </AdminProvider>
                </QueryProvider>
            </ApiProvider>
            <Toaster position="top-right" reverseOrder={false} />
        </>
    );
}
