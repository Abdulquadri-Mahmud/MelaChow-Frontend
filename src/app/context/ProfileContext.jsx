"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useApi } from "./ApiContext";
import { TokenManager } from "../lib/auth-token";
import { useQuery } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";

const ProfileContext = createContext(undefined);

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/auth/signin",
  "/auth/signup",
  "/auth/verify-account",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/vendor-auth/signin",
  "/vendor-auth/signup",
  "/admin/login",
  "/",
  "/faqs",
  "/get-help",
];

export const ProfileProvider = ({ children }) => {
  const { baseUrl } = useApi();
  const router = useRouter();
  const pathname = usePathname();

  // Function used by React Query to fetch the user profile
  const fetchProfile = async () => {
    // ✅ ADD THIS DEBUG BLOCK AT THE VERY TOP
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProfileContext] 🔍 fetchProfile START', {
        baseUrl,
        currentPath: pathname,
        hasToken: !!TokenManager.getToken(),
        timestamp: new Date().toISOString(),
      });
    }

    // ✅ Get token (already initialized on app boot in ClientLayout)
    const token = TokenManager.getToken();

    const headers = {
      'Content-Type': 'application/json',
    };

    // ✅ Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // ✅ ADD THIS DEBUG LOG BEFORE FETCH
      if (process.env.NODE_ENV === 'development') {
        console.log('[ProfileContext] 📡 Fetching profile...', {
          url: `${baseUrl}/user/auth/profile`,
          credentials: 'include',
          hasAuthHeader: !!headers['Authorization'],
        });
      }

      const res = await fetch(`${baseUrl}/user/auth/profile`, {
        credentials: "include", // ✅ PRIMARY: Send cookies
        headers: headers,
      });

      // ✅ ADD THIS DEBUG LOG AFTER FETCH
      if (process.env.NODE_ENV === 'development') {
        console.log('[ProfileContext] 📨 Response received:', {
          status: res.status,
          ok: res.ok,
          url: res.url,
          timestamp: new Date().toISOString(),
        });
      }

      // ✅ Handle 401 gracefully (BEFORE parsing JSON)
      if (res.status === 401) {
        const isPublicRoute = PUBLIC_ROUTES.some(route =>
          pathname?.startsWith(route) || pathname === route
        );
        const isRestaurantRoute = pathname?.startsWith("/restataurants/");
        const isAdminRoute = pathname?.startsWith("/admin/");
        const isProtected = !isPublicRoute && !isRestaurantRoute && !isAdminRoute;

        if (isProtected) {
          // ✅ Clear stale token and cache on auth failure
          TokenManager.clearToken();
          localStorage.removeItem("grubdash_user_cache");
          throw new Error("Session expired");
        }

        return null; // Guest mode for public routes
      }

      // ✅ Handle other HTTP errors (BEFORE parsing JSON)
      if (!res.ok) {
        let errorMessage = "Failed to fetch profile";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Response wasn't JSON, use default message
        }
        throw new Error(errorMessage);
      }

      // ✅ Response is OK (200-299), safe to parse
      const data = await res.json();
      return data.user || data;

    } catch (error) {
      // ✅ Log errors for debugging iOS issues
      console.error('[ProfileContext] fetchProfile error:', error);
      throw error;
    }
  };

  // React Query hook with iOS-friendly retry logic
  const { data, isLoading, error, refetch, isFetched } = useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchProfile,
    // ✅ Load from Cache immediately to prevent visual logout on refresh
    initialData: () => {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem("grubdash_user_cache");
        try {
          return cached ? JSON.parse(cached) : undefined;
        } catch (e) { return undefined; }
      }
    },
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
    retry: (failureCount, error) => {
      // ✅ Don't retry auth failures (401) - they're permanent
      if (error?.message?.includes("Session expired")) {
        return false;
      }

      // ✅ Only retry network errors, max 2 times
      if (failureCount >= 2) return false;

      // ✅ Retry on network errors only
      if (error?.message?.includes("Failed to fetch")) {
        return true;
      }

      return false;
    },
    // ✅ Exponential backoff: 100ms, 200ms, 400ms (max 500ms)
    retryDelay: (attemptIndex) => {
      return Math.min(100 * Math.pow(2, attemptIndex), 500);
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // ✅ Use isFetched directly for session check status
  // This avoids race conditions where onSettled might not trigger state updates correctly
  const hasCheckedSession = isFetched;

  // ✅ Debug logging for iOS troubleshooting (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // ✅ Check if cookie exists in browser
      const cookieExists = typeof document !== 'undefined' ? document.cookie.includes('token=') : false;
      const allCookies = typeof document !== 'undefined' ? document.cookie : 'N/A';

      console.log('[ProfileContext] 🔐 Auth State:', {
        hasUserData: !!data,
        isLoading,
        hasCheckedSession,
        currentPath: pathname,
        hasCachedUser: typeof window !== 'undefined' ? !!localStorage.getItem("grubdash_user_cache") : false,
        hasToken: !!TokenManager.getToken(),
        cookieExists, // ✅ NEW: Check if auth cookie is present
        cookieCount: allCookies.split(';').filter(c => c.trim()).length, // ✅ NEW: How many cookies total
      });
    }
  }, [data, isLoading, hasCheckedSession, pathname]);

  // ✅ Keep Cache Synced with Fresh Data
  useEffect(() => {
    if (data && typeof window !== 'undefined') {
      localStorage.setItem("grubdash_user_cache", JSON.stringify(data));
    }
  }, [data]);

  // Monitor authentication status and redirect if session expires
  // ❌ DEPRECATED: Redirect logic moved to AppBootstrapper
  // This prevents race conditions where ProfileContext redirects before AppBootstrapper handles splash
  /*useEffect(() => {
    // Skip if still loading
    if (isLoading) return;

    // Check if current route is public or admin route
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route) || pathname === route);
    const isRestaurantRoute = pathname?.startsWith("/restataurants/");
    const isAdminRoute = pathname?.startsWith("/admin/");

    // If no user data and not on a public route or admin route, redirect to signin
    if (!data && !isPublicRoute && !isRestaurantRoute && !isAdminRoute) {
      // ✅ iOS Safari Fix: Add small delay to allow cookies to be read after page refresh
      // iOS Safari sometimes needs extra time to restore cookies after navigation
      const redirectTimer = setTimeout(() => {
        console.log("🔒 Session expired or no user found. Redirecting to signin...");
        router.replace("/auth/signin");
      }, 300); // 300ms delay to allow cookie restoration on iOS

      return () => clearTimeout(redirectTimer);
    }
  }, [data, isLoading, pathname, router]);*/

  // ✅ Intelligent Refetch on Navigation
  // If the user navigates to a protected route and we don't have data, verify session immediately.
  // This fixes issues where a user might be "Guest" on Home but should be "User" on Profile.
  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route) || pathname === route);
    const isRestaurantRoute = pathname?.startsWith("/restataurants/");
    const isAdminRoute = pathname?.startsWith("/admin/");
    const isProtected = !isPublicRoute && !isRestaurantRoute && !isAdminRoute;

    if (isProtected && !data && !isLoading) {
      refetch();
    }
  }, [pathname, data, isLoading, refetch]);

  return (
    <ProfileContext.Provider
      value={{
        userProfile: data,
        isLoading,
        hasCheckedSession, // ✅ Expose session check status
        error: error ? error.message : null,
        refetchProfile: refetch,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
