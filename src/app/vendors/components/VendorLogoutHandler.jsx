"use client";

import { useEffect } from "react";
import { useVendorStorage } from "@/app/hooks/vendorStorage";

export default function VendorLogoutHandler() {
    const { logout } = useVendorStorage();

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === "vendor_logout_trigger" && e.newValue) {
                console.log("[VendorLogoutHandler] Vendor logout triggered (storage)");
                logout();
            }
        };

        const handleUnauthorized = () => {
            console.log("[VendorLogoutHandler] Vendor logout triggered (unauthorized)");
            logout();
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("vendor:unauthorized", handleUnauthorized);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("vendor:unauthorized", handleUnauthorized);
        };
    }, [logout]);

    return null;
}
