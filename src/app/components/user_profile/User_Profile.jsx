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
  Wallet
} from "lucide-react";
import DeleteModal from "./DeleteModal";
import NeedHelp from "@/app/profile/need_help_contact_info/NeedHelp";

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
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`cursor-pointer group relative overflow-hidden bg-white border border-gray-100 rounded-[28px] p-4 transition-all duration-300 ${hoverClass} hover:shadow-2xl shadow-gray-100/50`}
    >
      {/* Glow Effects */}
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity ${isRed ? 'bg-red-500/10' : 'bg-orange-500/10'} -translate-y-1/2 translate-x-1/2`}></div>

      <div className="flex items-center gap-5 relative z-10">
        <div className={`p-4 rounded-2xl transition-colors ${baseColorClass} shadow-sm group-hover:shadow-md`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h3 className={`font-bold text-[17px] tracking-tight ${isRed ? 'text-red-600' : 'text-gray-800'}`}>
            {title}
          </h3>
          <p className="text-[13px] font-medium text-gray-400 mt-0.5">
            {description}
          </p>
        </div>
        <div className="text-gray-300 group-hover:text-gray-500 transition-colors bg-gray-50 p-2 rounded-full group-hover:bg-white group-hover:shadow-sm">
          <ChevronRight size={18} strokeWidth={3} />
        </div>
      </div>
    </motion.div>
  );
};

const User_Profile = ({ userData, isLoading }) => {
  const { baseUrl } = useApi();
  const router = useRouter();
  const { clearUser, user, logout } = useUserStorage();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const token = user?.token;

  if (isLoading || !userData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 min-h-[60vh]">
        <div className="relative">
          <div className="w-24 h-24 bg-gray-200 rounded-[32px] animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <User className="text-gray-300 animate-pulse" size={40} />
          </div>
        </div>
        <div className="mt-8 space-y-3 flex flex-col items-center">
          <div className="w-48 h-6 bg-gray-200 rounded-full animate-pulse" />
          <div className="w-32 h-4 bg-gray-100 rounded-full animate-pulse" />
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
    <div className="max-w-4xl mx-auto pb-24">
      {/* Navigation Header */}
      <div className="px-4 pt-4 flex items-center justify-between">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="p-3 rounded-2xl bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-full shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Account Hub</span>
        </div>
        <div className="w-11 h-11" />
      </div>

      {/* Profile Hero / Header */}
      <section className="relative p-6 pt-10 text-center flex flex-col items-center">
        {/* Background Decor */}
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-orange-50/50 to-transparent pointer-events-none -z-10" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative group cursor-pointer"
        >
          <div className="relative w-36 h-36 rounded-[48px] border-[6px] border-white shadow-2xl overflow-hidden bg-white transition-transform duration-500 group-hover:scale-105">
            {userData.avatar ? (
              <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <User className="w-14 h-14 text-orange-200" />
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
            className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2.5 rounded-2xl border-[6px] border-white shadow-lg"
          >
            <ShieldCheck size={20} strokeWidth={3} />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 space-y-2"
        >
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {userData.firstname} {userData.lastname}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
              <Mail size={14} className="text-orange-500" />
              <span className="text-xs font-bold text-gray-600">{userData.email}</span>
            </div>
            {userData.phone && (
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                <Phone size={14} className="text-orange-500" />
                <span className="text-xs font-bold text-gray-600">{userData.phone}</span>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Action Grid */}
      <div className="mt-8 px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* Danger Zone */}
      <div className="mt-10 px-6 space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Session & Data</p>

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

      <div className="mt-10 px-4">
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
