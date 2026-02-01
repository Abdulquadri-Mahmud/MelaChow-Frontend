"use client";

import React, { createContext, useContext, useEffect } from "react";
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
    // Get token fallback for iOS
    let token = TokenManager.getToken();

    // ✅ Double-check initialization if token is missing (fix for refresh race condition)
    if (!token) {
      TokenManager.initialize();
      token = TokenManager.getToken();
    }

    const headers = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${baseUrl}/user/auth/profile`, {
      credentials: "include", // ✅ Send cookies
      headers: headers
    });

    // Handle 401 gracefully
    if (res.status === 401) {
      // If we are on a protected route, treat 401 as a potential transient failure and retry
      const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route) || pathname === route);
      const isRestaurantRoute = pathname?.startsWith("/restataurants/");
      const isAdminRoute = pathname?.startsWith("/admin/");
      const isProtected = !isPublicRoute && !isRestaurantRoute && !isAdminRoute;

      if (isProtected) {
        // console.warn("Session check failed (401) on protected route. Will retry...");
        throw new Error("Session check failed (401) on protected route");
      }

      return null; // Guest mode for public routes
    }

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to fetch profile");

    return data.user || data;
  };

  // React Query hook with iOS-friendly retry logic
  const { data, isLoading, error, refetch } = useQuery({
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
      // ✅ Retry on network errors
      if (error?.message?.includes("Failed to fetch")) {
        return failureCount < 2;
      }
      // ✅ Retry on temporary auth failures
      if (error?.message?.includes("Session check failed (401)")) {
        return failureCount < 3;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // ✅ Keep Cache Synced with Fresh Data
  useEffect(() => {
    if (data && typeof window !== 'undefined') {
      localStorage.setItem("grubdash_user_cache", JSON.stringify(data));
    }
  }, [data]);

  // Monitor authentication status and redirect if session expires
  useEffect(() => {
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
  }, [data, isLoading, pathname, router]);

  return (
    <ProfileContext.Provider
      value={{
        userProfile: data,
        isLoading,
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
