"use client";

import { useEffect } from "react";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";

export default function CustomerLogoutHandler() {
    const { logout } = useUserStorage();
    const pathname = usePathname();

    useEffect(() => {
        const handleUnauthorized = () => {
            console.log("[CustomerLogoutHandler] User logout triggered (unauthorized)");

            // Clear all user session data
            // The shared logout flow shows the splash and routes through /.
            if (!pathname.includes("/auth")) {
                toast.error("Session expired. Please login again.");
            }
            logout();
        };

        window.addEventListener("user:unauthorized", handleUnauthorized);

        return () => {
            window.removeEventListener("user:unauthorized", handleUnauthorized);
        };
    }, [logout, pathname]);

    return null;
}

