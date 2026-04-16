"use client";

import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    CheckCheck,
    Trash2,
    Clock,
    ArrowRight,
    Loader2,
    Calendar,
    MessageSquare,
    AlertCircle,
    Bike,
    Menu,
    Filter,
    X,
    Inbox,
    BellRing,
    Activity,
    ShieldAlert,
    UserCheck,
    Navigation,
    MousePointer2
} from "lucide-react";
import { useNotificationManager } from "@/app/hooks/useNotificationManager";
import { useState, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

const getNotificationConfig = (type) => {
    switch (type) {
        case 'admin_order_ready':
        case 'rider_assignment_needed':
            return { 
                icon: Navigation, 
                color: "text-orange-500 bg-orange-50 border-orange-100 shadow-[0_0_15px_rgba(249,115,22,0.1)]", 
                label: "Dispatch",
                glow: "shadow-orange-100"
            };
        case 'admin_order_delivered':
            return { 
                icon: UserCheck, 
                color: "text-emerald-500 bg-emerald-50 border-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]", 
                label: "Complete",
                glow: "shadow-emerald-100"
            };
        case 'system':
            return { 
                icon: ShieldAlert, 
                color: "text-blue-500 bg-blue-50 border-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.1)]", 
                label: "Critical",
                glow: "shadow-blue-100"
            };
        default:
            return { 
                icon: Bell, 
                color: "text-slate-500 bg-slate-50 border-slate-200 shadow-[0_0_15px_rgba(100,116,139,0.1)]", 
                label: "Intelligence",
                glow: "shadow-slate-100"
            };
    }
};

const formatTimeAgo = (dateString) => {
    if (!dateString) return "RECENT";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "JUST NOW";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}M AGO`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}H AGO`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
};

