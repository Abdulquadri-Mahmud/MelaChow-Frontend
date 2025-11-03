"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Bell } from "lucide-react";
import { FaUser } from "react-icons/fa";
import { fetchUser } from "@/app/lib/api";
import Link from "next/link";

export default function HomeHeader() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken || null);
  }, []);

  // Fetch user data only if token exists
  const { data, isLoading, isError } = useQuery({
    queryKey: ["userProfile", token],
    queryFn: () => fetchUser(token),
    enabled: !!token,
    retry: false,
  });

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (data?.user) {
      setUserData(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    }
  }, [data]);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-between px-4 py-3 bg-white shadow-sm sticky top-0 z-50"
    >
      {/* Location Info */}
      <div>
        <p className="text-xs text-gray-700 flex items-center gap-1">
          <MapPin size={14} className="text-[#FF6B00]" />
          Deliver to
        </p>
        <h2 className="font-semibold text-gray-800 text-sm">
          Lagos, Nigeria
        </h2>
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-4">
        <motion.div whileHover={{ rotate: 15 }} className="relative">
          {/* <Bell className="text-gray-700" size={22} />
          <span className="absolute -top-1 -right-1 bg-[#FF6B00] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
            0
          </span> */}
        </motion.div>

        {isLoading ? (
          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ) : userData?.avatar ? (
            <Link href='/profile'>
              <img src={userData.avatar} alt="User Avatar" className="w-9 h-9 rounded-full object-cover border-2 border-[#FF6B00]"/>
            </Link>
        ) : (
          <FaUser className="text-orange-400 w-8 h-8" />
        )}
      </div>
    </motion.header>
  );
}
