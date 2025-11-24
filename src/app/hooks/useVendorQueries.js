"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";


import toast from "react-hot-toast";
import { deleteVendor, fetchVendorForUserDisplay, getVendorById, getVendors, updateVendor } from "../lib/vendorProfileApi";

// ✅ Custom hook for managing vendor profiles
export const useVendors = () => {
  const queryClient = useQueryClient();

  // 🔹 Fetch all vendors (background refresh & smooth UI)
  const {
    data: vendors,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["vendors"],
    queryFn: getVendors,
    // staleTime: 1000 * 60 * 2, // 2 minutes
    // refetchInterval: 1000 * 30, // background refresh every 30s
    // refetchIntervalInBackground: true,
    // refetchOnWindowFocus: false,
    // keepPreviousData: true, // ✅ maintain UI during refetch
  });

  // 🔹 Optimistic update mutation for vendor profile
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateVendor(id, data),

    // ⚙️ Optimistic update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries(["vendors"]);

      const previousVendors = queryClient.getQueryData(["vendors"]);

      // Update cached vendor data immediately
      queryClient.setQueryData(["vendors"], (old) =>
        old?.map((vendor) =>
          vendor._id === id ? { ...vendor, ...data } : vendor
        )
      );

      return { previousVendors };
    },

    // ✅ On success: confirm and refresh in background
    onSuccess: () => {
      toast.success("✅ Vendor updated successfully!");
      queryClient.invalidateQueries(["vendors"]);
    },

    // ❌ On error: rollback UI to previous data
    onError: (error, _, context) => {
      toast.error("❌ Failed to update vendor.");
      if (context?.previousVendors) {
        queryClient.setQueryData(["vendors"], context.previousVendors);
      }
    },

    // 🧹 Always refetch in background to ensure sync
    onSettled: () => {
      queryClient.invalidateQueries(["vendors"]);
    },
  });

  // 🔹 Delete vendor profile
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteVendor(id),
    onSuccess: () => {
      toast.success("🗑️ Vendor deleted successfully!");
      queryClient.invalidateQueries(["vendors"]);
    },
    onError: () => toast.error("❌ Failed to delete vendor."),
  });

  return {
    vendors,
    isLoading,
    isError,
    refetch,
    updateVendor: updateMutation.mutate,
    deleteVendor: deleteMutation.mutate,
  };
};

// ✅ Optional: Hook for fetching a single vendor by ID
export const useVendorById = (id) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["vendor", id],
    queryFn: () => getVendorById(id),
    enabled: !!id,
    // staleTime: 1000 * 60 * 2,
    keepPreviousData: true,
  });

  return { vendor: data?.data, isLoading, isError };
};

// ✅ Custom hook using React Query
export const useVendorForUserDisplay = (id) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["vendorDisplay", id],
    queryFn: () => fetchVendorForUserDisplay(id),
    enabled: !!id, // only fetch if id exists
    staleTime: 1000 * 60 * 2, // 2 minutes cache
    keepPreviousData: true,
  });

  return {
    vendor: data?.data?.vendor || null,
    foods: data?.data?.foods || [],
    isLoading,
    isError,
  };
};