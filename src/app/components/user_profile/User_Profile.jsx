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
  ArrowLeft
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
      className={`cursor-pointer group relative overflow-hidden bg-white border border-gray-100 rounded-[28px] p-6 transition-all duration-300 shadow-sm ${hoverClass} hover:shadow-xl`}
    >
      <div className="flex items-center gap-5">
        <div className={`p-4 rounded-2xl transition-colors ${baseColorClass}`}>
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
        <div className="text-gray-300 group-hover:text-gray-500 transition-colors">
          <ChevronRight size={20} strokeWidth={3} />
        </div>
      </div>
    </motion.div>
  );
};

const User_Profile = ({ userData, isLoading }) => {
  const { baseUrl } = useApi();
  const router = useRouter();
  const { clearUser, user } = useUserStorage();
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
      const res = await fetch(`${baseUrl}/user/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        localStorage.removeItem("userToken");
        clearUser();
        router.push("/auth/signin");
      }
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
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        localStorage.removeItem("userToken");
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
          onClick={() => router.push("/")}
          className="p-3 rounded-2xl bg-white border border-gray-100 text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-full shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Account Hub</span>
        </div>
        <div className="w-11 h-11" />
      </div>

      {/* Profile Hero / Header */}
      <section className="relative p-6 pt-10 text-center flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="relative w-32 h-32 rounded-[40px] border-4 border-white shadow-2xl overflow-hidden bg-gray-50">
            {userData.avatar ? (
              <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-12 h-12 text-gray-300" />
              </div>
            )}
          </div>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute -bottom-1 -right-1 bg-green-500 text-white p-2 rounded-2xl border-4 border-white shadow-lg"
          >
            <ShieldCheck size={18} strokeWidth={3} />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {userData.firstname} {userData.lastname}
          </h1>
          <p className="flex items-center justify-center gap-2 text-gray-400 font-bold text-sm mt-1">
            <Mail size={14} className="text-orange-500" /> {userData.email}
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <Phone size={14} className="text-orange-500" /> {userData.phone || "No phone added"}
          </p>
        </motion.div>
      </section>

      {/* Action Grid */}
      <div className="mt-10 px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
        {/* <ActionCard 
            icon={Bell} 
            title="Notifications" 
            description="Control how you receive order updates" 
            href="/profile/notifications"
        />
        <ActionCard 
            icon={Settings} 
            title="App Settings" 
            description="Manage your themes and preferences" 
            href="/profile/settings"
        /> */}
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
      <div className="mt-8 px-4 space-y-4">
        <div className="h-[1px] bg-gray-100 w-full mb-8" />

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

      <div className="mt-8 px-4">
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
