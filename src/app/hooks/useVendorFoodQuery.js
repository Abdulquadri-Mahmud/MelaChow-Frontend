"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

// ✅ Custom hook for managing foods
export const useFoods = () => {
  const queryClient = useQueryClient();

  const { data: foods, isLoading, isError, refetch } = useQuery({
    queryKey: ["foods"],
    queryFn: async () => [],
  });

  const createMutation = useMutation({
    mutationFn: async (data) => { },
    onSuccess: () => { },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => { },
    onSuccess: () => { },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, options }) => { },
    onSuccess: () => { },
  });

  return {
    foods,
    isLoading,
    isError,
    refetch,
    createFood: createMutation.mutate,
    updateFood: updateMutation.mutate,
    deleteFood: deleteMutation.mutate,
  };
};

export const useFoodById = (id) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["food", id],
    queryFn: async () => null,
    enabled: !!id,
  });

  return { food: data, isLoading, isError };
};

export const useVendorFood = (vendorId) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["food", vendorId],
    queryFn: async () => [],
    enabled: !!vendorId,
  });

  return { foods: data, isLoading, isError };
};
