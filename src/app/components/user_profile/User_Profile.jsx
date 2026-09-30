"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  MapPin,
  LifeBuoy,
  HelpCircle,
  LogOut,
  Trash2,
  ChevronRight,
  Mail,
  Phone,
  ShieldCheck,
  Settings,
  Bell,
  ArrowLeft,
  Star,
  Wallet,
  Sun,
  Moon,
  Smartphone
} from "lucide-react";
import DeleteModal from "./DeleteModal";
import NeedHelp from "@/app/(customer)/profile/need_help_contact_info/NeedHelp";
import NotificationSettings from "@/app/components/notifications/NotificationSettings";
import { useTheme } from "@/app/context/ThemeContext";
import PermanentInstallButton from "@/app/components/PermanentInstallButton";
import Header2 from "../App_Header/Header2";

const MobileSettingsGroup = ({ title, children }) => {
  return (
    <div className="space-y-3">
      <div className="px-3 sm:px-4">
        <h2 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-[0.16em] italic">
          {title}
        </h2>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm shadow-zinc-100/50 dark:shadow-none divide-y divide-zinc-100 dark:divide-zinc-800/70">
        {children}
      </div>
    </div>
  );
};

const MobileActionRow = ({ icon: Icon, title, subtitle, onClick, href, color = "orange", isRed = false, rightElement = null }) => {
  const router = useRouter();

  const handleClick = () => {
    if (href) router.push(href);
    if (onClick) onClick();
  };

  const colorClasses = isRed
    ? "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"
    : "bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400";

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="flex min-h-[76px] items-center gap-4 px-4 py-4 cursor-pointer transition-colors duration-200 group will-change-transform"
      style={{ backfaceVisibility: "hidden", WebkitFontSmoothing: "antialiased" }}
    >
      <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-105 ${colorClasses}`}>
        <Icon size={22} strokeWidth={2.4} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-[15px] leading-tight tracking-tight truncate ${isRed ? 'text-red-650 dark:text-red-400' : 'text-zinc-800 dark:text-zinc-100'}`}>
          {title}
        </p>
        {subtitle && (
          <p className="text-xs leading-snug text-zinc-500 dark:text-zinc-400 font-medium truncate mt-1">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {rightElement}
        <ChevronRight size={18} strokeWidth={3} className="text-zinc-300 dark:text-zinc-650 group-hover:text-zinc-400 transition-colors" />
      </div>
    </motion.div>
  );
};

