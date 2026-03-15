"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { TokenManager } from "@/app/lib/auth-token";
import { useAdmin } from "@/app/context/AdminContext";

export default function AdminLogoutHandler() {
    // Assuming useAdmin has a logout function. Let's trust logic.
    // Wait, I should check AdminContext.jsx to be sure 'logout' exists.
    // If not, I can just clear token and redirect.
    const { logout } = useAdmin();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const handleUnauthorized = () => {
            console.log("[AdminLogoutHandler] Admin logout triggered (unauthorized)");

            if (logout) logout();
            TokenManager.clearToken();
            sessionStorage.removeItem("splashShown");

            // Only redirect if not already on login page
            if (!pathname.includes("/admin/auth/login")) {
                toast.error("Session expired. Please login again.");
                router.replace("/admin/auth/login");
            }
        };

        window.addEventListener("admin:unauthorized", handleUnauthorized);

        return () => {
            window.removeEventListener("admin:unauthorized", handleUnauthorized);
        };
    }, [logout, router, pathname]);

    return null;
}
