"use client";

import { useState } from "react";
import { Bell, BellOff, Gift, Package, Sparkles, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePushNotifications } from "../../hooks/usePushNotifications";

export default function NotificationSettings() {
    const {
        isSupported,
        subscription,
        permission,
        loading,
        subscribe,
        unsubscribe,
    } = usePushNotifications();

    // Preserve original preference states under-the-hood so other functions remain completely intact
    const [preferences] = useState({
        orderUpdates: true,
        promotions: false,
        newFeatures: true
    });

    const isEnabled = !!subscription;
    const isDenied = permission === 'denied';

    if (!isSupported) {
        return (
            <div className=" p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-4 text-zinc-500">
                    <div className="w-12 h-12 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <BellOff size={24} />
                    </div>
                    <div>
                        <p className="font-bold text-zinc-900 dark:text-white">Push Notifications Unsupported</p>
                        <p className="text-sm opacity-60">Your browser does not support push notifications.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-[8px] md:p-6 p-3 shadow-xl shadow-zinc-100/50 dark:shadow-none border border-zinc-100 dark:border-zinc-800 space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-zinc-50 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner ${isEnabled
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-zinc-50 text-zinc-400 dark:bg-zinc-850"
                        }`}>
                        {isEnabled ? (
                            <Bell size={28} />
                        ) : (
                            <BellOff size={28} />
                        )}
                    </div>
                    <div>
                        <h3 className="font-black text-zinc-900 dark:text-white text-xl tracking-tight italic uppercase">Notifications</h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                            {isEnabled
                                ? "Active • Real-time updates"
                                : isDenied
                                    ? "Blocked • Check Browser"
                                    : "Disabled • Enable to stay updated"}
                        </p>
                    </div>
                </div>

                {/* Single Master Toggle */}
                <button
                    onClick={isEnabled ? unsubscribe : subscribe}
                    disabled={loading || isDenied}
                    className={`relative w-16 h-8 rounded-full transition-all duration-300 shadow-inner ${isEnabled
                        ? "bg-emerald-500"
                        : "bg-zinc-200 dark:bg-zinc-700"
                        } ${isDenied ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
                >
                    <motion.div
                        className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg"
                        animate={{ x: isEnabled ? 32 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                </button>
            </div>

            {/* Status Messages */}
            {isDenied && (
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-3 flex items-start gap-3">
                    <AlertCircle className="text-rose-500 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                        <p className="text-sm font-black text-rose-900 dark:text-rose-400 uppercase italic">Notifications Blocked</p>
                        <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">Please update your browser settings to allow notifications for MelaChow.</p>
                    </div>
                </div>
            )}

            {/* Notification Categories - Passive Indicators */}
            <AnimatePresence initial={false}>
                {isEnabled && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-3.5 overflow-hidden"
                    >
                        <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] pl-1">Subscribed Channels</p>
                        <PassivePreferenceItem
                            icon={Package}
                            color="blue"
                            title="Order Updates"
                            desc="Track your orders in real-time"
                        />
                        <PassivePreferenceItem
                            icon={Gift}
                            color="orange"
                            title="Promotions & Deals"
                            desc="Get exclusive offers and discounts"
                        />
                        <PassivePreferenceItem
                            icon={Sparkles}
                            color="purple"
                            title="New Features"
                            desc="Be first to know about updates"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Info Banner */}
            {!isEnabled && !isDenied && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-[24px] p-5 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
                            <Bell className="text-amber-650 dark:text-amber-400" size={16} />
                        </div>
                        <p className="text-xs font-black text-amber-900 dark:text-amber-450 uppercase italic tracking-wider">Why Enable Notifications?</p>
                    </div>
                    <ul className="space-y-2">
                        <BenefitItem text="Get instant updates when your order is ready" />
                        <BenefitItem text="Never miss exclusive deals and discounts" />
                        <BenefitItem text="Stay informed about delivery status" />
                    </ul>
                </div>
            )}
        </motion.div>
    );
}

function PassivePreferenceItem({ icon: Icon, title, desc, color }) {
    const colorMap = {
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
        orange: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
        purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
    };

    return (
        <div className="flex items-center justify-between p-3.5 bg-zinc-50/50 dark:bg-zinc-800/20 rounded-2xl border border-zinc-100/50 dark:border-zinc-800/50">
            <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${colorMap[color]}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{title}</p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">{desc}</p>
                </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                <Check size={12} strokeWidth={3.5} />
            </div>
        </div>
    );
}

function BenefitItem({ text }) {
    return (
        <li className="flex items-start gap-2.5 text-[11px] font-bold text-amber-800/70 dark:text-amber-400/70 uppercase tracking-tight leading-none">
            <Check size={12} className="mt-0.5 flex-shrink-0 text-amber-600" />
            <span>{text}</span>
        </li>
    );
}
