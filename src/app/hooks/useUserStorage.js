import { useApi } from "../context/ApiContext";
import { useProfile } from "../context/ProfileContext";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook for managing user data via ProfileContext (Server-Sourced Identity).
 * Replaces legacy localStorage implementation.
 */
export const useUserStorage = () => {
  const { baseUrl } = useApi();
  const { userProfile, isLoading, refetchProfile } = useProfile();
  const queryClient = useQueryClient();

  // Legacy compatibility: saveUser now optimistically updates the cache
  const saveUser = (payload) => {
    // Normalize payload: if it contains 'user' property, unwrap it (e.g. from VerifyAccount)
    const data = payload?.user || payload;
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
    try {
      await fetch(`${baseUrl}/user/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed", error);
    }

    // Clear state
    queryClient.setQueryData(["userProfile"], null);
    sessionStorage.removeItem("splashShown");
    localStorage.removeItem("cart");        // optional, keep client preferences
    localStorage.removeItem("addresses");   // optional

    // Invalidate to be sure
    queryClient.invalidateQueries(["userProfile"]);
  };

  // Clear only user payload (client-side only clearance)
  const clearUser = () => {
    queryClient.setQueryData(["userProfile"], null);
  };

  return {
    user: userProfile,
    isLoading,
    saveUser,
    updateUser,
    clearUser,
    logout,
  };
};
