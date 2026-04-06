"use client";

import { useEffect } from "react";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { TokenManager } from "@/app/lib/auth-token";

export default function CustomerLogoutHandler() {
    const { logout } = useUserStorage();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const handleUnauthorized = () => {
            console.log("[CustomerLogoutHandler] User logout triggered (unauthorized)");

            // Clear all user session data
            logout();
            TokenManager.clearToken();
            sessionStorage.removeItem("splashShown");
            localStorage.removeItem("melachow_user_cache");

            // Only redirect if not already on auth pages
            if (!pathname.includes("/auth")) {
                toast.error("Session expired. Please login again.");
                router.replace("/auth/signin");
            }
        };

        window.addEventListener("user:unauthorized", handleUnauthorized);

        return () => {
            window.removeEventListener("user:unauthorized", handleUnauthorized);
        };
    }, [logout, router, pathname]);

    return null;
}

