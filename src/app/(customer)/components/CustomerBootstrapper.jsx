"use client";

import React, { useEffect, useState } from "react";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CustomerLogoutHandler from "./CustomerLogoutHandler";

// Routes that should be accessible to guests (no auth required)
const GUEST_ALLOWED_ROUTES = [
    "/",
    "/home",
    "/all-restaurants",
    "/all-foods",
    "/search",
    "/trending-foods",
    "/trending-restaurants",
    "/faqs",
    "/get-help",
];

export default function CustomerBootstrapper({ children }) {
    const pathname = usePathname();
    const router = useRouter();

    // Monitor User Auth State ONLY
    const { user, hasCheckedSession } = useUserStorage();

    // Check if current route is guest-allowed or public resource
    const isGuestAllowedRoute = GUEST_ALLOWED_ROUTES.some(route => pathname === route);
    const isRestaurantRoute = pathname?.startsWith("/restaurants/");
    const isFoodDetailsRoute = pathname?.startsWith("/food-details/");

    // Determine if user is authenticated
    const isAuthenticated = !!user;

    const [isRedirecting, setIsRedirecting] = useState(false);

    // ✅ Debug logging
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[CustomerBootstrapper] 🔐 User Auth Check:', {
                pathname,
                hasCheckedSession,
                isAuthenticated,
                user: !!user,
            });
        }
    }, [pathname, hasCheckedSession, isAuthenticated, user]);

    useEffect(() => {
        // Only process after auth is resolved
        if (!hasCheckedSession) return;

        // Check if this is a protected route
        const isProtectedRoute = !isGuestAllowedRoute && !isRestaurantRoute && !isFoodDetailsRoute;

        // Only redirect if route is protected AND user is not authenticated
        if (isProtectedRoute && !isAuthenticated && !isRedirecting) {
            console.log('[CustomerBootstrapper] Redirecting unauthenticated user from protected route:', pathname);
            setIsRedirecting(true);
            router.replace("/auth/signin");
        }
    }, [
        hasCheckedSession,
        isAuthenticated,
        pathname,
        isGuestAllowedRoute,
        isRestaurantRoute,
        isFoodDetailsRoute,
        router,
        isRedirecting
    ]);

    // Reset redirecting flag when pathname changes
    useEffect(() => {
        setIsRedirecting(false);
    }, [pathname]);

    // Only render nothing if it's a strictly protected route and we haven't checked session yet,
    // to prevent exposing private layouts momentarily. For public SEO routes, always render children.
    if (!hasCheckedSession) {
        const isProtectedRoute = !isGuestAllowedRoute && !isRestaurantRoute && !isFoodDetailsRoute;
        if (isProtectedRoute) {
            return null;
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {children}
            <CustomerLogoutHandler />
        </motion.div>
    );
}
