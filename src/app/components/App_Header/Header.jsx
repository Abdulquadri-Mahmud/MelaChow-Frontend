"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FiSearch, FiShoppingCart, FiUser, FiMenu } from "react-icons/fi";
// import Sidebar from "./Sidebar"; // Uncomment when ready to use

const LogoImage = () => (
  <img
    src="/logo.png"
    alt="ChowConnect Logo"
    className="md:w-[160px] w-[150px] object-contain"
  />
);

export default function Header() {
  const [isFocused, setIsFocused] = useState(false);

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

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative text-gray-700 hover:text-orange-500"
          >
            <FiShoppingCart className="text-xl" />
            <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
              2
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="text-gray-700 hover:text-orange-500"
          >
            <FiUser className="text-xl" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
