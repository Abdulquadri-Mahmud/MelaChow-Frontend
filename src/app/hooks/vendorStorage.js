import { useVendors } from "./useVendorQueries";
import { useApi } from "../context/ApiContext";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook for managing Vendor data via useVendors (Server-Sourced Identity).
 * Replaces legacy localStorage implementation.
 */
export const useVendorStorage = () => {
  const { vendors: vendorData, isLoading } = useVendors(); // 'vendors' is the single vendor profile
  const queryClient = useQueryClient();

  // Legacy: optimistically update cache
  const saveVendor = (payload) => {
    // If payload has nested structure (e.g. from VerifyAccount), normalize it
    // But VerifyAccount sends { vendor: { id, slug } }.
    // If the API returns full vendor, we might want to be careful not to overwrite with partial data if we can avoid it.
    // Ideally, we refetch.
    queryClient.setQueryData(["vendors"], payload?.vendor || payload);
    queryClient.invalidateQueries(["vendors"]);
  };

  // Update specific fields
  const updateVendor = (updates) => {
    queryClient.setQueryData(["vendors"], (prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  };

  // Clear vendor data
  const clearVendor = () => {
    queryClient.setQueryData(["vendors"], null);
  };

  // Ensure legacy structure { vendor: ... } for dashboard compatibility
  // Normalize: If vendorData has a 'data' property (API response wrapper), use it.
  const actualVendor = vendorData?.data || vendorData;
  const vendorDetails = actualVendor ? { vendor: actualVendor } : null;
  const { baseUrl } = useApi();

  const logout = async () => {
    try {
      await fetch(`${baseUrl}/vendor/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed", error);
    }
    queryClient.setQueryData(["vendors"], null);
    sessionStorage.removeItem("splashShown");
    queryClient.invalidateQueries(["vendors"]);
  };

  return {
    vendorDetails,
    isLoading,
    saveVendor,
    updateVendor,
    clearVendor,
    logout
  };
};
