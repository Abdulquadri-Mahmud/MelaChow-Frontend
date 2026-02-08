"use client";

import React, { useEffect, useState } from "react";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import { usePathname, useRouter } from "next/navigation";
import SplashScreen from "@/app/components/SplashScreen";
import { AnimatePresence, motion } from "framer-motion";
import VendorLogoutHandler from "./VendorLogoutHandler";

// Public vendor routes
const VENDOR_PUBLIC_ROUTES = [
    "/vendors/auth/login",
    "/vendors/auth/register",
    "/vendors/auth/verify-account",
];

export default function VendorBootstrapper({ children }) {
    const pathname = usePathname();
    const router = useRouter();

    // Monitor Vendor Auth State ONLY
    const { vendorDetails, hasCheckedSession } = useVendorStorage();

    // Check if current route is public
    const isPublicRoute = VENDOR_PUBLIC_ROUTES.some(route => pathname?.startsWith(route));

    // Determine if vendor is authenticated
    const isAuthenticated = !!vendorDetails;

    // Splash Visibility State
    const [showSplash, setShowSplash] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // ✅ Debug logging
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[VendorBootstrapper] 🔐 Vendor Auth Check:', {
                pathname,
                hasCheckedSession,
                isAuthenticated,
                showSplash,
                vendor: !!vendorDetails,
            });
        }
    }, [pathname, hasCheckedSession, isAuthenticated, showSplash, vendorDetails]);

    // ✅ Prevent hydration mismatch
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Only show splash if it hasn't been shown in this session
        const hasShownSplash = sessionStorage.getItem("vendorSplashShown");
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
            sessionStorage.setItem("vendorSplashShown", "true");
        }

        // Skip redirect logic for public routes
        if (isPublicRoute) return;

        // ✅ Redirect if not authenticated
        if (!isAuthenticated && !isRedirecting) {
            const redirectTimer = setTimeout(() => {
                console.log("🔒 Unauthorized vendor access. Redirecting to login...");
                setIsRedirecting(true);
                router.replace("/vendors/auth/login");
            }, 300);

            return () => clearTimeout(redirectTimer);
        }
    }, [
        hasCheckedSession,
        isAuthenticated,
        pathname,
        isPublicRoute,
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
                        <SplashScreen user={null} vendorDetails={vendorDetails} />
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
                    <VendorLogoutHandler />
                </motion.div>
            )}
        </>
    );
}
