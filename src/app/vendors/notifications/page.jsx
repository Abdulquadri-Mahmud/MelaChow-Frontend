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
    ChevronLeft,
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
        } else if (activeTab === 'unread') {
            filtered = notifications.filter(n => !n.read);
        } else if (activeTab === 'read') {
            filtered = notifications.filter(n => n.read);
        }

        if (searchQuery) {
            filtered = filtered.filter(n =>
                n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Always show unread notifications at the top of their respective groups
        return filtered.sort((a, b) => {
            if (a.read === b.read) return 0;
            return a.read ? 1 : -1;
        });
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
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 p-4">
            <div className="max-w-5xl mx-auto space-y-4">

                {/* 1. Header & Navigation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2 bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800 rounded-md hover:text-orange-600 transition-all active:scale-95 group"
                            title="Go Back"
                        >
                            <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                        </button>
                        <div className="space-y-0.5">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                Inbox
                                {unreadCount > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest">
                                        {unreadCount} New
                                    </span>
                                )}
                            </h1>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-widest">
                                Manage store alerts and incoming order logs.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={refreshNotifications}
                            className="p-2.5 bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800 rounded-md hover:text-orange-600 transition-all active:scale-95 group"
                            title="Refresh Inbox"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} />
                        </button>

                        {notifications.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsClearModalOpen(true)}
                                    className="px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> Clear All
                                </button>
                                <button
                                    onClick={markAllAsRead}
                                    className="px-4 py-2.5 bg-orange-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <CheckCircle2 size={14} /> Mark All Read
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Stats Dashboard */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Logs', value: total, color: 'indigo', icon: Bell },
                        { label: 'Unread', value: unreadCount, color: 'orange', icon: Clock },
                        { label: 'Orders', value: notifications.filter(n => n.type?.includes('order')).length, color: 'emerald', icon: ShoppingBag },
                        { label: 'System', value: notifications.filter(n => !n.type?.includes('order')).length, color: 'blue', icon: CheckCircle2 },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-md hover:border-orange-500/30 transition-all"
                        >
                            <div className={`w-8 h-8 rounded-md mb-3 flex items-center justify-center ${
                                stat.color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500' :
                                stat.color === 'orange' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600' :
                                stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' :
                                'bg-blue-50 dark:bg-blue-500/10 text-blue-500'
                            }`}>
                                <stat.icon size={16} />
                            </div>
                            <div className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{stat.value}</div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 leading-none">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* 3. Push Toggle Section */}
                {!isPushEnabled && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-orange-600 p-px rounded-md"
                    >
                        <div className="bg-white dark:bg-slate-950 rounded-[5px] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-center md:text-left">
                                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-600/10 rounded-md flex items-center justify-center text-orange-600 flex-shrink-0">
                                    <Bell size={24} />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Instant Alerts</h3>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">Enable push notifications for real-time order logs.</p>
                                </div>
                            </div>
                            <button
                                onClick={subscribe}
                                className="w-full md:w-auto px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-md text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-none"
                            >
                                Enable Now
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* 4. Filter & Search Tabs */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex p-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md w-full md:w-auto">
                        {['all', 'unread', 'read', 'orders', 'system'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 md:flex-none px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'bg-orange-600 text-white shadow-none'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-72">
                        <input
                            type="text"
                            placeholder="SEARCH LOGS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md text-[10px] font-black uppercase tracking-widest outline-none focus:border-orange-600 transition-all dark:text-white"
                        />
                        <Bell className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    </div>
                </div>

                {/* 5. Notification List Implementation */}
                <div className="space-y-4">
                    {loading && notifications.length === 0 ? (
                        <div className="grid gap-3">
                            {[1, 2, 3, 4].map(i => <SkeletonItem key={i} />)}
                        </div>
                    ) : (Object.keys(groupedNotifications).length === 0) ? (
                        <div className="py-12 bg-white dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-md flex items-center justify-center text-slate-300 dark:text-slate-700 mb-4 border border-slate-100 dark:border-slate-800">
                                <Bell size={24} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Peace and Quiet</h3>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs uppercase tracking-widest leading-relaxed">No notification logs found in this category.</p>
                        </div>
                    ) : (
                        Object.entries(groupedNotifications).map(([group, items], groupIndex) => (
                            <div key={group} className="space-y-3">
                                <div className="flex items-center gap-3 ml-1">
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                    <h2 className="text-[9px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5 whitespace-nowrap">
                                        <Calendar size={10} /> {group}
                                    </h2>
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                </div>

                                <div className="grid gap-2.5">
                                    <AnimatePresence mode="popLayout" initial={false}>
                                        {items.map((notification, i) => (
                                            <motion.div
                                                key={notification._id}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                                whileHover={{ y: -2 }}
                                                className={`group relative flex items-center gap-4 bg-white dark:bg-slate-900 border ${!notification.read
                                                    ? 'border-orange-500/30'
                                                    : 'border-slate-100 dark:border-slate-800'
                                                    } p-4 rounded-md transition-all cursor-pointer shadow-none active:scale-[0.99] overflow-hidden`}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                {/* Status Indicator Bar */}
                                                {!notification.read && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500" />
                                                )}

                                                {/* Icon */}
                                                <div className={`w-12 h-12 rounded-md flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 duration-500 ${!notification.read
                                                    ? 'bg-orange-50 dark:bg-orange-600/10 text-orange-600'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                                    }`}>
                                                    {getIcon(notification.type)}
                                                </div>

                                                {/* Main Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-3 mb-1">
                                                        <h4 className={`text-sm font-black truncate tracking-tight uppercase ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="text-[9px] font-black uppercase text-slate-400 whitespace-nowrap bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                                                            {format(parseISO(notification.createdAt), 'h:mm aa')}
                                                        </span>
                                                    </div>

                                                    <p className={`text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-2 line-clamp-2 ${!notification.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                        {notification.body}
                                                    </p>

                                                    {/* Contextual Badges */}
                                                    {(notification.customerName || notification.location) && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {notification.customerName && (
                                                                <div className="px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-600/5 border border-orange-100 dark:border-orange-600/10 text-[8px] font-black text-orange-600 tracking-widest uppercase flex items-center gap-1.5 leading-none">
                                                                    <div className="w-1 h-1 rounded-full bg-orange-600" />
                                                                    {notification.customerName}
                                                                </div>
                                                            )}
                                                            {notification.location && (
                                                                <div className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 text-[8px] font-black text-indigo-600 tracking-widest uppercase flex items-center gap-1.5 leading-none">
                                                                    <div className="w-1 h-1 rounded-full bg-indigo-500" />
                                                                    {notification.location}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Panel */}
                                                <div className="flex items-center gap-2 ml-2">
                                                    <button
                                                        onClick={(e) => handleDelete(e, notification._id)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-all active:scale-90"
                                                        title="Archive Log"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <div className={`transition-colors ${!notification.read ? 'text-orange-600' : 'text-slate-300'}`}>
                                                        <ChevronRight size={16} />
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
                        <div className="flex justify-center pt-8">
                            <button
                                onClick={loadMore}
                                disabled={loading}
                                className="group relative px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-md font-black text-[10px] tracking-widest uppercase transition-all hover:scale-105 active:scale-95 disabled:opacity-50 overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2.5">
                                    {loading ? <RefreshCw className="animate-spin" size={14} /> : 'Load More Logs'}
                                </span>
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
