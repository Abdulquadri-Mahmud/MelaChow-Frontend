import { useState, useEffect } from "react";

/**
 * Hook for managing user data in localStorage.
 * Provides utilities to set, get, update, and clear user payload.
 */
export const useUserStorage = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // ✅ hydration state

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("userPayload");

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse userPayload:", error);
      localStorage.removeItem("userPayload");
    } finally {
      setIsLoading(false); // ✅ hydration completed
    }
  }, []);

  // Save user data to localStorage
  const saveUser = (payload) => {
    localStorage.setItem("userPayload", JSON.stringify(payload));
    setUser(payload);
  };

  // Update specific fields of the stored user
  const updateUser = (updates) => {
    setUser((prev) => {
      if (!prev) return prev;

      const updated = { ...prev, ...updates };
      localStorage.setItem("userPayload", JSON.stringify(updated));
      return updated;
    });
  };

  // Full logout: clear user + token + optional data
  const logout = () => {
    localStorage.removeItem("userPayload");
    localStorage.removeItem("userToken");
    localStorage.removeItem("cart");        // optional
    localStorage.removeItem("addresses");   // optional

    setUser(null);
  };

  // Clear only user payload
  const clearUser = () => {
    localStorage.removeItem("userPayload");
    localStorage.removeItem("userToken");
    localStorage.removeItem("cart");        // optional
    localStorage.removeItem("addresses");   // optional
    setUser(null);
  };

  return {
    user,
    isLoading, // ✅ expose loading state
    saveUser,
    updateUser,
    clearUser,
    logout,
  };
};
