"use client";

import React, { useEffect, useState } from "react";
import Header2 from "../components/App_Header/Header2";
import { BiQuestionMark } from "react-icons/bi";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchUser } from "../lib/api";
import User_Profile from "../components/user_profile/User_Profile";
import { useUserStorage } from "../hooks/useUserStorage";

export default function ProfilePage() {
  const [token, setToken] = useState(undefined); // undefined while initializing
  const {user} = useUserStorage();

  
  // Get token safely after mount (client-side only)
  useEffect(() => {
    if (user) {
      setToken(user.token || null);
    }
  }, [user]);

  // Only start query when token exists
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["user", token],
    queryFn: () => fetchUser(token),
    enabled: !!token,
    retry: false, // avoid retrying if token invalid
  });

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (token) {
      setUserData(data.user);
      localStorage.setItem("user", JSON.stringify(token));
    }
  }, [data]);

  const refreshUser = () => refetch();

  // Show loading placeholder while initializing token
  if (token === undefined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        {/* <Header2 /> */}
        <p className="text-gray-500">Initializing...</p>
      </div>
    );
  }

  // Show login prompt if no token
  if (!token) {
    return (
      <div className="bg-zinc-50 min-h-screen font-display text-[#181410]">
        <Header2 />
        <div className="p-4 max-w-md mx-auto">
          <div className="bg-white p-4 rounded-xl mt-10">
            <div className="w-full flex justify-center items-center mb-5">
              <img
                src="/logo.png"
                alt="GrubDash Logo"
                className="w-[170px] object-contain"
              />
            </div>
            <h2 className="text-2xl font-semibold text-orange-500 mb-2 text-center">
              Welcome to GrubDash!
            </h2>
            <p className="text-center text-gray-600 mb-4">
              Please log in to view and manage your profile.
            </p>
            <Link href="/get-help">
              <div className="my-4 border border-orange-500 p-3 rounded-md flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-1 h-10 w-10 rounded-full flex items-center justify-center">
                    <div className="bg-orange-500 text-white p-1 h-6 w-6 rounded-full flex items-center justify-center">
                      <BiQuestionMark />
                    </div>
                  </div>
                  <div>
                    <h3>FAQs & Support</h3>
                    <p className="text-xs text-gray-400">
                      Get support or send feedback
                    </p>
                  </div>
                </div>
                <span className="text-gray-400 text-lg">›</span>
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
      <div>
        <Header2 />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-pulse flex flex-col gap-3 items-center">
            <div className="w-24 h-24 bg-gray-300 rounded-full" />
            <div className="w-40 h-5 bg-gray-300 rounded-md" />
            <div className="w-52 h-4 bg-gray-200 rounded-md" />
          </div>
          <p className="text-gray-500 mt-6">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show user profile once data is ready
  return (
    <div className="bg-zinc-50 font-display text-[#181410]">
      {/* <Header2 /> */}
      <div className="p-2">
        <User_Profile
          userData={userData}
          isLoading={isLoading}
          onProfileUpdate={refreshUser}
        />
      </div>
    </div>
  );
}
