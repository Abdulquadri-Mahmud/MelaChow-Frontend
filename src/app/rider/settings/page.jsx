"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Bike, Phone, User, Shield, LogOut, ChevronRight,
    Bell, Moon, HelpCircle, MessageCircle, Star, Edit3, Mail
} from "lucide-react";
import { useTheme } from "@/app/context/ThemeContext";
import { useRider } from "@/app/context/RiderContext";
import toast from "react-hot-toast";

const SettingRow = ({ icon: Icon, label, value, onClick, danger = false, badge }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group ${danger
            ? "hover:bg-red-500/10"
            : "hover:bg-white/5"
            }`}
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? "bg-red-50 dark:bg-red-500/10" : "bg-black/5 dark:bg-white/5"
            }`}>
            <Icon size={18} className={danger ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors"} />
        </div>
        <div className="flex-1 min-w-0">
            <p className={`font-bold text-sm ${danger ? "text-red-500 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>{label}</p>
            {value && <p className="text-xs text-gray-500 mt-0.5 truncate">{value}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
            {badge && (
                <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] font-black rounded-full">
                    {badge}
                </span>
            )}
            <ChevronRight size={16} className={danger ? "text-red-400/50" : "text-gray-600"} />
        </div>
    </button>
);

export default function RiderSettingsPage() {
    const { rider, logout, isOnline, toggleAvailability } = useRider();
    const { theme, toggleTheme } = useTheme();
    const [notifications, setNotifications] = useState(true);

    const handleLogout = () => {
        toast.success("Logged out successfully");
        setTimeout(logout, 800);
    };

    return (
        <div className="space-y-8">
            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gradient-to-br dark:from-[#1E2128] dark:to-[#1A1D23] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none rounded-[28px] p-6 flex items-center gap-5"
            >
                <div className="w-20 h-20 rounded-3xl bg-orange-100 flex items-center justify-center overflow-hidden border-2 border-orange-500/30 shrink-0">
                    {rider?.avatar
                        ? <img src={rider.avatar} alt="" className="w-full h-full object-cover" />
                        : <Bike size={32} className="text-orange-600" />
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white truncate">{rider?.name || "Rider"}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">{rider?.phone || "—"}</p>
                    <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isOnline ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-500"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
                        {isOnline ? "Available" : "Offline"}
                    </div>
                </div>
                <button
                    onClick={() => toast("Edit profile coming soon", { icon: "🚧" })}
                    className="w-10 h-10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-400 transition-colors shrink-0"
                >
                    <Edit3 size={16} />
                </button>
            </motion.div>

            {/* Account Section */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none rounded-3xl overflow-hidden"
            >
                <div className="px-4 pt-4 pb-2">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Account</p>
                </div>
                <SettingRow icon={User} label="Personal Info" value={rider?.name} onClick={() => toast("Coming soon", { icon: "🚧" })} />
                <SettingRow icon={Phone} label="Phone Number" value={rider?.phone} onClick={() => toast("Coming soon", { icon: "🚧" })} />
                <SettingRow icon={Star} label="My Ratings" value={`${rider?.rating?.toFixed(1) || "New"} • ${rider?.ratingCount || 0} reviews`} onClick={() => toast("Coming soon", { icon: "🚧" })} />
                <SettingRow icon={Shield} label="Security" value="Password & 2FA" onClick={() => toast("Coming soon", { icon: "🚧" })} />
            </motion.div>

            {/* Preferences */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none rounded-3xl overflow-hidden"
            >
                <div className="px-4 pt-4 pb-2">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Preferences</p>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                        <Bell size={18} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900 dark:text-white">Push Notifications</p>
                        <p className="text-xs text-gray-500 mt-0.5">New orders and alerts</p>
                    </div>
                    <button
                        onClick={() => setNotifications(!notifications)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${notifications ? "bg-orange-600" : "bg-gray-200 dark:bg-white/10"}`}
                    >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notifications ? "left-7" : "left-1"}`} />
                    </button>
                </div>
                {/* Theme Toggle */}
                <div className="flex items-center gap-4 p-4 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                        <Moon size={18} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900 dark:text-white">Dark Mode</p>
                        <p className="text-xs text-gray-500 mt-0.5">Switch app theme</p>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? "bg-orange-600" : "bg-gray-200 dark:bg-white/10"}`}
                    >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${theme === 'dark' ? "left-7" : "left-1"}`} />
                    </button>
                </div>
                <SettingRow icon={Bike} label="Availability" value={isOnline ? "Currently Online" : "Currently Offline"} onClick={toggleAvailability} badge={isOnline ? "LIVE" : undefined} />
            </motion.div>

            {/* Support */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none rounded-3xl overflow-hidden"
            >
                <div className="px-4 pt-4 pb-2">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Help & Support</p>
                </div>
                <SettingRow icon={HelpCircle} label="FAQs" onClick={() => toast("Coming soon", { icon: "🚧" })} />
                <SettingRow icon={MessageCircle} label="Chat with Support" onClick={() => toast("Coming soon", { icon: "🚧" })} />
                <SettingRow icon={Mail} label="Contact Us" value="support@grubdash.ng" onClick={() => toast("Coming soon", { icon: "🚧" })} />
            </motion.div>

            {/* Logout */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none rounded-3xl overflow-hidden"
            >
                <SettingRow icon={LogOut} label="Log Out" danger onClick={handleLogout} />
            </motion.div>

            {/* App version */}
            <p className="text-center text-[11px] text-gray-700 font-medium pb-2">GrubDash Rider v1.0.0</p>
        </div>
    );
}
