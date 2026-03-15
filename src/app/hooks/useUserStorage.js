import { useApi } from "../context/ApiContext";
import { useProfile } from "../context/ProfileContext";
import { useQueryClient } from "@tanstack/react-query";
import { TokenManager } from "../lib/auth-token";

/**
 * Hook for managing user data via ProfileContext (Server-Sourced Identity).
 * Replaces legacy localStorage implementation.
 */
export const useUserStorage = () => {
  const { baseUrl } = useApi();
  const { userProfile, isLoading, refetchProfile, hasCheckedSession } = useProfile();
  const queryClient = useQueryClient();

  // Legacy compatibility: saveUser now optimistically updates the cache
  const saveUser = (payload) => {
    // Normalize payload: if it contains 'user' property, unwrap it (e.g. from VerifyAccount)
    const data = payload?.user || payload;

    // ✅ Cache user data for refresh resilience
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("grubdash_user_cache", JSON.stringify(data));
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
      return { ...prev, ...updates };
    });
  };

  // Full logout: clear user + optional data
  const logout = async () => {
    // ✅ ADD DEBUG LOG
    console.log('[useUserStorage] 🚪 Logout initiated');

    try {
      // ✅ Call backend logout endpoint
      const response = await fetch(`${baseUrl}/user/auth/logout`, {
        method: "POST",
        credentials: "include", // ✅ Send cookie so backend can clear it
      });

      // ✅ ADD DEBUG LOG
      console.log('[useUserStorage] Logout response:', {
        status: response.status,
        ok: response.ok,
      });

    } catch (error) {
      console.error('[useUserStorage] Logout request failed:', error);
      // ✅ Continue with client-side cleanup even if backend fails
    }

    // ✅ Clear ALL client-side state
    queryClient.setQueryData(["userProfile"], null);
    sessionStorage.removeItem("splashShown");
    localStorage.removeItem("grubdash_user_cache"); // ✅ Clear cache
    localStorage.removeItem("cart");        // optional, keep client preferences
    localStorage.removeItem("addresses");   // optional
    TokenManager.clearToken(); // ✅ Clear fallback token

    // ✅ Invalidate queries to force refetch
    queryClient.invalidateQueries(["userProfile"]);

    // ✅ ADD DEBUG LOG
    console.log('[useUserStorage] ✅ Logout cleanup complete');

    // ✅ ADD: Redirect to signin after cleanup (IMPORTANT!)
    if (typeof window !== 'undefined') {
      // Small delay to ensure cleanup completes
      setTimeout(() => {
        window.location.href = '/auth/signin';
      }, 100);
    }
  };

  // Clear only user payload (client-side only clearance)
  const clearUser = () => {
    queryClient.setQueryData(["userProfile"], null);
  };

  return {
    user: userProfile,
    isLoading,
    hasCheckedSession, // ✅ Expose session check status
    saveUser,
    updateUser,
    clearUser,
    logout,
  };
};
