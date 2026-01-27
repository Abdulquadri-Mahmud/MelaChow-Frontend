"use client";

import { Search, Bell, Zap, Menu } from "lucide-react";

export default function VendorDashboardHeader({ vendor }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-4 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-6 flex-1">
        {/* Mobile Toggle (Visible on small screens) */}
        <button className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
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
        <button className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#FF6B00]/50 transition-all">
          <Zap size={14} className="text-[#FF6B00] fill-[#FF6B00]" />
          Quick Actions
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

        <button className="relative size-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0F172A]"></span>
        </button>

        <div className="flex items-center gap-3 pl-2 cursor-pointer hover:opacity-80 transition-opacity">
          <div
            className="size-9 rounded-full bg-slate-200 dark:bg-slate-700 bg-cover bg-center border border-slate-200 dark:border-slate-700"
            style={{ backgroundImage: `url('${vendor?.logo || "/placeholder-logo.png"}')` }}
          ></div>
        </div>
      </div>
    </header>
  );
}
