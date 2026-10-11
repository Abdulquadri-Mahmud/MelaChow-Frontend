import { useApi } from "../context/ApiContext";
import { useProfile } from "../context/ProfileContext";
import { useQueryClient } from "@tanstack/react-query";
import { TokenManager } from "../lib/auth-token";
import { normalizeUserAddresses } from "../lib/addressUtils";

/**
 * Hook for managing user data via ProfileContext (Server-Sourced Identity).
 * Replaces legacy localStorage implementation.
 */
export const useUserStorage = () => {
  const { baseUrl } = useApi();
  const { userProfile, isLoading, isFetching, error, refetchProfile, hasCheckedSession } = useProfile();
  const queryClient = useQueryClient();

  // Legacy compatibility: saveUser now optimistically updates the cache
  const saveUser = (payload) => {
    // Normalize payload: if it contains 'user' property, unwrap it (e.g. from VerifyAccount)
    const data = normalizeUserAddresses(payload?.user || payload);

    // ✅ Cache user data for refresh resilience
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("melachow_user_cache", JSON.stringify(data));
      }
    } catch (e) {
      console.warn("Failed to cache user", e);
    }

    queryClient.setQueryData(["userProfile"], data);
  };

  // Update specific fields of the stored user (Optimistic)
  const updateUser = (updates) => {
    queryClient.setQueryData(["userProfile"], (prev) => {
      if (!prev) return prev;
      return normalizeUserAddresses({ ...prev, ...updates });
    });
  };

  // Full logout: clear user + optional data
  const logout = async () => {
    sessionStorage.setItem("melachow_logout_transition", "1");
    window.dispatchEvent(new Event("customer:logout-start"));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      await fetch(`${baseUrl}/user/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: TokenManager.getToken() ? { Authorization: `Bearer ${TokenManager.getToken()}` } : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      console.error('[useUserStorage] Logout request failed:', error);
    } finally {
      clearTimeout(timeout);
    }

    await queryClient.cancelQueries({ queryKey: ["userProfile"] });
    queryClient.setQueryData(["userProfile"], null);
    sessionStorage.removeItem("splashShown");
    localStorage.removeItem("melachow_user_cache");
    localStorage.removeItem("cart");
    localStorage.removeItem("addresses");
    TokenManager.clearToken();
    window.location.replace('/');
  };

  // Clear only user payload (client-side only clearance)
  const clearUser = () => {
    queryClient.setQueryData(["userProfile"], null);
  };

  return {
    user: userProfile,
    isLoading,
    isFetching,
    error,
    hasCheckedSession, // ✅ Expose session check status
    refetchProfile,
    saveUser,
    updateUser,
    clearUser,
    logout,
  };
};

