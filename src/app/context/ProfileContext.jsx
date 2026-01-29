"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useApi } from "./ApiContext";
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
    const res = await fetch(`${baseUrl}/user/auth/profile`, {
      credentials: "include", // ✅ Send cookies
      cache: "no-store",
    });

    // Handle 401 gracefully - return null for guest users
    if (res.status === 401) {
      return null; // Guest mode
    }

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to fetch profile");

    return data.user || data;
  };

  // React Query hook
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
    retry: false, // avoid retry loop if token is invalid
    refetchOnMount: true, // ✅ Refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on every window focus to avoid excessive calls
  });

  // Monitor authentication status and redirect if session expires
  useEffect(() => {
    // Skip if still loading
    if (isLoading) return;

    // Check if current route is public
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route) || pathname === route);
    const isRestaurantRoute = pathname?.startsWith("/restataurants/");

    // If no user data and not on a public route, redirect to signin
    if (!data && !isPublicRoute && !isRestaurantRoute) {
      console.log("🔒 Session expired or no user found. Redirecting to signin...");
      router.replace("/auth/signin");
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