export default function AdminNotificationsPage() {
    const {
        notifications,
        unreadCount,
        loading,
        hasMore,
        loadMore,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        refreshNotifications,
        isPushSupported,
        isPushEnabled,
        pushPermission,
        subscribe,
        unsubscribe
    } = useNotificationManager({ role: 'admin' });

    const [filter, setFilter] = useState('all'); // all, unread, logistics

    const filteredNotifications = useMemo(() => {
        if (filter === 'all') return notifications;
        if (filter === 'unread') return notifications.filter(n => !n.read);
        if (filter === 'logistics') return notifications.filter(n => n.type === 'admin_order_ready' || n.type === 'rider_assignment_needed');
        return notifications;
    }, [notifications, filter]);

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
            toast.success("Intelligence Feed Synchronized");
        } catch (err) {
            toast.error("Operation Failure");
        }
    };

    const handleClearAll = async () => {
        if (!confirm("Are you sure you want to purge your intelligence feed?")) return;
        try {
            await clearAll();
            toast.success("Feed Cleared");
        } catch (err) {
            toast.error("Operation Failure");
        }
    };

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200 shrink-0">
                                    <Bell size={22} className="text-orange-500" />
                                </div>
                                {unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 bg-orange-600 border-2 border-white w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-orange-200 animate-bounce">
                                        <span className="text-[10px] font-black text-white leading-none">
                                            {unreadCount}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Intelligence Center</h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="h-0.5 w-6 bg-orange-500 rounded-full" />
                                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">Real-time Operational Signals</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            {isPushSupported && (
                                <button
                                    onClick={isPushEnabled ? unsubscribe : subscribe}
                                    disabled={loading || pushPermission === 'denied'}
                                    className={`h-11 px-6 rounded-xl flex items-center gap-2.5 text-[10px] font-extrabold uppercase tracking-widest transition-all shadow-lg active:scale-95 border ${isPushEnabled
                                        ? "bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                                        : "bg-slate-900 border-slate-700 text-white hover:bg-orange-600"
                                        }`}
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <BellRing size={16} />}
                                    {isPushEnabled ? "Live Alerting Active" : "Initialize Push Signal"}
                                </button>
                            )}

                            <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                <button
                                    onClick={handleMarkAllRead}
                                    disabled={unreadCount === 0 || loading}
                                    className="p-2 text-slate-600 hover:text-orange-600 hover:bg-white rounded-lg transition-all disabled:opacity-30 group"
                                    title="Mark All Read"
                                >
                                    <CheckCheck size={18} className="group-hover:scale-110 transition-transform" />
                                </button>
                                <button
                                    onClick={handleClearAll}
                                    disabled={notifications.length === 0 || loading}
                                    className="p-2 text-slate-600 hover:text-rose-600 hover:bg-white rounded-lg transition-all disabled:opacity-30 group"
                                    title="Purge Intelligence"
                                >
                                    <Trash2 size={18} className="group-hover:rotate-12 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex items-center gap-1 shadow-sm w-fit">
                        {[
                            { id: 'all', label: 'Global Feed', icon: Activity },
                            { id: 'unread', label: 'Priority', icon: MousePointer2 },
                            { id: 'logistics', label: 'Dispatch', icon: Navigation },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setFilter(item.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-[0.15em] transition-all ${filter === item.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <Icon size={14} className={filter === item.id ? "text-white" : "text-slate-300"} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Feed Content */}
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[500px] relative">
                        <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 w-full animate-gradient-x" />
                        
                        <AnimatePresence mode="popLayout">
                            {loading && notifications.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-32">
                                    <Loader2 size={36} className="animate-spin text-orange-500 mb-6" />
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.3em] animate-pulse italic">Synchronizing Operational Dataset…</p>
                                </div>
                            ) : filteredNotifications.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {filteredNotifications.map((notification) => {
                                        const config = getNotificationConfig(notification.type);
                                        const Icon = config.icon;
                                        return (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                key={notification._id}
                                                className={`group relative flex items-start gap-5 p-6 transition-all ${!notification.read ? 'bg-orange-50/20 shadow-[inset_4px_0_0_0_#ea580c]' : 'hover:bg-slate-50/40'}`}
                                            >
                                                {/* Visual ID/Icon */}
                                                <div className={`mt-1 w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-all group-hover:scale-105 ${config.color} ${config.glow}`}>
                                                    <Icon size={22} />
                                                </div>

                                                {/* Metadata & Title */}
                                                <div className="flex-1 min-w-0 pr-12">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border leading-none ${config.color}`}>
                                                            {config.label}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-extrabold flex items-center gap-1.5 uppercase tracking-tighter">
                                                            <Clock size={12} className="text-slate-300" /> {formatTimeAgo(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                    <h4 className={`text-base tracking-tight leading-snug uppercase ${!notification.read ? 'font-extrabold text-slate-900' : 'font-bold text-slate-600'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-[13px] text-slate-500 mt-2 leading-relaxed font-medium">
                                                        {notification.body}
                                                    </p>

                                                    {/* Contextual Link */}
                                                    {notification.url && (
                                                        <Link
                                                            href={notification.url}
                                                            onClick={() => !notification.read && markAsRead(notification._id)}
                                                            className="inline-flex items-center gap-2.5 mt-5 px-5 py-2.5 bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all shadow-lg active:scale-95 group/link"
                                                        >
                                                            Initialize Action Matrix <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                                                        </Link>
                                                    )}
                                                </div>

                                                {/* Precision Actions */}
                                                <div className="absolute right-6 top-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                    {!notification.read && (
                                                        <button
                                                            onClick={() => markAsRead(notification._id)}
                                                            title="Signal Read Receipt"
                                                            className="p-2.5 text-slate-400 hover:text-orange-600 hover:bg-white border border-transparent hover:border-orange-100 rounded-xl transition-all shadow-sm"
                                                        >
                                                            <CheckCheck size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteNotification(notification._id)}
                                                        title="Purge Record"
                                                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-rose-100 rounded-xl transition-all shadow-sm"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}

                                    {hasMore && (
                                        <div className="p-8 flex justify-center bg-slate-50/30">
                                            <button
                                                onClick={loadMore}
                                                disabled={loading}
                                                className="h-12 px-8 bg-white border border-slate-200 rounded-2xl text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-600 hover:border-orange-400 hover:text-orange-600 transition-all shadow-sm active:scale-95"
                                            >
                                                {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : "Extend Feed Horizon"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-40">
                                    <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                                        <Inbox size={40} className="text-slate-200" />
                                    </div>
                                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-2">Registry Silent</h3>
                                    <p className="text-[11px] font-bold text-slate-400 max-w-[280px] text-center uppercase tracking-tighter opacity-80">Zero undetected operational signals in the current matrix.</p>
                                    <button
                                        onClick={refreshNotifications}
                                        className="mt-8 px-6 py-2.5 bg-slate-100 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl text-[9px] font-extrabold uppercase tracking-widest border border-transparent hover:border-orange-100 transition-all"
                                    >
                                        Force Synchronize
                                    </button>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Operational Protocols */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-5 items-center">
                        <div className="w-12 h-12 rounded-xl bg-orange-600/20 flex items-center justify-center shrink-0 border border-orange-600/20">
                            <Clock size={20} className="text-orange-500 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-[10px] font-extrabold text-orange-500 uppercase tracking-[0.15em] mb-0.5">Automated Reconciliation Protocol</p>
                            <p className="text-[11px] text-slate-400 font-bold tracking-tight opacity-70">Logistics signals prioritize rider matching integrity. Check the Dispatch filter for immediate assignment demands.</p>
                        </div>
                    </div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
