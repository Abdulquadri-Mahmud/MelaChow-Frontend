"use client";

import React, { useEffect, useState } from "react";
import Header2 from "@/app/components/App_Header/Header2";
import { BiQuestionMark } from "react-icons/bi";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchUser } from "@/app/lib/api";
import User_Profile from "@/app/components/user_profile/User_Profile";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import ProtectedRoute from "@/app/components/protected-route/ProtectedRoute";

export default function ProfilePage() {
  // const [token, setToken] = useState(undefined); // Removed
  const { user } = useUserStorage();

  // Fetch user profile (cookies handled automatically)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["user"], // removed token from key
    queryFn: () => fetchUser(), // removed token arg
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (data?.user) {
      setUserData(data.user);
      // localStorage.setItem("user", JSON.stringify(token)); // Removed since we don't have token
    }
  }, [data]);

  const refreshUser = () => refetch();

  // Show login prompt if fetch fails (401 etc) or no data
  if (isError) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen font-display text-[#181410]">
        <Header2 />
        <div className="p-4 max-w-md mx-auto">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] mt-10 border border-zinc-100 dark:border-zinc-800 shadow-xl">
            <div className="w-full flex justify-center items-center mb-5">
              <img
                src="/logo.png"
                alt="MelaChow Logo"
                className="w-[170px] object-contain"
              />
            </div>
            <h2 className="text-2xl font-semibold text-orange-500 mb-2 text-center">
              Welcome to MelaChow!
            </h2>
            <p className="text-center text-zinc-600 dark:text-zinc-400 mb-6">
              Please log in to view and manage your profile.
            </p>
            <Link href="/get-help">
              <div className="my-4 border border-orange-500/20 dark:border-orange-500/10 p-4 rounded-2xl flex justify-between items-center bg-orange-50/30 dark:bg-orange-500/5 group hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 dark:bg-orange-500/20 p-1 h-10 w-10 rounded-full flex items-center justify-center">
                    <div className="bg-orange-500 text-white p-1 h-6 w-6 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <BiQuestionMark size={16} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white">FAQs & Support</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      Get support or send feedback
                    </p>
                  </div>
                </div>
                <span className="text-orange-500 text-xl font-bold opacity-30 group-hover:opacity-100 transform transition-transform group-hover:translate-x-1">â€º</span>
              </div>
            </Link>
            <Link href="/auth/signin" className='cursor-pointer'>
              <button className="bg-orange-500 mt-5 w-full cursor-pointer rounded-md text-white py-3 hover:bg-orange-600">
                Login
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show loading if query is in progress or userData is not yet available
  if (isLoading || !userData) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
        <Header2 />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-pulse flex flex-col gap-3 items-center">
            <div className="w-24 h-24 bg-zinc-300 dark:bg-zinc-800 rounded-full" />
            <div className="w-40 h-5 bg-zinc-300 dark:bg-zinc-800 rounded-md" />
            <div className="w-52 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 mt-6">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show user profile once data is ready
  return (
    <ProtectedRoute>
      <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen font-display text-[#181410] dark:text-white">
        {/* <Header2 /> */}
        <div className="">
          <User_Profile
            userData={userData}
            isLoading={isLoading}
            onProfileUpdate={refreshUser}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}

