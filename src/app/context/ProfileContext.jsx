"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useApi } from "./ApiContext";
import { TokenManager } from "../lib/auth-token";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { normalizeUserAddresses } from "../lib/addressUtils";
import { refreshCustomerAccessToken } from "../lib/customerApi";

const ProfileContext = createContext(undefined);

// A cold API instance can take longer than eight seconds to answer the first
// session request. Only show the startup error after a real retry has failed.
const PROFILE_REQUEST_TIMEOUT_MS = 20000;

const fetchProfileWithTimeout = async (url, options) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROFILE_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

export const ProfileProvider = ({ children }) => {
  const { baseUrl } = useApi();
  const pathname = usePathname();

  const fetchProfile = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProfileContext] 🔍 fetchProfile START', {
        baseUrl,
        currentPath: pathname,
        hasToken: !!TokenManager.getToken(),
        timestamp: new Date().toISOString(),
      });
    }

    const token = TokenManager.getToken();
    // Native sessions use bearer tokens. With none saved, there is nothing to
    // validate and startup can show sign-in without waiting for the API.
    if (process.env.NEXT_PUBLIC_MOBILE_BUILD === "true" && !token) return null;

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      let res = await fetchProfileWithTimeout(`${baseUrl}/user/auth/profile`, {
        credentials: "include",
        headers: headers,
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('[ProfileContext] 📥 Response:', {
          status: res.status,
          ok: res.ok,
        });
      }

      if (res.status === 401) {
        let refreshError = null;
        try {
          const accessToken = await refreshCustomerAccessToken();
          res = await fetchProfileWithTimeout(`${baseUrl}/user/auth/profile`, { credentials: "include", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } });
        } catch (error) {
          refreshError = error;
        }
        // A failed network request cannot prove that the saved session expired.
        if (refreshError && (!refreshError.response || refreshError.response.status >= 500)) {
          throw refreshError;
        }
      }

      if (res.status === 401) {
        // Always clear stale cache on 401 — prevents it from surfacing as
        // placeholder data the next time the app opens.
        TokenManager.clearToken();
        localStorage.removeItem("melachow_user_cache");

        return null;
      }

      if (!res.ok) {
        let errorMessage = "Failed to fetch profile";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Not JSON
        }
        const requestError = new Error(errorMessage);
        requestError.status = res.status;
        throw requestError;
      }

      const data = await res.json();
      return normalizeUserAddresses(data.user || data);

    } catch (error) {
      console.error('[ProfileContext] fetchProfile error:', error);
      throw error;
    }
  };

  const { data, isLoading, isFetching, error, refetch, status, fetchStatus } = useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchProfile,

    placeholderData: () => {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem("melachow_user_cache");
        try {
          return cached ? normalizeUserAddresses(JSON.parse(cached)) : undefined;
        } catch (e) { return undefined; }
      }
    },

    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: Infinity,

    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      return error?.name === "AbortError" ||
        error?.code === "ERR_NETWORK" ||
        error?.code === "ECONNABORTED" ||
        (error?.status >= 500 && error?.status < 600) ||
        (error?.response?.status >= 500 && error?.response?.status < 600) ||
        error?.message?.includes("Failed to fetch") ||
        error?.message?.includes("Network Error");
    },

    retryDelay: (attemptIndex) => Math.min(750 * Math.pow(2, attemptIndex), 1500),

    // Revalidate any in-memory profile before protected customer pages render.
    // This is important when Android resumes a WebView with an expired token.
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // ✅ Track if the VERY FIRST check has completed
  const [hasInitialCheckDone, setHasInitialCheckDone] = React.useState(false);

  useEffect(() => {
    // Only set to true once, never reset to false
    if (!hasInitialCheckDone && fetchStatus === 'idle' && (status === 'success' || status === 'error')) {
      setHasInitialCheckDone(true);
    }
  }, [fetchStatus, status, hasInitialCheckDone]);

  const hasCheckedSession = hasInitialCheckDone;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProfileContext] 🔍 User Auth State:', {
        hasUserData: !!data,
        isLoading,
        isFetching,
        hasCheckedSession,
        status,
        fetchStatus,
        currentPath: pathname,
      });
    }
  }, [data, isLoading, hasCheckedSession, pathname, status, fetchStatus]);

  useEffect(() => {
    if (data && typeof window !== 'undefined') {
      localStorage.setItem("melachow_user_cache", JSON.stringify(normalizeUserAddresses(data)));
    }
  }, [data]);

  return (
    <ProfileContext.Provider
      value={{
        userProfile: data,
        isLoading,
        isFetching,
        hasCheckedSession,
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

