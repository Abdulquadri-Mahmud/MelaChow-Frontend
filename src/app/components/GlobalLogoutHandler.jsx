"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import { useAdmin } from "@/app/context/AdminContext";
import toast from "react-hot-toast";
import { TokenManager } from "@/app/lib/auth-token";

export default function GlobalLogoutHandler() {
    const router = useRouter();
    const pathname = usePathname();

    // Use hooks to get auth state and logout functions
    const { logout: logoutUser } = useUserStorage();
    const { logout: logoutVendor } = useVendorStorage();
    const { logout: logoutAdmin } = useAdmin();

    // --- 1. Unauthorized Event Listeners (401 Errors) ---
    // These listeners handle "Force Logout" when the backend rejects a session
    useEffect(() => {
        const handleUser401 = () => {
            sessionStorage.removeItem("splashShown");
            logoutUser();
            TokenManager.clearToken(); // ✅ Wipe secure token
            // Only redirect to user login if we are NOT in admin or vendor context
            if (!pathname.includes("/auth") && !pathname.startsWith("/admin") && !pathname.startsWith("/vendors")) {
                router.push("/auth/signin");
                toast.error("Session expired. Please login again.");
            }
        };

        const handleVendor401 = () => {
            sessionStorage.removeItem("splashShown");
            logoutVendor();
            TokenManager.clearToken(); // ✅ Wipe secure token
            // Only redirect to vendor login if we are in vendor context
            if (pathname.startsWith("/vendors") && !pathname.includes("/auth")) {
                router.push("/vendors/auth/login");
                toast.error("Session expired. Please login again.");
            }
        };

        const handleAdmin401 = () => {
            sessionStorage.removeItem("splashShown");
            logoutAdmin();
            TokenManager.clearToken(); // ✅ Wipe secure token
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

    return null;
}
