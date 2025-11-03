"use client";

import { useState, useEffect } from "react";

/**
 * Hook for managing Vendor data in localStorage.
 * Provides utilities to set, get, update, and clear user payload.
 */
export const useVendorStorage = () => {
  const [vendor, setVendor] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedVendor = localStorage.getItem("VendorPayload");
    if (storedVendor) {
      setVendor(JSON.parse(storedVendor));
    }
  }, []);

  // Save Vendor data to localStorage
  const saveVendor = (payload) => {
    localStorage.setItem("vendorPayload", JSON.stringify(payload));
    setVendor(payload);
  };

  // Update specific fields of the stored Vendor
  const updateVendor = (updates) => {
    setVendor((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("vendorPayload", JSON.stringify(updated));
      return updated;
    });
  };

  // Remove Vendor data (e.g., on logout)
  const clearVendor = () => {
    localStorage.removeItem("vendorPayload");
    setVendor(null);
  };

  return { vendor, saveVendor, updateVendor, clearVendor };
};
