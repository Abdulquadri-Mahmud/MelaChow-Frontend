"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useApi } from "./ApiContext";
import { TokenManager } from "../lib/auth-token";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";

const VendorProfileContext = createContext(undefined);

// Public routes that don't require vendor authentication
const VENDOR_PUBLIC_ROUTES = [
    "/vendors/auth/login",
    "/vendors/auth/register",
    "/vendors/auth/verify-account",
];

export const VendorProfileProvider = ({ children }) => {
    const { baseUrl } = useApi();
    const pathname = usePathname();

    // Function used by React Query to fetch vendor profile
    const fetchVendorProfile = async () => {
        // ✅ Only fetch if on vendor route
        if (!pathname?.startsWith("/vendors/")) {
            return null;
        }

        const token = TokenManager.getToken();

        if (process.env.NODE_ENV === 'development') {
            console.log('[VendorProfileContext] 🔍 fetchVendorProfile START', {
                baseUrl,
                currentPath: pathname,
                hasToken: !!token,
            });
        }

        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const res = await fetch(`${baseUrl}/vendors/get-vendor`, {
                credentials: "include",
                headers: headers,
            });

            if (process.env.NODE_ENV === 'development') {
                console.log('[VendorProfileContext] 📨 Response:', {
                    status: res.status,
                    ok: res.ok,
                });
            }

            // ✅ Handle 401 gracefully
            if (res.status === 401) {
                const isPublicRoute = VENDOR_PUBLIC_ROUTES.some(route =>
                    pathname?.startsWith(route)
                );

                if (!isPublicRoute) {
                    TokenManager.clearToken();
                    localStorage.removeItem("grubdash_vendor_cache");
                    throw new Error("Vendor session expired");
                }

                return null;
            }

            // ✅ Handle other errors
            if (!res.ok) {
                let errorMessage = "Failed to fetch vendor profile";
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    // Not JSON
                }
                throw new Error(errorMessage);
            }

            const data = await res.json();

            // ✅ Extract vendor data (handle different response structures)
            const vendorData = data.data || data.vendor || data;

            if (process.env.NODE_ENV === 'development') {
                console.log('[VendorProfileContext] ✅ Vendor loaded:', {
                    hasVendor: !!vendorData,
                    vendorId: vendorData?._id || vendorData?.id,
                });
            }

            return vendorData;

        } catch (error) {
            console.error('[VendorProfileContext] fetchVendorProfile error:', error);
            throw error;
        }
    };

    // React Query hook
    const { data, isLoading, error, refetch, isFetched } = useQuery({
        queryKey: ["vendors"],
        queryFn: fetchVendorProfile,

        // ✅ Load from cache
        initialData: () => {
            if (typeof window !== 'undefined') {
                const cached = localStorage.getItem("grubdash_vendor_cache");
                try {
                    return cached ? JSON.parse(cached) : undefined;
                } catch (e) {
                    return undefined;
                }
            }
        },

        staleTime: 1000 * 60 * 5,

        retry: (failureCount, error) => {
            if (error?.message?.includes("Vendor session expired")) {
                return false;
            }
            if (failureCount >= 2) return false;
            if (error?.message?.includes("Failed to fetch")) {
                return true;
            }
            return false;
        },

        retryDelay: (attemptIndex) => {
            return Math.min(100 * Math.pow(2, attemptIndex), 500);
        },

        refetchOnMount: "always",
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,

        // ✅ Only fetch on vendor routes
        enabled: pathname?.startsWith("/vendors/") || false,
    });

    // ✅ Mark as checked immediately on non-vendor routes
    // This prevents user routes from waiting for vendor auth check
    const hasCheckedSession = pathname?.startsWith("/vendors/") ? isFetched : true;

    // ✅ Debug logging
    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && pathname?.startsWith("/vendors/")) {
            const cookieExists = typeof document !== 'undefined' ? document.cookie.includes('token=') : false;

            console.log('[VendorProfileContext] 🔐 Vendor Auth State:', {
                hasVendorData: !!data,
                isLoading,
                hasCheckedSession,
                currentPath: pathname,
                hasCachedVendor: !!localStorage.getItem("grubdash_vendor_cache"),
                hasToken: !!TokenManager.getToken(),
                cookieExists,
            });
        }
    }, [data, isLoading, hasCheckedSession, pathname]);

    // ✅ Keep cache synced
    useEffect(() => {
        if (data && typeof window !== 'undefined') {
            localStorage.setItem("grubdash_vendor_cache", JSON.stringify(data));
        }
    }, [data]);

    return (
        <VendorProfileContext.Provider
            value={{
                vendorProfile: data,
                isLoading,
                hasCheckedSession,
                error: error ? error.message : null,
                refetchVendorProfile: refetch,
            }}
        >
            {children}
        </VendorProfileContext.Provider>
    );
};

export const useVendorProfile = () => {
    const context = useContext(VendorProfileContext);
    if (!context) {
        // Return safe defaults instead of throwing
        // This allows the hook to be used in components that render on both vendor and non-vendor routes
        return {
            vendorProfile: null,
            isLoading: false,
            hasCheckedSession: true,
            error: null,
            refetchVendorProfile: () => Promise.resolve(),
        };
    }
    return context;
};
