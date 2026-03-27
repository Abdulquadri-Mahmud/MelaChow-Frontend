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
    Inbox
} from "lucide-react";
import { useNotificationManager } from "@/app/hooks/useNotificationManager";
import { useState, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

const getNotificationConfig = (type) => {
    switch (type) {
        case 'admin_order_ready':
        case 'rider_assignment_needed':
            return { icon: Bike, color: "text-rose-500 bg-rose-50 border-rose-100", label: "Logistics" };
        case 'admin_order_delivered':
            return { icon: CheckCheck, color: "text-emerald-500 bg-emerald-50 border-emerald-100", label: "Completion" };
        case 'system':
            return { icon: AlertCircle, color: "text-amber-500 bg-amber-50 border-amber-100", label: "System" };
        default:
            return { icon: Bell, color: "text-blue-500 bg-blue-50 border-blue-100", label: "Update" };
    }
};

const formatTimeAgo = (dateString) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
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
        refreshNotifications
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
            toast.success("All notifications marked as read");
        } catch (err) {
            toast.error("Failed to mark all as read");
        }
    };

    const handleClearAll = async () => {
        if (!confirm("Are you sure you want to clear all notifications?")) return;
        try {
            await clearAll();
            toast.success("Inbox cleared");
        } catch (err) {
            toast.error("Failed to clear inbox");
        }
    };

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-4xl mx-auto space-y-4">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                Notification Center
                                {unreadCount > 0 && (
                                    <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </h1>
                            <p className="text-sm text-slate-500 mt-0.5">Real-time logistics alerts and platform updates.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleMarkAllRead}
                                disabled={unreadCount === 0 || loading}
                                className="h-9 px-3 bg-white border border-slate-200 text-slate-600 rounded-md flex items-center gap-2 font-bold text-[10px] uppercase hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                <CheckCheck size={14} /> Mark Read
                            </button>
                            <button
                                onClick={handleClearAll}
                                disabled={notifications.length === 0 || loading}
                                className="h-9 px-3 bg-white border border-slate-200 text-rose-600 rounded-md flex items-center gap-2 font-bold text-[10px] uppercase hover:bg-rose-50 transition-colors disabled:opacity-50"
                            >
                                <Trash2 size={14} /> Clear All
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${filter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                        >
                            All Activity
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${filter === 'unread' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                        >
                            Unread
                        </button>
                        <button
                            onClick={() => setFilter('logistics')}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${filter === 'logistics' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                        >
                            Logistics Only
                        </button>
                    </div>

                    {/* Notifications List */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col min-h-[400px]">
                        <AnimatePresence mode="popLayout">
                            {loading && notifications.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-20">
                                    <Loader2 size={32} className="animate-spin text-slate-300" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-4 shadow-sm italic">Synchronizing Feeds...</p>
                                </div>
                            ) : filteredNotifications.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {filteredNotifications.map((notification) => {
                                        const config = getNotificationConfig(notification.type);
                                        const Icon = config.icon;
                                        return (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                key={notification._id}
                                                className={`group relative flex items-start gap-4 p-4 transition-colors ${!notification.read ? 'bg-slate-50/80 shadow-[inset_3px_0_0_0_#0f172a]' : 'hover:bg-slate-50/50'}`}
                                            >
                                                {/* Icon */}
                                                <div className={`mt-1 w-10 h-10 rounded border flex items-center justify-center shrink-0 ${config.color}`}>
                                                    <Icon size={18} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 pr-10">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 leading-none">
                                                            {config.label}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                            <Clock size={10} /> {formatTimeAgo(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                    <h4 className={`text-sm tracking-tight leading-snug ${!notification.read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                        {notification.body}
                                                    </p>

                                                    {/* Link Action */}
                                                    {notification.url && (
                                                        <Link
                                                            href={notification.url}
                                                            onClick={() => !notification.read && markAsRead(notification._id)}
                                                            className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wide group/link"
                                                        >
                                                            Take Action <ArrowRight size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
                                                        </Link>
                                                    )}
                                                </div>

                                                {/* Float Actions */}
                                                <div className="absolute right-4 top-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!notification.read && (
                                                        <button
                                                            onClick={() => markAsRead(notification._id)}
                                                            title="Mark as read"
                                                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white border hover:border-slate-200 rounded transition-all"
                                                        >
                                                            <CheckCheck size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteNotification(notification._id)}
                                                        title="Delete"
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white border hover:border-slate-200 rounded transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}

                                    {hasMore && (
                                        <div className="p-4 flex justify-center">
                                            <button
                                                onClick={loadMore}
                                                disabled={loading}
                                                className="h-10 px-6 border border-slate-200 rounded-md text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                            >
                                                {loading ? <Loader2 size={16} className="animate-spin" /> : "Load More Activity"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
                                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                        <Inbox size={32} className="opacity-20" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-1">Inbox Zero</h3>
                                    <p className="text-xs max-w-[220px] text-center">No notifications found for the selected filter. You're all caught up!</p>
                                    <button
                                        onClick={refreshNotifications}
                                        className="mt-6 text-[10px] font-bold uppercase text-blue-600 hover:underline"
                                    >
                                        Check for Updates
                                    </button>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Tips/Info */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3">
                        <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center shrink-0">
                            <Clock size={16} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wide">Automatic Reconciliation</p>
                            <p className="text-[10px] text-blue-700 font-medium">Missed alerts are automatically delivered whenever you connect. Check the Logistics filter for urgent rider assignments.</p>
                        </div>
                    </div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
