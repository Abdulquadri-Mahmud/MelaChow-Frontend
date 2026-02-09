"use client";

import React, { useEffect, useState } from "react";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import { usePathname, useRouter } from "next/navigation";
import SplashScreen from "@/app/components/SplashScreen";
import { AnimatePresence, motion } from "framer-motion";
import VendorLogoutHandler from "./VendorLogoutHandler";

export default function VendorBootstrapper({ children }) {
    const pathname = usePathname();
    const router = useRouter();

    // Monitor Vendor Auth State ONLY
    const { vendorDetails, hasCheckedSession } = useVendorStorage();

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

    // ✅ Initialize splash screen
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

        // ✅ Redirect if not authenticated (since this is now ONLY used for protected routes)
        if (!isAuthenticated && !isRedirecting) {
            console.log("🔒 Unauthorized vendor access. Redirecting to login...");
            setIsRedirecting(true);
            router.replace("/vendors/auth/login");
        }
    }, [
        hasCheckedSession,
        isAuthenticated,
        pathname,
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
