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
    "/vendor-auth/signin",
    "/vendor-auth/signup",
    "/admin/login",
];

// Routes that should be accessible to guests (no auth required)
const GUEST_ALLOWED_ROUTES = [
    "/",
    "/faqs",
    "/get-help",
];

export default function AppBootstrapper({ children }) {
    const pathname = usePathname();
    const router = useRouter();

    // Monitor Auth States
    const { user, isLoading: isUserLoading } = useUserStorage();
    const { vendorDetails, isLoading: isVendorLoading } = useVendorStorage();

    // Track global app readiness
    const isAuthResolved = !isUserLoading && !isVendorLoading;

    // Splash Visibility State
    const [showSplash, setShowSplash] = useState(true);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Check if current route is public or guest-allowed
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));
    const isGuestAllowedRoute = GUEST_ALLOWED_ROUTES.some(route => pathname === route);
    const isRestaurantRoute = pathname?.startsWith("/restataurants/");

    // Determine if user is authenticated
    const isAuthenticated = !!user || !!vendorDetails;

    useEffect(() => {
        // Only process after auth is resolved
        if (!isAuthResolved) return;

        // Dismiss splash screen
        setShowSplash(false);

        // Skip redirect logic for public routes
        if (isPublicRoute) return;

        // Allow guest access to specific routes
        if (isGuestAllowedRoute || isRestaurantRoute) return;

        // If not authenticated and trying to access protected route, redirect to signin
        if (!isAuthenticated && !isRedirecting) {
            console.log("🔒 Unauthorized access detected. Redirecting to signin...");
            setIsRedirecting(true);
            router.replace("/auth/signin");
        }
    }, [isAuthResolved, isAuthenticated, pathname, isPublicRoute, isGuestAllowedRoute, isRestaurantRoute, router, isRedirecting]);

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
