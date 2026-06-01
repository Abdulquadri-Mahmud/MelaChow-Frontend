"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from '@/app/components/NotificationBell';
import { ChevronLeft } from "lucide-react";
import ProfileIconWithBadge from "./ProfileIconWithBadge";
import { motion } from "framer-motion";

export default function Header2({ title, subtitle }) {
  const pathname = usePathname();
  const router = useRouter();

  // Extract route name from pathname (e.g. /auth/signin → "Signin")
  const routeName = pathname
    ?.split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/-/g, " ") // Handle kebab-case routes
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Home";

  const displayTitle = title || routeName;
  const displaySubtitle = subtitle || "MelaChow";

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 py-4 h-16 flex items-center justify-between">

          <div className="flex items-center gap-4">
            {/* Premium Back Button */}
            <motion.button
              whileHover={{ scale: 1.1, x: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.back()}
              className="p-2.5 rounded-2xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-700 dark:text-gray-200 hover:text-orange-500 transition-all hover:shadow-md"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>

            {/* Current Page Title - High Refinement */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-orange-500 tracking-[0.2em] italic opacity-70 leading-none mb-1">
                {displaySubtitle}
              </span>
              <h1 className="text-base font-black text-gray-900 dark:text-white uppercase italic tracking-tighter leading-none max-w-[200px] truncate sm:max-w-xs">
                {displayTitle}
              </h1>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <ProfileIconWithBadge onClick={() => router.push('/profile')} />
          </div>
      </div>
    </header>
  );
}

