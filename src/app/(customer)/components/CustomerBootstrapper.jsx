"use client";

import React, { useEffect, useState } from "react";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { usePathname, useRouter } from "next/navigation";
import SplashScreen from "@/app/components/SplashScreen";
import CustomerLogoutHandler from "./CustomerLogoutHandler";

// Routes that should be accessible to guests (no auth required)
// NOTE: /home is intentionally NOT here — it requires authentication.
// Unauthenticated users (expired token) must be redirected to /auth/signin.
const GUEST_ALLOWED_ROUTES = [
    "/",
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
    const { user, hasCheckedSession, error, refetchProfile } = useUserStorage();

    // Check if current route is guest-allowed or public resource
    const isGuestAllowedRoute = GUEST_ALLOWED_ROUTES.some(route => pathname === route);
    const isRestaurantRoute = pathname?.startsWith("/restaurants/");
    const isFoodDetailsRoute = pathname?.startsWith("/food-details/");

    // Determine if user is authenticated
    const isAuthenticated = !!user;

    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        const showLogoutSplash = () => setIsLoggingOut(true);
        window.addEventListener("customer:logout-start", showLogoutSplash);
        return () => window.removeEventListener("customer:logout-start", showLogoutSplash);
    }, []);

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
        if (!hasCheckedSession || error) return;

        // Check if this is a protected route
        const isProtectedRoute = !isGuestAllowedRoute && !isRestaurantRoute && !isFoodDetailsRoute;

        // Only redirect if route is protected AND user is not authenticated
        if (isProtectedRoute && !isAuthenticated && !isRedirecting) {
            if (sessionStorage.getItem("melachow_logout_transition") === "1") return;
            console.log('[CustomerBootstrapper] Redirecting unauthenticated user from protected route:', pathname);
            setIsRedirecting(true);
            if (process.env.NEXT_PUBLIC_MOBILE_BUILD === "true") {
                window.location.replace("/auth/signin/");
            } else {
                router.replace("/auth/signin");
            }
        }
    }, [
        hasCheckedSession,
        error,
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

    // Keep branded content on screen until a protected page is safe to paint.
    const isProtectedRoute = !isGuestAllowedRoute && !isRestaurantRoute && !isFoodDetailsRoute;
    if (isLoggingOut) return <SplashScreen />;
    if (isProtectedRoute && error) {
        return <SplashScreen startupError onRetry={() => refetchProfile()} />;
    }
    if (isProtectedRoute && (!hasCheckedSession || !isAuthenticated || isRedirecting)) {
        return <SplashScreen />;
    }

    return (
        <div>
            {children}
            <CustomerLogoutHandler />
        </div>
    );
}
