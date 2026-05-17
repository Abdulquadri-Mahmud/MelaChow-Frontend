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
  Moon
} from "lucide-react";
import DeleteModal from "./DeleteModal";
import NeedHelp from "@/app/(customer)/profile/need_help_contact_info/NeedHelp";
import NotificationSettings from "@/app/components/notifications/NotificationSettings";
import { useTheme } from "@/app/context/ThemeContext";
import PermanentInstallButton from "@/app/components/PermanentInstallButton";

const ActionCard = ({ icon: Icon, title, description, onClick, href, color = "orange", isRed = false }) => {
  const router = useRouter();
  const baseColorClass = isRed ? "text-red-500 bg-red-50" : "text-orange-500 bg-orange-50";
  const hoverClass = isRed ? "hover:border-red-200 hover:shadow-red-500/5" : "hover:border-orange-200 hover:shadow-orange-500/5";

  const handleClick = () => {
    if (href) router.push(href);
    if (onClick) onClick();
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`cursor-pointer group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-2.5 transition-all duration-300 ${hoverClass} hover:shadow-lg shadow-zinc-100/50 dark:shadow-none`}
    >
      {/* Glow Effects */}
      <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity ${isRed ? 'bg-red-500/10' : 'bg-orange-500/10'} -translate-y-1/2 translate-x-1/2`}></div>

      <div className="flex items-center gap-3.5 relative z-10">
        <div className={`p-2.5 rounded-xl transition-colors ${isRed ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400' : 'bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400'} shadow-sm group-hover:shadow-md`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h3 className={`font-bold text-[14px] tracking-tight ${isRed ? 'text-red-600 dark:text-red-400' : 'text-zinc-800 dark:text-white'}`}>
            {title}
          </h3>
          <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">
            {description}
          </p>
        </div>
        <div className="text-zinc-300 group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded-full group-hover:bg-white dark:group-hover:bg-zinc-700 group-hover:shadow-sm">
          <ChevronRight size={15} strokeWidth={3} />
        </div>
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

  const token = user?.token;

  if (isLoading || !userData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-zinc-50/50 dark:bg-zinc-950/50 min-h-[60vh]">
        <div className="relative">
          <div className="w-24 h-24 bg-zinc-200 dark:bg-zinc-800 rounded-[32px] animate-pulse" />
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
        credentials: "include", // ✅ Send cookies
        // headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // localStorage.removeItem("userToken"); // Removed
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
    <div className="max-w-4xl mx-auto pb-5">
      {/* Navigation Header */}
      <div className="md:px-4 px-2 pt-4 flex items-center justify-between">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-full shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Account Hub</span>
        </div>
        <div className="w-11 h-11" />
      </div>

      {/* Profile Hero / Header */}
      <section className="relative p-3 pt-6 text-center flex flex-col items-center">
        {/* Background Decor */}
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-orange-500/5 dark:from-orange-500/10 to-transparent pointer-events-none -z-10" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative group cursor-pointer"
        >
          <div className="relative w-24 h-24 rounded-[24px] border-4 border-white dark:border-zinc-800 shadow-xl overflow-hidden bg-white dark:bg-zinc-900 transition-transform duration-500 group-hover:scale-105">
            {userData.avatar ? (
              <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800">
                <User className="w-10 h-10 text-orange-200 dark:text-orange-500/20" />
              </div>
            )}

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Settings className="text-white drop-shadow-lg" />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-xl border-4 border-white dark:border-zinc-800 shadow-lg"
          >
            <ShieldCheck size={16} strokeWidth={3} />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3 space-y-1"
        >
          <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
            {userData.firstname} {userData.lastname}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <Mail size={14} className="text-orange-500" />
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{userData.email}</span>
            </div>
            {userData.phone && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <Phone size={14} className="text-orange-500" />
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{userData.phone}</span>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Notifications Section - High Visibility */}
      <div className="mt-4 px-6 space-y-4">
        <NotificationSettings />
      </div>

      {/* Action Grid */}
      <div className="mt-4 px-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <ActionCard
          icon={User}
          title="Personal Details"
          description="Edit your name, phone and profile image"
          href="/profile/edit"
        />
        <ActionCard
          icon={MapPin}
          title="Delivery Addresses"
          description="Manage your saved home and office locations"
          href="/profile/address"
        />
        <ActionCard
          icon={Wallet}
          title="My Wallet"
          description="Manage funds and view transaction history"
          href="/profile/wallet"
        />
        <ActionCard
          icon={Star}
          title="My Reviews"
          description="View your past ratings and feedback"
          href="/profile/reviews"
        />

        <ActionCard
          icon={LifeBuoy}
          title="Get Help"
          description="Reach out to our support team for issues"
          href="/get-help"
        />
        <ActionCard
          icon={HelpCircle}
          title="Support & FAQs"
          description="Find answers to common questions"
          href="/faqs"
        />
        <ActionCard
          icon={Bell}
          title="Notifications"
          description="View your recent updates and account alerts"
          href="/notifications"
        />
        <ActionCard
          icon={theme === 'light' ? Moon : Sun}
          title={theme === 'light' ? "Dark Mode" : "Light Mode"}
          description={theme === 'light' ? "Switch to a darker interface" : "Switch to a brighter interface"}
          onClick={toggleTheme}
        />
      </div>

      {/* PWA Installation - Persistent Option */}
      <div className="mt-4 px-6">
        <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] pl-2 mb-2">Experience MelaChow App</p>
        <PermanentInstallButton />
      </div>

      {/* Danger Zone */}
      <div className="mt-6 px-6 space-y-3">
        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-2">Session & Data</p>

        <ActionCard
          icon={LogOut}
          title={logoutLoading ? "Logging out..." : "Log Out"}
          description="Safely sign out from your account"
          onClick={handleLogout}
        />

        <ActionCard
          icon={Trash2}
          title="Delete Account"
          description="Permanently remove your data and account"
          onClick={() => setIsDeleteModalOpen(true)}
          isRed={true}
        />
      </div>

      <div className="px-4">
        <NeedHelp />
      </div>

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
