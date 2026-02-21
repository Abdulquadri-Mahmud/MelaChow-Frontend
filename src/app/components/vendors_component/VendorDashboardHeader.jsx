"use client";

import { useState } from "react";
import { Search, Bell, Zap, Menu, Utensils, ShoppingBag, Monitor } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "@/app/components/NotificationBell";

export default function VendorDashboardHeader({ vendor, onMenuClick }) {
  const [showQuickActions, setShowQuickActions] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-4 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-6 flex-1">
        {/* Mobile Toggle (Visible on small screens) */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {vendor?.storeName || "Vendor Dashboard"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Welcome back, {vendor?.name?.split(" ")[0] || "Partner"}
          </p>
        </div>

        <div className="relative w-full max-w-sm hidden md:block ml-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-[#FF6B00] placeholder:text-slate-500 text-slate-900 dark:text-white outline-none transition-all"
            placeholder="Search..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#FF6B00]/50 hover:bg-slate-100 transition-all"
          >
            <Zap size={14} className="text-[#FF6B00] fill-[#FF6B00]" />
            Quick Actions
          </button>

          <AnimatePresence>
            {showQuickActions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowQuickActions(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-20"
                >
                  <div className="p-1">
                    <Link
                      href="/vendors/create-food"
                      onClick={() => setShowQuickActions(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
                    >
                      <div className="bg-orange-100 dark:bg-orange-500/20 p-1.5 rounded-md text-orange-600 dark:text-orange-400 group-hover:text-[#FF6B00]">
                        <Utensils size={14} />
                      </div>
                      Add New Item
                    </Link>
                    <Link
                      href="/vendors/order"
                      onClick={() => setShowQuickActions(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
                    >
                      <div className="bg-blue-100 dark:bg-blue-500/20 p-1.5 rounded-md text-blue-600 dark:text-blue-400">
                        <ShoppingBag size={14} />
                      </div>
                      Manage Orders
                    </Link>
                    <Link
                      href="/vendors/profile"
                      onClick={() => setShowQuickActions(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
                    >
                      <div className="bg-slate-100 dark:bg-slate-700 p-1.5 rounded-md text-slate-600 dark:text-slate-400">
                        <Monitor size={14} />
                      </div>
                      Store Settings
                    </Link>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

        {/* Notification Bell */}
        <NotificationBell
          restaurantId={vendor?._id}
          href="/vendors/notifications"
        />


        <div className="flex items-center gap-3 pl-2 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="relative">
            <div
              className="size-9 rounded-full bg-slate-200 dark:bg-slate-700 bg-cover bg-center border border-slate-200 dark:border-slate-700"
              style={{ backgroundImage: `url('${vendor?.logo || "/placeholder-logo.png"}')` }}
            />
            {/* Notification Subscription Badge (Matches User Flow) */}
            {typeof window !== "undefined" && "Notification" in window && Notification.permission === "default" && (
              <motion.div
                className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-orange-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm z-10"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                title="Enable notifications for order updates"
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
