'use client';

import React, { useMemo } from 'react';
import { useNotificationManager } from '@/app/hooks/useNotificationManager';
import { useVendorProfile } from '@/app/context/VendorProfileContext';
import {
    Bell,
    CheckCircle2,
    Clock,
    ShoppingBag,
    XCircle,
    ChevronRight,
    Trash2,
    Calendar,
    ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function VendorNotificationsPage() {
    const { vendorProfile } = useVendorProfile();
    const router = useRouter();
    const {
        notifications,
        loading,
        markAsRead,
        markAllAsRead,
        isPushEnabled,
        isPushSupported,
        subscribe
    } = useNotificationManager({ restaurantId: vendorProfile?._id });

    // Group notifications by date
    const groupedNotifications = useMemo(() => {
        if (!notifications || notifications.length === 0) return {};

        return notifications.reduce((groups, notification) => {
            const date = parseISO(notification.createdAt);
            let groupKey = 'Earlier';

            if (isToday(date)) {
                groupKey = 'Today';
            } else if (isYesterday(date)) {
                groupKey = 'Yesterday';
            } else {
                groupKey = format(date, 'MMMM d, yyyy');
            }

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(notification);
            return groups;
        }, {});
    }, [notifications]);

    const getIcon = (type) => {
        switch (type) {
            case 'order_placed':
            case 'new_order':
                return <ShoppingBag className="text-orange-500" size={20} />;
            case 'order_cancelled':
                return <XCircle className="text-red-500" size={20} />;
            case 'order_ready':
            case 'order_completed':
                return <CheckCircle2 className="text-green-500" size={20} />;
            default:
                return <Bell className="text-blue-500" size={20} />;
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification._id);
        }

        if (notification.url) {
            router.push(notification.url);
        } else if (notification.orderId) {
            router.push(`/vendors/orders/${notification.orderDatabaseId || notification.orderId}`);
        }
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Fetching notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-2 text-sm"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        Notifications
                        {notifications.filter(n => !n.read).length > 0 && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                {notifications.filter(n => !n.read).length} new
                            </span>
                        )}
                    </h1>
                </div>

                {notifications.length > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        <CheckCircle2 size={16} /> Mark all as read
                    </button>
                )}
            </div>

            {/* Push Status Card */}
            <div className={`mb-8 p-6 rounded-3xl border backdrop-blur-xl transition-all flex flex-col md:flex-row items-center justify-between gap-6 ${isPushEnabled
                ? 'bg-green-50/50 dark:bg-green-500/5 border-green-100 dark:border-green-500/20'
                : 'bg-orange-50/50 dark:bg-orange-500/5 border-orange-100 dark:border-orange-500/20'
                }`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${isPushEnabled ? 'bg-green-100 dark:bg-green-500/20 text-green-600' : 'bg-orange-100 dark:bg-orange-500/20 text-orange-600'
                        }`}>
                        <Bell size={24} className={!isPushEnabled ? 'animate-bounce' : ''} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">
                            {isPushEnabled ? 'Push Notifications Active' : 'Enable Push Notifications'}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {isPushEnabled
                                ? 'You will receive real-time alerts even when the dashboard is closed.'
                                : 'Get instant alerts for new orders and updates on your device.'}
                        </p>
                    </div>
                </div>

                {!isPushEnabled && isPushSupported && (
                    <button
                        onClick={async () => {
                            const success = await subscribe();
                            if (success) {
                                toast.success("Push notifications enabled successfully!");
                            }
                        }}
                        className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-all active:scale-95"
                    >
                        Enable Now
                    </button>
                )}

                {isPushEnabled && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-100 dark:bg-green-500/20 px-4 py-2 rounded-full text-xs font-bold">
                        <CheckCircle2 size={14} /> ACTIVE
                    </div>
                )}
            </div>

            {/* Empty State */}
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl text-center px-6">
                    <div className="w-20 h-20 bg-orange-100 dark:bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
                        <Bell className="text-orange-500" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">All caught up!</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                        You don't have any notifications right now. New orders and updates will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedNotifications).map(([group, items]) => (
                        <div key={group} className="space-y-3">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 px-2">
                                <Calendar size={14} /> {group}
                            </h2>
                            <div className="grid gap-3">
                                <AnimatePresence mode="popLayout">
                                    {items.map((notification) => (
                                        <motion.div
                                            key={notification._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={`group relative overflow-hidden bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-500/30 rounded-2xl p-4 transition-all cursor-pointer ${!notification.read ? 'ring-1 ring-orange-500/10' : ''
                                                }`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Icon Wrapper */}
                                                <div className={`p-3 rounded-xl flex-shrink-0 ${!notification.read
                                                    ? 'bg-orange-100 dark:bg-orange-500/20'
                                                    : 'bg-slate-100 dark:bg-slate-800'
                                                    }`}>
                                                    {getIcon(notification.type)}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <h4 className={`text-base font-bold truncate ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                                                            }`}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="text-[10px] whitespace-nowrap text-slate-400 font-medium">
                                                            {format(parseISO(notification.createdAt), 'h:mm aa')}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm line-clamp-2 ${!notification.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-500'
                                                        }`}>
                                                        {notification.body}
                                                    </p>
                                                </div>

                                                {/* Action indicator */}
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    {!notification.read && (
                                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                    )}
                                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                                                </div>
                                            </div>

                                            {/* Hover effect highlight */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-orange-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
