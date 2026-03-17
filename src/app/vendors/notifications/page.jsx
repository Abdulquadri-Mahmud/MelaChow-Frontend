'use client';

import React, { useMemo, useState } from 'react';
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
    ArrowLeft,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ClearNotificationsModal from '@/app/components/notifications/ClearNotificationsModal';

export default function VendorNotificationsPage() {
    const { vendorProfile } = useVendorProfile();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    const {
        notifications,
        loading,
        hasMore,
        loadMore,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        unreadCount,
        total,
        isPushEnabled,
        isPushSupported,
        subscribe
    } = useNotificationManager({ restaurantId: vendorProfile?._id, role: 'vendor' });

    // Premium Filtering Logic
    const filteredNotifications = useMemo(() => {
        let filtered = notifications;

        if (activeTab === 'orders') {
            filtered = notifications.filter(n => n.type?.includes('order') || n.type === 'new_order');
        } else if (activeTab === 'system') {
            filtered = notifications.filter(n => !n.type?.includes('order') && n.type !== 'new_order');
        }

        if (searchQuery) {
            filtered = filtered.filter(n =>
                n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    }, [notifications, activeTab, searchQuery]);

    // Grouping Logic
    const groupedNotifications = useMemo(() => {
        if (!filteredNotifications || filteredNotifications.length === 0) return {};

        return filteredNotifications.reduce((groups, notification) => {
            const date = parseISO(notification.createdAt);
            let groupKey = 'Earlier';

            if (isToday(date)) groupKey = 'Today';
            else if (isYesterday(date)) groupKey = 'Yesterday';
            else groupKey = format(date, 'MMMM d, yyyy');

            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(notification);
            return groups;
        }, {});
    }, [filteredNotifications]);

    const getIcon = (type) => {
        switch (type) {
            case 'order_placed':
            case 'new_order':
                return <ShoppingBag className="text-orange-500" size={22} />;
            case 'order_cancelled':
                return <XCircle className="text-red-500" size={22} />;
            case 'order_ready':
            case 'order_completed':
                return <CheckCircle2 className="text-emerald-500" size={22} />;
            default:
                return <Bell className="text-indigo-500" size={22} />;
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.read) await markAsRead(notification._id);
        if (notification.url) {
            router.push(notification.url);
        } else if (notification.orderId) {
            router.push(`/vendors/orders/${notification.orderDatabaseId || notification.orderId}`);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await deleteNotification(id);
            toast.success('Notification archived');
        } catch (error) {
            toast.error('Failed to remove notification');
        }
    };

    // Premium Skeleton Loader
    const SkeletonItem = () => (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 animate-pulse flex gap-4">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-3">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-1/3" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-2/3" />
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full w-1/4" />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <div className="max-w-6xl mx-auto">

                {/* 1. Header & Navigation */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-4">
                        <button
                            onClick={() => router.back()}
                            className="group flex items-center gap-2 text-slate-400 hover:text-orange-500 transition-all font-medium text-sm"
                        >
                            <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-orange-500/30">
                                <ArrowLeft size={16} />
                            </div>
                            Go Back
                        </button>
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                                Inbox
                                {unreadCount > 0 && (
                                    <span className="ml-4 inline-flex items-center px-4 py-1.5 rounded-full bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20">
                                        {unreadCount} New
                                    </span>
                                )}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                Manage your store alerts and incoming order logs.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">

                        <button
                            onClick={refreshNotifications}
                            className="p-3 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-orange-500/30 hover:text-orange-500 transition-all active:scale-95 group shadow-sm"
                            title="Refresh Inbox"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} />
                        </button>

                        {notifications.length > 0 && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsClearModalOpen(true)}
                                    className="px-6 py-3 bg-red-500/10 text-red-500 rounded-2xl text-sm font-bold hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <Trash2 size={18} /> Clear All
                                </button>
                                <button
                                    onClick={markAllAsRead}
                                    className="px-6 py-3 bg-white dark:bg-orange-500 text-slate-900 dark:text-white rounded-2xl text-sm font-bold hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-slate-900/10 dark:shadow-white/5 flex items-center gap-2"
                                >
                                    <CheckCircle2 size={18} /> Mark All Read
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Stats Dashboard (ROBUST UX) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: 'Total Logs', value: total, color: 'indigo', icon: Bell },
                        { label: 'Unread', value: unreadCount, color: 'orange', icon: Clock },
                        { label: 'Orders', value: notifications.filter(n => n.type?.includes('order')).length, color: 'emerald', icon: ShoppingBag },
                        { label: 'System', value: notifications.filter(n => !n.type?.includes('order')).length, color: 'blue', icon: CheckCircle2 },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-3xl shadow-sm hover:border-orange-500/20 transition-all"
                        >
                            <div className={`w-10 h-10 rounded-2xl mb-4 flex items-center justify-center ${stat.color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500' :
                                stat.color === 'orange' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-500' :
                                    stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' :
                                        'bg-blue-50 dark:bg-blue-500/10 text-blue-500'
                                }`}>
                                <stat.icon size={20} />
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{stat.value}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* 3. Push Toggle Section */}
                {!isPushEnabled && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-10 p-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-[2.5rem] shadow-xl shadow-orange-500/10"
                    >
                        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[2.4rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6 text-center md:text-left">
                                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/10 rounded-3xl flex items-center justify-center text-orange-500 flex-shrink-0 animate-pulse">
                                    <Bell size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Instant Alerts</h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">Get notified of new orders even when you're not on the browser.</p>
                                </div>
                            </div>
                            <button
                                onClick={subscribe}
                                className="w-full md:w-auto px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black transition-all hover:scale-105 active:scale-95"
                            >
                                Enable Now
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* 4. Filter & Search Tabs */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    <div className="flex p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full md:w-auto shadow-sm">
                        {['all', 'orders', 'system'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab
                                    ? 'bg-slate-900 dark:bg-orange-500 text-slate-900 dark:text-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Search notifications..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-slate-400 dark:text-white"
                        />
                        <Bell className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>
                </div>

                {/* 5. Notification List Implementation */}
                <div className="space-y-10">
                    {loading && notifications.length === 0 ? (
                        <div className="grid gap-4">
                            {[1, 2, 3, 4].map(i => <SkeletonItem key={i} />)}
                        </div>
                    ) : (Object.keys(groupedNotifications).length === 0) ? (
                        <div className="py-24 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 border border-slate-200 dark:border-slate-800 shadow-inner">
                                <Bell size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Peace and Quiet</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-xs">No notifications found here. We'll alert you when something happens!</p>
                        </div>
                    ) : (
                        Object.entries(groupedNotifications).map(([group, items], groupIndex) => (
                            <div key={group} className="space-y-4">
                                <div className="flex items-center gap-4 ml-2">
                                    <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                    <h2 className="text-[10px] font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase flex items-center gap-2 whitespace-nowrap">
                                        <Calendar size={12} /> {group}
                                    </h2>
                                    <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                </div>

                                <div className="grid gap-4">
                                    <AnimatePresence mode="popLayout" initial={false}>
                                        {items.map((notification, i) => (
                                            <motion.div
                                                key={notification._id}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                                whileHover={{ y: -2 }}
                                                className={`group relative flex items-center gap-4 bg-white dark:bg-slate-800 border ${!notification.read
                                                    ? 'border-orange-500/20 ring-1 ring-orange-500/10'
                                                    : 'border-slate-100 dark:border-slate-700'
                                                    } p-4 md:p-6 rounded-[2rem] transition-all cursor-pointer shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-slate-900/5 dark:hover:shadow-white/5 active:scale-[0.99] overflow-hidden`}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                {/* Status Indicator Bar */}
                                                {!notification.read && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500" />
                                                )}

                                                {/* Icon */}
                                                <div className={`w-14 h-14 rounded-3xl flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${!notification.read
                                                    ? 'bg-orange-500/10 text-orange-500'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                                    }`}>
                                                    {getIcon(notification.type)}
                                                </div>

                                                {/* Main Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-3 mb-1.5">
                                                        <h4 className={`text-base font-black truncate tracking-tight ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">
                                                            {format(parseISO(notification.createdAt), 'h:mm aa')}
                                                        </span>
                                                    </div>

                                                    <p className={`text-sm md:text-[15px] leading-relaxed mb-3 line-clamp-2 ${!notification.read ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                                                        {notification.body}
                                                    </p>

                                                    {/* Contextual Badges */}
                                                    {(notification.customerName || notification.location) && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {notification.customerName && (
                                                                <div className="px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/10 text-[10px] font-black text-orange-600 tracking-wider uppercase flex items-center gap-1.5">
                                                                    <div className="w-1 h-1 rounded-full bg-orange-500 shadow-[0_0_4px_rgba(249,115,22,1)]" />
                                                                    {notification.customerName}
                                                                </div>
                                                            )}
                                                            {notification.location && (
                                                                <div className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 text-[10px] font-black text-indigo-600 tracking-wider uppercase flex items-center gap-1.5">
                                                                    <div className="w-1 h-1 rounded-full bg-indigo-500" />
                                                                    {notification.location}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Panel */}
                                                <div className="flex flex-col items-end gap-4 ml-2">
                                                    <button
                                                        onClick={(e) => handleDelete(e, notification._id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                                        title="Archive Log"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <div className={`p-2 rounded-xl transition-colors ${!notification.read ? 'bg-orange-50 text-orange-500' : 'text-slate-200'}`}>
                                                        <ChevronRight size={20} />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Infinite UX */}
                    {hasMore && (
                        <div className="flex justify-center pt-12">
                            <button
                                onClick={loadMore}
                                disabled={loading}
                                className="group relative px-12 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-sm tracking-widest uppercase transition-all hover:scale-105 active:scale-95 disabled:opacity-50 overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Load More Logs'}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity" />
                            </button>
                        </div>
                    )}
                </div>

                <ClearNotificationsModal 
                    isOpen={isClearModalOpen}
                    onClose={() => setIsClearModalOpen(false)}
                    onConfirm={clearAll}
                    title="Empty Inbox?"
                    message="Are you sure you want to clear all notification logs? This action is permanent."
                />
            </div>
        </div>
    );
}
