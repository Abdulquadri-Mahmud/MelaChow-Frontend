"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FiSearch, FiShoppingCart, FiUser, FiMenu } from "react-icons/fi";
import NotificationBell from "@/app/components/NotificationBell";
// import Sidebar from "./Sidebar"; // Uncomment when ready to use

const LogoImage = () => (
  <img
    src="/logo.png"
    alt="ChowConnect Logo"
    className="md:w-[160px] w-[150px] object-contain"
  />
);

import { useProfile } from "../../context/ProfileContext";

export default function Header() {
  const [isFocused, setIsFocused] = useState(false);
  const { userProfile, isLoading } = useProfile();

  return (
    <header className="sticky top-0 z-50 bg-white rounded-b-4xl border-b-3 border-white backdrop-blur-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-2">
        {/* Left & Nav Links */}
        <div className="flex items-center gap-6">
          <Link href="#">
            <LogoImage />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {["Home", "Restaurants", "Menu", "About", "Contact"].map(
              (item, index) => (
                <Link
                  key={index}
                  href="#"
                  className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
                >
                  {item}
                </Link>
              )
            )}
          </nav>
        </div>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-5">
          <motion.div
            className="relative"
            animate={{ width: isFocused ? 200 : 150 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <input
              type="text"
              placeholder="Search..."
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="pl-10 pr-4 py-2 text-sm rounded-full border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full transition-all placeholder:text-gray-500"
            />
            <FiSearch className="absolute left-3 top-2.5 text-gray-700" />
          </motion.div>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Cart Icon */}
          <Link href="/cart">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative text-gray-700 hover:text-orange-500 mt-2"
            >
              <FiShoppingCart className="text-xl" />
              {/* <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                2
              </span> */}
            </motion.button>
          </Link>

          {/* User Profile / Login */}
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          ) : userProfile ? (
            <Link href="/profile">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border border-orange-200">
                  {userProfile.firstname ? userProfile.firstname[0].toUpperCase() : <FiUser />}
                </div>
                <span className="text-sm font-bold text-gray-700 hover:text-orange-600">
                  {userProfile.firstname || "Account"}
                </span>
              </motion.div>
            </Link>
          ) : (
            <Link href="/auth/signin">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors"
              >
                Login
              </motion.button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
