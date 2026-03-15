"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, ShoppingBag, User, Menu } from "lucide-react";
import NotificationBell from "@/app/components/NotificationBell";
import { useProfile } from "../../context/ProfileContext";

export default function Header() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { userProfile, isLoading } = useProfile();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Restaurants", href: "/restaurants" },
    { name: "Orders", href: "/orders" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" }
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full"
    >
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* Logo Section */}
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:rotate-6 transition-transform">
                <span className="text-white font-black italic text-xl">G</span>
              </div>
              <span className="hidden sm:block text-lg font-black italic tracking-tighter uppercase dark:text-white">
                Grub<span className="text-orange-500">Dash</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-500 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-4">

            {/* Search Bar - Premium Integrated Style */}
            <motion.div
              className="hidden md:flex relative items-center"
              initial={false}
              animate={{ width: isSearchFocused ? 240 : 180 }}
            >
              <div className={`w-full flex items-center gap-2 px-3 h-10 rounded-2xl border transition-all ${isSearchFocused
                ? 'bg-white dark:bg-slate-800 border-orange-500/50 shadow-md ring-4 ring-orange-500/5'
                : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                }`}>
                <Search size={16} className={isSearchFocused ? 'text-orange-500' : 'text-slate-400'} />
                <input
                  type="text"
                  placeholder="Search dishes..."
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="bg-transparent text-sm font-medium w-full focus:outline-none dark:text-white placeholder:text-slate-400"
                />
              </div>
            </motion.div>

            <div className="flex items-center gap-3">
              <NotificationBell />

              <Link href="/orders?activeTab=cart">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent hover:border-orange-200 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-orange-600 transition-all"
                >
                  <ShoppingBag size={20} />
                </motion.div>
              </Link>

              {/* User Entry */}
              {isLoading ? (
                <div className="w-10 h-10 rounded-[18px] bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ) : userProfile ? (
                <Link href="/profile">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 p-1 pl-1 pr-3 rounded-[20px] bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-orange-200 dark:hover:border-slate-700 transition-all group relative"
                  >
                    <div className="w-8 h-8 rounded-[15px] bg-gradient-to-tr from-orange-400 to-orange-600 flex items-center justify-center text-white font-black italic shadow-md relative">
                      {userProfile.firstname ? userProfile.firstname[0].toUpperCase() : <User size={16} />}

                      {/* Status Dot */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter leading-none mb-0.5">Hello,</span>
                      <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none group-hover:text-orange-600 transition-colors">
                        {userProfile.firstname || "Profile"}
                      </span>
                    </div>

                    {/* Notification Badge (Subtle Indicator) */}
                    {typeof window !== "undefined" && "Notification" in window && Notification.permission === "default" && (
                      <motion.div
                        className="absolute -top-1 -right-0.5 w-3 h-3 bg-orange-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm z-10"
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest italic rounded-2xl shadow-lg shadow-slate-200 dark:shadow-none hover:bg-orange-600 dark:hover:bg-orange-500 dark:hover:text-white transition-all"
                  >
                    Login
                  </motion.button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <button className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              <Menu size={24} className="text-gray-700 dark:text-gray-200" />
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