const User_Profile = ({ userData, isLoading }) => {
  const { baseUrl } = useApi();
  const router = useRouter();
  const { clearUser, user, logout } = useUserStorage();
  const { theme, toggleTheme } = useTheme();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (isLoading || !userData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-zinc-50/50 dark:bg-zinc-950/50 min-h-[60vh]">
        <div className="relative">
          <div className="w-24 h-24 bg-zinc-200 dark:bg-zinc-800 rounded-[8px] animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <User className="text-zinc-300 dark:text-zinc-600 animate-pulse" size={40} />
          </div>
        </div>
        <div className="mt-8 space-y-3 flex flex-col items-center">
          <div className="w-48 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
          <div className="w-32 h-4 bg-zinc-100 dark:bg-zinc-700 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout();
      router.push("/auth/signin");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLogoutLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const res = await fetch(`${baseUrl}/user/auth/delete`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        clearUser();
        router.push("/auth/signup");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-28">
      <Header2/>
      {/* Premium iOS style navigation header */}
      {/* <div className="pt-4 flex items-center justify-between">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="p-3 rounded bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </motion.button>
        <div className="flex items-center gap-2 px-4.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-full shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-405">Profile Hub</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-3 rounded bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </motion.button>
      </div> */}

      {/* Clean Premium Profile Card (No Heavy Blur Filters to Prevent GPU Tearing) */}
      {/* relative overflow-hidden composite-stable */}
      <section className="mx-3 bg-gradient-to-br from-white via-zinc-50 to-orange-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800/80 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 shadow-xl shadow-zinc-100/50 dark:shadow-none will-change-auto" style={{ backfaceVisibility: "hidden", WebkitFontSmoothing: "antialiased", contain: "layout style paint" }}>
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative">
            <div className="relative w-24 h-24 rounded-2xl border-4 border-orange-100 dark:border-zinc-850 overflow-hidden bg-zinc-100 dark:bg-zinc-800 transition-transform duration-500 group-hover:scale-105">
              {userData.avatar ? (
                <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-orange-50 dark:bg-orange-500/5">
                  <User className="w-10 h-10 text-orange-400/80 dark:text-orange-500/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                <Settings className="text-white drop-shadow-md" size={16} />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded border-2 border-white dark:border-zinc-850 shadow-md">
              <ShieldCheck size={12} strokeWidth={3} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight truncate leading-none">
              {userData.firstname} {userData.lastname}
            </h1>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">Customer</span>
              <span>•</span>
              <span className="text-green-500">Verified</span>
            </p>
          </div>
        </div>

        {/* Contact badges grid */}
        <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80 grid grid-cols-1 gap-2">
          <div className="flex min-h-12 items-center gap-3 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-950/40 rounded border border-zinc-100/30 dark:border-zinc-800/30">
            <Mail size={18} className="text-orange-500 shrink-0" />
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-400 truncate">{userData.email}</span>
          </div>
          {userData.phone && (
            <div className="flex min-h-12 items-center gap-3 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-950/40 rounded border border-zinc-100/30 dark:border-zinc-800/30">
              <Phone size={18} className="text-orange-500 shrink-0" />
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-400 truncate">{userData.phone}</span>
            </div>
          )}
        </div>
      </section>

      {/* Notifications Module - Unified Single Toggle */}
      <div className="mx-3">
        <NotificationSettings />
      </div>

      {/* Actions & Settings Groups */}
      <div className="mx-3 space-y-7">
        <MobileSettingsGroup title="Account Settings">
          <MobileActionRow
            icon={User}
            title="Personal Details"
            subtitle="Edit your name, phone and profile image"
            href="/profile/edit"
          />
          <MobileActionRow
            icon={MapPin}
            title="Delivery Addresses"
            subtitle="Manage your saved home and office locations"
            href="/profile/address"
          />
          <MobileActionRow
            icon={Wallet}
            title="My Wallet"
            subtitle="Manage funds and view transaction history"
            href="/profile/wallet"
          />
          <MobileActionRow
            icon={Star}
            title="My Reviews"
            subtitle="View your past ratings and feedback"
            href="/profile/reviews"
          />
        </MobileSettingsGroup>

        <MobileSettingsGroup title="Support & Info">
          <MobileActionRow
            icon={LifeBuoy}
            title="Get Help"
            subtitle="Reach out to our support team for issues"
            href="/get-help"
          />
          <MobileActionRow
            icon={HelpCircle}
            title="Support & FAQs"
            subtitle="Find answers to common questions"
            href="/faqs"
          />
          <MobileActionRow
            icon={Bell}
            title="Notifications History"
            subtitle="View your recent updates and account alerts"
            href="/notifications"
          />
          <MobileActionRow
            icon={theme === 'light' ? Moon : Sun}
            title={theme === 'light' ? "Dark Theme" : "Light Theme"}
            subtitle={theme === 'light' ? "Switch to a darker interface" : "Switch to a brighter interface"}
            onClick={toggleTheme}
            rightElement={
              <span className="mr-1 text-xs font-black uppercase text-zinc-500">
                {theme}
              </span>
            }
          />
        </MobileSettingsGroup>

        {/* PWA Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-3 sm:px-4">
            <Smartphone size={14} className="text-zinc-400" />
            <h2 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-[0.16em] italic">
              App Experience
            </h2>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm shadow-zinc-100/50 dark:shadow-none">
            <PermanentInstallButton />
          </div>
        </div>

        {/* Danger & Session Settings */}
        <MobileSettingsGroup title="Session & Privacy">
          <MobileActionRow
            icon={LogOut}
            title={logoutLoading ? "Logging out..." : "Log Out"}
            subtitle="Safely sign out from your current device"
            onClick={handleLogout}
          />
          <MobileActionRow
            icon={Trash2}
            title="Delete Account"
            subtitle="Permanently erase all your account data"
            onClick={() => setIsDeleteModalOpen(true)}
            isRed={true}
          />
        </MobileSettingsGroup>
      </div>

      {/* <div className="px-2">
        <NeedHelp />
      </div> */}

      <DeleteModal
        isDeleteModalOpen={isDeleteModalOpen}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        confirmDelete={confirmDelete}
        deleteLoading={deleteLoading}
      />
    </div>
  );
};

export default User_Profile;
