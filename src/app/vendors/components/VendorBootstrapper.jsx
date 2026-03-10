"use client";

import React, { useEffect, useRef } from "react";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import VendorLogoutHandler from "./VendorLogoutHandler";

export default function VendorBootstrapper({ children }) {
    const pathname = usePathname();
    const router = useRouter();

    // ✅ CORRECT source — API-backed, always fresh, has isApproved
    // Do NOT switch this back to useVendorStorage under any circumstances.
    // useVendorStorage reads localStorage which can serve stale data
    // missing critical auth fields like isApproved.
    const { vendorProfile, hasCheckedSession } = useVendorProfile();

    const isAuthenticated = !!vendorProfile;

    // Ref — not state. A ref does not trigger re-renders and cannot
    // cause redirect loops when pathname changes reset it.
    const isRedirecting = useRef(false);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[VendorBootstrapper] Auth Check:', {
                pathname,
                hasCheckedSession,
                isAuthenticated,
                isApproved: vendorProfile?.isApproved,
                vendorId: vendorProfile?._id || vendorProfile?.id,
            });
        }
    }, [pathname, hasCheckedSession, isAuthenticated, vendorProfile]);

    useEffect(() => {
        if (!hasCheckedSession) return;
        if (isRedirecting.current) return;

        // Not logged in — send to login
        if (!isAuthenticated) {
            console.log("🔒 Unauthorized. Redirecting to login...");
            isRedirecting.current = true;
            router.replace("/vendors/auth/login");
            return;
        }

        // isApproved lives directly on vendorProfile — no nesting
        const isApproved = vendorProfile?.isApproved;
        const isPendingPage = pathname === "/vendors/pending-approval";

        // Logged in but not approved — send to pending page
        if (!isApproved && !isPendingPage) {
            console.log("⏳ Not approved. Redirecting to pending...");
            isRedirecting.current = true;
            router.replace("/vendors/pending-approval");
            return;
        }

        // Approved but sitting on pending page — send to dashboard
        if (isApproved && isPendingPage) {
            console.log("✅ Approved. Redirecting to dashboard...");
            isRedirecting.current = true;
            router.replace("/vendors/dashboard");
            return;
        }

    }, [hasCheckedSession, isAuthenticated, vendorProfile, pathname, router]);

    // Reset ref when pathname settles after a completed redirect
    useEffect(() => {
        isRedirecting.current = false;
    }, [pathname]);

    // Hold render until auth resolves — prevents flash redirect
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
