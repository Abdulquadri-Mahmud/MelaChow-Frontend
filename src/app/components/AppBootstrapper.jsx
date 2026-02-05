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
    const isAuthResolved = hasUserChecked && hasVendorChecked;

    // Splash Visibility State
    const [showSplash, setShowSplash] = useState(false); // ✅ Default to HIDDEN to prevent refresh flash
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        // Only show splash if it hasn't been shown in this session
        const hasShownSplash = sessionStorage.getItem("splashShown");
        if (!hasShownSplash) {
            setShowSplash(true);
        }
    }, []);

    // Check if current route is public or guest-allowed
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));
    const isGuestAllowedRoute = GUEST_ALLOWED_ROUTES.some(route => pathname === route);
    const isRestaurantRoute = pathname?.startsWith("/restataurants/");
    const isFoodDetailsRoute = pathname?.startsWith("/food-details/");
    const isAdminRoute = pathname?.startsWith("/admin/");

    // Determine if user is authenticated
    const isAuthenticated = !!user || !!vendorDetails;

    useEffect(() => {
        // Only process after auth is resolved (Session Finality)
        if (!isAuthResolved) return;

        // Dismiss splash screen ONLY after session check is done
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
                console.log("🔒 Unauthorized access detected after session check. Redirecting to signin...");
                setIsRedirecting(true);
                router.replace("/auth/signin");
            }, 300);

            return () => clearTimeout(redirectTimer);
        }
    }, [isAuthResolved, isAuthenticated, pathname, isPublicRoute, isGuestAllowedRoute, isRestaurantRoute, router, isRedirecting, isFoodDetailsRoute, showSplash]);

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
