"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import { useAdmin } from "@/app/context/AdminContext";
import toast from "react-hot-toast";

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes inactivity limit

export default function GlobalLogoutHandler() {
    const router = useRouter();
    const pathname = usePathname();

    // Use hooks to get auth state and logout functions
    const { logout: logoutUser, user } = useUserStorage();
    const { logout: logoutVendor, vendorDetails } = useVendorStorage();
    const { logout: logoutAdmin, admin } = useAdmin();

    const timerRef = useRef(null);

    // --- 1. Unauthorized Event Listeners (401 Errors) ---
    useEffect(() => {
        const handleUser401 = () => {
            logoutUser();
            // Only redirect to user login if we are NOT in admin or vendor context
            if (!pathname.includes("/auth") && !pathname.startsWith("/admin") && !pathname.startsWith("/vendors")) {
                router.push("/auth/signin");
                toast.error("Session expired. Please login again.");
            }
        };

        const handleVendor401 = () => {
            logoutVendor();
            // Only redirect to vendor login if we are in vendor context
            if (pathname.startsWith("/vendors") && !pathname.includes("/auth")) {
                router.push("/vendors/auth/login");
                toast.error("Session expired. Please login again.");
            }
        };

        const handleAdmin401 = () => {
            logoutAdmin();
            // Only redirect to admin login if we are in admin context
            if (pathname.startsWith("/admin") && !pathname.includes("/login")) {
                router.push("/admin/login");
                toast.error("Session expired. Please login again.");
            }
        };

        window.addEventListener("user:unauthorized", handleUser401);
        window.addEventListener("vendor:unauthorized", handleVendor401);
        window.addEventListener("admin:unauthorized", handleAdmin401);

        return () => {
            window.removeEventListener("user:unauthorized", handleUser401);
            window.removeEventListener("vendor:unauthorized", handleVendor401);
            window.removeEventListener("admin:unauthorized", handleAdmin401);
        };
    }, [logoutUser, logoutVendor, logoutAdmin, router, pathname]);


    // --- 2. Inactivity Timer ---
    const handleInactivityLogout = useCallback(() => {
        let loggedOut = false;

        // Logout Vendor if active
        if (vendorDetails) {
            logoutVendor();
            loggedOut = true;
            if (pathname.startsWith("/vendors")) {
                router.push("/vendors/auth/login");
            }
        }

        // Logout User if active
        if (user) {
            logoutUser();
            loggedOut = true;
            if (!pathname.startsWith("/vendors") && !pathname.startsWith("/admin")) {
                router.push("/auth/signin");
            }
        }

        // Logout Admin if active & authenticated
        // Admin state might initially be { authenticated: true } or object
        if (admin && admin.authenticated !== false) {
            logoutAdmin();
            loggedOut = true;
            if (pathname.startsWith("/admin")) {
                router.push("/admin/login");
            }
        }

        if (loggedOut) {
            toast.error("You have been logged out due to inactivity.");
        }
    }, [user, vendorDetails, admin, logoutVendor, logoutUser, logoutAdmin, pathname, router]);

    const resetTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        // Only set timer if someone is logged in
        if (user || vendorDetails || (admin && admin.authenticated !== false)) {
            timerRef.current = setTimeout(handleInactivityLogout, INACTIVITY_LIMIT);
        }
    }, [handleInactivityLogout, user, vendorDetails, admin]);

    useEffect(() => {
        const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

        const onEvent = () => resetTimer();

        // Initial start
        resetTimer();

        events.forEach(event => document.addEventListener(event, onEvent));

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => document.removeEventListener(event, onEvent));
        };
    }, [resetTimer]);

    return null;
}
