"use client";

import { useState, useEffect } from "react";
import SplashScreen from "./components/SplashScreen";
import { ApiProvider } from "./context/ApiContext";
import QueryProvider from "./providers/QueryProvider";
import { ProfileProvider } from "./context/ProfileContext";
import { AdminProvider } from "./context/AdminContext";
import { CartProvider } from "./context/CartContext";
import GlobalLogoutHandler from "./components/GlobalLogoutHandler";
import ConditionalBottomNav from "./components/conditional_bottom_nav/ConditionalBottomNav";
import { Toaster } from "react-hot-toast";

export default function ClientLayout({ children }) {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        // Check if splash has already been shown in this session
        const hasShownSplash = sessionStorage.getItem("hasShownSplash");

        // Force splash on first visit, skip on reload if desired, 
        // OR better: always show brief splash but skip long wait if auth'd.
        // For now, we respect the session flag to avoid annoyance.
        if (hasShownSplash) {
            setShowSplash(false);
            return;
        }

        const timer = setTimeout(() => {
            setShowSplash(false);
            sessionStorage.setItem("hasShownSplash", "true");
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <ApiProvider>
                <QueryProvider>
                    <AdminProvider>
                        <CartProvider>
                            <ProfileProvider>
                                {showSplash ? (
                                    <SplashScreen />
                                ) : (
                                    <>
                                        {children}
                                        <GlobalLogoutHandler />
                                        <ConditionalBottomNav />
                                    </>
                                )}
                            </ProfileProvider>
                        </CartProvider>
                    </AdminProvider>
                </QueryProvider>
            </ApiProvider>
            <Toaster position="top-right" reverseOrder={false} />
        </>
    );
}
