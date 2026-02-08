"use client";

import React, { useEffect, useState } from "react";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import { usePathname, useRouter } from "next/navigation";
import SplashScreen from "./SplashScreen";
import { AnimatePresence, motion } from "framer-motion";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
    "/auth/signin",
    "/auth/signup",
    "/auth/verify-account",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/vendors/auth/login",
    "/vendors/auth/register",
    "/vendors/auth/verify-account",
    "/admin/login",
];

// Routes that should be accessible to guests (no auth required)
const GUEST_ALLOWED_ROUTES = [
    "/",
    "/faqs",
    "/get-help",
    // "/all-restaurants",
    // "/all-foods",
    // "/search",
];

export default function AppBootstrapper({ children }) {
    const pathname = usePathname();
    const router = useRouter();

    // Monitor Auth States
    const { user, hasCheckedSession: hasUserChecked } = useUserStorage();
    const { vendorDetails, hasCheckedSession: hasVendorChecked } = useVendorStorage();

    // Track global app readiness (Session Finality)
    // const isAuthResolved = hasUserChecked && hasVendorChecked; // No longer used, logic moved to useEffect

    // Check if current route is public or guest-allowed
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));
    const isGuestAllowedRoute = GUEST_ALLOWED_ROUTES.some(route => pathname === route);
    const isRestaurantRoute = pathname?.startsWith("/restataurants/");
    const isFoodDetailsRoute = pathname?.startsWith("/food-details/");
    const isAdminRoute = pathname?.startsWith("/admin/");

    // Determine if user is authenticated
    const isAuthenticated = !!user || !!vendorDetails;

    // Splash Visibility State
    const [showSplash, setShowSplash] = useState(false); // ✅ Default to HIDDEN to prevent refresh flash
    const [isRedirecting, setIsRedirecting] = useState(false);

    // ✅ Debug logging to track auth state
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            const isVendorRoute = pathname?.startsWith("/vendors/");

            console.log('[AppBootstrapper] 🔐 Auth Check Status:', {
                pathname,
                isVendorRoute,
                hasUserChecked,
                hasVendorChecked,
                isAuthenticated,
                showSplash,
                user: !!user,
                vendor: !!vendorDetails,
            });
        }
    }, [pathname, hasUserChecked, hasVendorChecked, isAuthenticated, showSplash, user, vendorDetails]);

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
        // ✅ Determine which auth check we need based on current route
        const isVendorRoute = pathname?.startsWith("/vendors/");
        const isUserRoute = !isVendorRoute && !isAdminRoute;

        // ✅ Only wait for the RELEVANT auth check
        let relevantAuthResolved = false;

        if (isVendorRoute) {
            // Vendor routes only wait for vendor check
            relevantAuthResolved = hasVendorChecked;
        } else if (isUserRoute) {
            // User routes only wait for user check
            relevantAuthResolved = hasUserChecked;
        } else {
            // Admin/other routes wait for both (safe default)
            relevantAuthResolved = hasUserChecked && hasVendorChecked;
        }

        // Only process after RELEVANT auth is resolved
        if (!relevantAuthResolved) return;

        // Dismiss splash screen ONLY after relevant session check is done
        if (showSplash) {
            setShowSplash(false);
            sessionStorage.setItem("splashShown", "true");
        }

        // Skip redirect logic for public routes
        if (isPublicRoute) return;

        // Allow guest access to specific routes
        if (isGuestAllowedRoute || isRestaurantRoute || isFoodDetailsRoute) return;

        // Skip redirect logic for admin routes (handled by AdminProtectedRoute)
        if (isAdminRoute) return;

        // ✅ iOS Race Condition Fix:
        // Only redirect AFTER session is fully checked AND user is not authenticated
        if (!isAuthenticated && !isRedirecting) {
            // ✅ iOS Safari Fix: 300ms delay allows cookies to be restored after navigation
            // iOS Safari sometimes needs extra time to read cookies after page refresh
            const redirectTimer = setTimeout(() => {
                // ✅ Determine correct redirect based on current route
                const redirectUrl = isVendorRoute ? "/vendors/auth/login" : "/auth/signin";

                console.log("🔒 Unauthorized access detected after session check. Redirecting to:", redirectUrl);
                setIsRedirecting(true);
                router.replace(redirectUrl);
            }, 300);

            return () => clearTimeout(redirectTimer);
        }
    }, [
        hasUserChecked,
        hasVendorChecked,
        isAuthenticated,
        pathname,
        isPublicRoute,
        isGuestAllowedRoute,
        isRestaurantRoute,
        router,
        isRedirecting,
        isFoodDetailsRoute,
        showSplash,
        isAdminRoute
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
                        <SplashScreen user={user} vendorDetails={vendorDetails} />
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
                </motion.div>
            )}
        </>
    );
}
