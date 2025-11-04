"use client";

import { useState, useEffect } from "react";

/**
 * Hook for managing Vendor data in localStorage.
 * Provides utilities to set, get, update, and clear vendor payload.
 */
export const useVendorStorage = () => {
  const STORAGE_KEY = "VendorPayload"; // consistent key name

  const [vendor, setVendor] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedVendor = localStorage.getItem(STORAGE_KEY);
    if (storedVendor) {
      setVendor(JSON.parse(storedVendor));
    }
  }, []);

  // Save vendor data
  const saveVendor = (payload) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setVendor(payload);
  };

  // Update specific fields
  const updateVendor = (updates) => {
    setVendor((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Clear vendor data
  const clearVendor = () => {
    localStorage.removeItem(STORAGE_KEY);
    setVendor(null);
  };

  return { vendor, saveVendor, updateVendor, clearVendor };
};
