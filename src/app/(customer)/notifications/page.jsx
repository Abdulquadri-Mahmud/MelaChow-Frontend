'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Package, Tag, Truck, CheckCircle, Clock, Trash2, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header2 from '@/app/components/App_Header/Header2';
import { useUserStorage } from '@/app/hooks/useUserStorage';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
    const router = useRouter();
    const { user } = useUserStorage();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'orders', 'promos', 'updates'

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/notifications/history', {
                withCredentials: true
            });
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await axios.patch(`/api/notifications/${notificationId}/read`, {}, {
                withCredentials: true
            });
            setNotifications(prev =>
                prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.patch('/api/notifications/read-all', {}, {
                withCredentials: true
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await axios.delete(`/api/notifications/${notificationId}`, {
                withCredentials: true
            });
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
            toast.success('Notification deleted');
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const clearAllNotifications = async () => {
        if (!window.confirm('Are you sure you want to delete all notifications? This cannot be undone.')) return;

        try {
            await axios.delete('/api/notifications/clear-all', {
                withCredentials: true
            });
            setNotifications([]);
            toast.success('All notifications cleared');
        } catch (error) {
            toast.error('Failed to clear notifications');
        }
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification._id);

        // Navigate based on notification type
        if (notification.type?.includes('order') && notification.orderId) {
            router.push(`/track-orders/${notification.orderId}`);
        } else if (notification.url) {
            router.push(notification.url);
        }
    };

    const getNotificationIcon = (type) => {
        if (type?.includes('order')) return <Package className="text-orange-500" size={20} />;
        if (type?.includes('promo') || type?.includes('discount')) return <Tag className="text-green-500" size={20} />;
        if (type?.includes('delivery')) return <Truck className="text-blue-500" size={20} />;
        return <Bell className="text-gray-500" size={20} />;
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'orders') return n.type?.includes('order');
        if (filter === 'promos') return n.type?.includes('promo') || n.type?.includes('discount');
        if (filter === 'updates') return !n.type?.includes('order') && !n.type?.includes('promo');
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
            <Header2 />

            <div className="max-w-2xl mx-auto p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Notifications</h1>
                        {unreadCount > 0 && (
                            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                                {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <div className="flex items-center gap-4">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wider"
                                >
                                    Mark All Read
                                </button>
                            )}
                            <button
                                onClick={clearAllNotifications}
                                className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider"
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['all', 'orders', 'promos', 'updates'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${filter === f
                                    ? 'bg-orange-500 text-white shadow-md'
                                    : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800 hover:border-orange-300'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 animate-pulse">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-3/4" />
                                        <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded w-full" />
                                        <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="text-gray-400 dark:text-zinc-500" size={32} />
                        </div>
                        <p className="text-gray-500 dark:text-zinc-400 font-medium">No notifications yet</p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                            You'll see updates about your orders here
                        </p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredNotifications.map((notification, index) => (
                            <motion.div
                                key={notification._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleNotificationClick(notification)}
                                className={`rounded-2xl p-4 border cursor-pointer transition-all hover:shadow-md group ${notification.read
                                    ? 'bg-zinc-50 dark:bg-zinc-950 border-gray-100 dark:border-zinc-800'
                                    : 'bg-white dark:bg-zinc-900 border-orange-200 dark:border-orange-500/30'
                                    }`}
                            >
                                <div className="flex gap-3">
                                    {/* Icon */}
                                    <div className={`p-2 rounded-xl h-fit ${notification.read
                                        ? 'bg-gray-100 dark:bg-zinc-800'
                                        : 'bg-orange-100 dark:bg-orange-500/20'
                                        }`}>
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className={`font-bold text-sm ${notification.read
                                                ? 'text-gray-700 dark:text-zinc-400'
                                                : 'text-gray-900 dark:text-white'
                                                }`}>
                                                {notification.title}
                                            </h3>
                                            {!notification.read && (
                                                <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1" />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1 line-clamp-2">
                                            {notification.body}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                                                {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification._id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                            >
                                                <Trash2 size={14} className="text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
