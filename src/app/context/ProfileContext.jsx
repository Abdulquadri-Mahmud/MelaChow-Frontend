"use client";

import React, { createContext, useContext } from "react";
import { useApi } from "./ApiContext";
import { useQuery } from "@tanstack/react-query";

const ProfileContext = createContext(undefined);

export const ProfileProvider = ({ children }) => {
  const { baseUrl } = useApi();

  // Function used by React Query to fetch the user profile
  const fetchProfile = async () => {
    const token = localStorage.getItem("token");

    if (!token) throw new Error("No authentication token found.");

    const res = await fetch(`${baseUrl}/user/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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
