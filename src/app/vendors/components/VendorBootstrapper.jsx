"use client";

import React, { useEffect, useState } from "react";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import VendorLogoutHandler from "./VendorLogoutHandler";

export default function VendorBootstrapper({ children }) {
    const pathname = usePathname();
    const router = useRouter();

    // Monitor Vendor Auth State ONLY
    const { vendorDetails, hasCheckedSession } = useVendorStorage();

    // Determine if vendor is authenticated
    const isAuthenticated = !!vendorDetails;

    const [isRedirecting, setIsRedirecting] = useState(false);

    // ✅ Debug logging
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[VendorBootstrapper] 🔐 Vendor Auth Check:', {
                pathname,
                hasCheckedSession,
                isAuthenticated,
                vendor: !!vendorDetails,
            });
        }
    }, [pathname, hasCheckedSession, isAuthenticated, vendorDetails]);

    useEffect(() => {
        // Only process after auth is resolved
        if (!hasCheckedSession) return;

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
    ]);

    // Reset redirecting flag when pathname changes
    useEffect(() => {
        setIsRedirecting(false);
    }, [pathname]);

    // Keep render empty while auth boots. Allows native PWA Splash Screen to cleanly cover startup gap.
    if (!hasCheckedSession) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {children}
            <VendorLogoutHandler />
        </motion.div>
    );
}
