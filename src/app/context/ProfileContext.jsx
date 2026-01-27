"use client";

import React, { createContext, useContext } from "react";
import { useApi } from "./ApiContext";
import { useQuery } from "@tanstack/react-query";

const ProfileContext = createContext(undefined);

export const ProfileProvider = ({ children }) => {
  const { baseUrl } = useApi();

  // Function used by React Query to fetch the user profile
  const fetchProfile = async () => {
    const res = await fetch(`${baseUrl}/user/auth/profile`, {
      credentials: "include", // ✅ Send cookies
      cache: "no-store",
    });

    // Handle 401 gracefully - return null for guest users
    if (res.status === 401) {
      return null; // Guest mode - no unauthorized event dispatch
    }

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to fetch profile");

    return data.user || data;
  };

  // React Query hook
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
    retry: false, // avoid retry loop if token is invalid
    refetchOnMount: true, // ✅ Refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on every window focus to avoid excessive calls
  });

  return (
    <ProfileContext.Provider
      value={{
        userProfile: data,
        isLoading,
        error: error ? error.message : null,
        refetchProfile: refetch,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
