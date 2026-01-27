"use client";

import React, { useEffect, useState } from "react";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import SplashScreen from "./SplashScreen";
import { AnimatePresence, motion } from "framer-motion";

export default function AppBootstrapper({ children }) {
    // 1. Monitor Auth States
    const { user, isLoading: isUserLoading } = useUserStorage();
    const { vendorDetails, isLoading: isVendorLoading } = useVendorStorage();

    // 2. Track global app readiness
    // We are ready when both potential auth checks have settled (loading is false)
    const isAuthResolved = !isUserLoading && !isVendorLoading;

    // 3. Splash Visibility State
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        // Only dismiss splash when auth is fully resolved
        if (isAuthResolved) {
            // Optional: Minimum display time could be added here if it's TOO fast,
            // but the prompt explicitly asked to avoid "Time-based splash dismissal"
            // unless it's for user experience (flashing). 
            // We will respect the "Logic-driven" request mostly.
            setShowSplash(false);
        }
    }, [isAuthResolved]);

    return (
        <>
            <AnimatePresence mode="wait">
                {showSplash && (
                    <motion.div
                        key="splash"
                        exit={{ opacity: 0, transition: { duration: 0.5 } }}
                        className="fixed inset-0 z-[9999]"
                    >
                        {/* We pass auth state to splash to allow it to show specific messages if needed */}
                        <SplashScreen user={user} vendor={vendorDetails} />
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
