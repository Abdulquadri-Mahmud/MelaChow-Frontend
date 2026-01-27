"use client";

import { useState, useEffect } from "react";
import SplashScreen from "./components/SplashScreen";
import { ApiProvider } from "./context/ApiContext";
import QueryProvider from "./providers/QueryProvider";
import { ProfileProvider } from "./context/ProfileContext";
import { CartProvider } from "./context/CartContext";
import AutoLogout from "./auto-logout/AutoLogout";
import VendorsAutoLogout from "./auto-logout/VendorAutoLogout";
import ConditionalBottomNav from "./components/conditional_bottom_nav/ConditionalBottomNav";
import { Toaster } from "react-hot-toast";

export default function ClientLayout({ children }) {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        // Check if splash has already been shown in this session
        const hasShownSplash = sessionStorage.getItem("hasShownSplash");

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

    if (showSplash) {
        return <SplashScreen />;
    }

    return (
        <>
            <ApiProvider>
                <QueryProvider>
                    <CartProvider>
                        <ProfileProvider>
                            {children}
                            <AutoLogout />
                            <VendorsAutoLogout />
                            <ConditionalBottomNav />
                        </ProfileProvider>
                    </CartProvider>
                </QueryProvider>
            </ApiProvider>
            <Toaster position="top-right" reverseOrder={false} />
        </>
    );
}
