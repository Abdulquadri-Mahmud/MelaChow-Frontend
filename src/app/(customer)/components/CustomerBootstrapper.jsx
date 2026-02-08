"use client";

import React, { useEffect, useState } from "react";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { usePathname, useRouter } from "next/navigation";
import SplashScreen from "@/app/components/SplashScreen";
import { AnimatePresence, motion } from "framer-motion";
import CustomerLogoutHandler from "./CustomerLogoutHandler";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
    "/auth/signin",
    "/auth/signup",
    "/auth/verify-account",
    "/auth/forgot-password",
    "/auth/reset-password",
];

// Routes that should be accessible to guests (no auth required)
const GUEST_ALLOWED_ROUTES = [
    "/",
    "/faqs",
    "/get-help",
    // Add more public routes as needed
];

export default function CustomerBootstrapper({ children }) {
    const pathname = usePathname();
    const router = useRouter();

    // Monitor User Auth State ONLY
    const { user, hasCheckedSession } = useUserStorage();

    // Check if current route is public or guest-allowed
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));
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

    // ✅ Prevent hydration mismatch
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Only show splash if it hasn't been shown in this session
        const hasShownSplash = sessionStorage.getItem("splashShown");
        if (!hasShownSplash) {
            setShowSplash(true);
        }
    }, []);

    useEffect(() => {
        // Only process after auth is resolved
        if (!hasCheckedSession) return;

        // Dismiss splash screen ONLY after session check is done
        if (showSplash) {
            setShowSplash(false);
            sessionStorage.setItem("splashShown", "true");
        }

        // Skip redirect logic for public routes
        if (isPublicRoute) return;

        // Allow guest access to specific routes
        if (isGuestAllowedRoute || isRestaurantRoute || isFoodDetailsRoute) return;

        // ✅ Redirect if not authenticated
        if (!isAuthenticated && !isRedirecting) {
            const redirectTimer = setTimeout(() => {
                console.log("🔒 Unauthorized access. Redirecting to signin...");
                setIsRedirecting(true);
                router.replace("/auth/signin");
            }, 300);

            return () => clearTimeout(redirectTimer);
        }
    }, [
        hasCheckedSession,
        isAuthenticated,
        pathname,
        isPublicRoute,
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

    // ✅ Don't render until mounted to prevent hydration errors
    if (!isMounted) return null;

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
