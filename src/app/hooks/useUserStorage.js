import { useState, useEffect } from "react";

/**
 * Hook for managing user data in localStorage.
 * Provides utilities to set, get, update, and clear user payload.
 */
export const useUserStorage = () => {
  const [user, setUser] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("userPayload");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
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
      const updated = { ...prev, ...updates };
      localStorage.setItem("userPayload", JSON.stringify(updated));
      return updated;
    });
  };

  // Full logout: clear user + token + anything else
  const logout = () => {
    localStorage.removeItem("userPayload");
    localStorage.removeItem("userToken");
    localStorage.removeItem("cart");   // optional: clear cart
    localStorage.removeItem("addresses"); // optional

    setUser(null);
  };


  // Remove user data (e.g., on logout)
  const clearUser = () => {
    localStorage.removeItem("userPayload");
    setUser(null);
  };

  return { user, saveUser, updateUser, clearUser, logout  };
};
