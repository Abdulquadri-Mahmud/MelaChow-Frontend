"use client";

import React, { useEffect, useState } from "react";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { usePathname, useRouter } from "next/navigation";
import SplashScreen from "@/app/components/SplashScreen";
import { AnimatePresence, motion } from "framer-motion";
import CustomerLogoutHandler from "./CustomerLogoutHandler";

// Routes that should be accessible to guests (no auth required)
const GUEST_ALLOWED_ROUTES = [
    "/",
    "/faqs",
    "/get-help",
];

export default function CustomerBootstrapper({ children }) {
    const pathname = usePathname();
    const router = useRouter();

    // Monitor User Auth State ONLY
    const { user, hasCheckedSession } = useUserStorage();

    // Check if current route is guest-allowed or public resource
    const isGuestAllowedRoute = GUEST_ALLOWED_ROUTES.some(route => pathname === route);
    const isRestaurantRoute = pathname?.startsWith("/restaurants/");
    const isFoodDetailsRoute = pathname?.startsWith("/food-details/");

    // Determine if user is authenticated
    const isAuthenticated = !!user;

    // Splash Visibility State
    const [showSplash, setShowSplash] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // ✅ Debug logging
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[CustomerBootstrapper] 🔐 User Auth Check:', {
                pathname,
                hasCheckedSession,
                isAuthenticated,
                showSplash,
                user: !!user,
            });
        }
    }, [pathname, hasCheckedSession, isAuthenticated, showSplash, user]);

    // ✅ Initialize splash screen (only for protected routes)
    useEffect(() => {
        // Show splash while checking session
        if (!hasCheckedSession) {
            setShowSplash(true);
        }
    }, [hasCheckedSession]);

    useEffect(() => {
        // Only process after auth is resolved
        if (!hasCheckedSession) return;

        // Dismiss splash screen after a minimum display time
        if (showSplash) {
            const splashTimer = setTimeout(() => {
                setShowSplash(false);
            }, 1500);

            return () => clearTimeout(splashTimer);
        }

        // Check if this is a protected route
        const isProtectedRoute = !isGuestAllowedRoute && !isRestaurantRoute && !isFoodDetailsRoute;

        // Only redirect if route is protected AND user is not authenticated
        if (isProtectedRoute && !isAuthenticated && !isRedirecting) {
            console.log('[CustomerBootstrapper] Redirecting unauthenticated user from protected route:', pathname);
            setIsRedirecting(true);
            router.replace("/auth/signin");
        }
    }, [
        hasCheckedSession,
        isAuthenticated,
        pathname,
        isGuestAllowedRoute,
        isRestaurantRoute,
        isFoodDetailsRoute,
        router,
        isRedirecting,
        showSplash
    ]);

    // Reset redirecting flag when pathname changes
    useEffect(() => {
        setIsRedirecting(false);
    }, [pathname]);

    return (
        <>
            <AnimatePresence mode="wait">
                {showSplash && (
                    <motion.div
                        key="splash"
                        exit={{ opacity: 0, transition: { duration: 0.5 } }}
                        className="fixed inset-0 z-[9999]"
                    >
                        <SplashScreen user={user} vendorDetails={null} />
                    </motion.div>
                )}
            </AnimatePresence>

            {!showSplash && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {children}
                    <CustomerLogoutHandler />
                </motion.div>
            )}
        </>
    );
}