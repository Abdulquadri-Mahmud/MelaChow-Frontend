'use client';

import { useEffect, useState } from 'react';
import { useRealtimeNotifications } from './useRealtimeNotifications';
import { usePushNotifications } from './usePushNotifications';
import axios from 'axios';
import socketService from '@/app/lib/socketService';
import adminApi from '@/app/lib/adminApi';

/**
 * UNIFIED NOTIFICATION MANAGER
 * Combines WebSocket, Push, and REST API
 */
export function useNotificationManager(options = {}) {
    const { restaurantId, role: providedRole } = options;

    // Detect role
    const role = providedRole || (restaurantId ? 'vendor' : 'user');

    // URL Generators based on role
    const getEndpoint = (action, id = null) => {
        if (role === 'vendor') {
            const base = '/api/vendors/notifications';
            if (action === 'history') return `${base}/history`;
            if (action === 'unread-count') return `${base}/unread-count`;
            if (action === 'mark-read') return `${base}/${id}/read`;
            if (action === 'mark-all-read') return `${base}/read-all`;
            if (action === 'delete') return `${base}/${id}`;
            if (action === 'subscribe') return `${base}/subscribe`;
            if (action === 'unsubscribe') return `${base}/unsubscribe`;
            return base;
        }

        if (role === 'admin') {
            const base = '/api/admin/notifications';
            if (action === 'unread-count') return `${base}/unread-count`;
            if (action === 'history') return `${base}/history`;
            if (action === 'subscribe') return `${base}/subscribe`;
            if (action === 'mark-read') return `${base}/${id}/read`;
            if (action === 'mark-all-read') return `${base}/read-all`;
            return base;
        }

        // Default: User
        const base = '/api/notifications';
        if (action === 'history') return `${base}/history`;
        if (action === 'unread-count') return `${base}/unread-count`;
        if (action === 'subscribe') return `${base}/subscribe`;
        if (action === 'unsubscribe') return `${base}/unsubscribe`;
        if (action === 'mark-read') return `${base}/${id}/read`;
        if (action === 'mark-all-read') return `${base}/read-all`;
        if (action === 'clear-all') return `${base}/clear-all`;
        return base;
    };

    // Real-time (WebSocket)
    const {
        unreadCount: wsUnreadCount,
        latestNotification: wsLatestNotification,
        isConnected: wsConnected,
        refreshUnreadCount
    } = useRealtimeNotifications();

    // Subscribe to restaurant events if vendor
    useEffect(() => {
        if (role === 'vendor' && restaurantId && wsConnected) {
            socketService.subscribeToRestaurant(restaurantId);
        }
    }, [role, restaurantId, wsConnected]);

    // Push Notifications
    const {
        subscription: pushSubscription,
        isSupported: pushSupported,
        permission: pushPermission,
        subscribe,
        unsubscribe
    } = usePushNotifications(role);

    // REST API fallback & state
    const [apiUnreadCount, setApiUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    // Fetch initial data from API
    useEffect(() => {
        fetchNotificationsFromAPI(true);
        fetchUnreadCountFromAPI();
    }, [restaurantId, role]);

    // Poll API when WebSocket is disconnected (fallback)
    useEffect(() => {
        if (!wsConnected) {
            console.log(`📡 WebSocket disconnected - falling back to ${role} API polling`);
            const interval = setInterval(() => {
                fetchNotificationsFromAPI(true);
                fetchUnreadCountFromAPI();
            }, 30000); // Every 30s
            return () => clearInterval(interval);
        }
    }, [wsConnected, restaurantId, role]);

    // Listen for custom events to sync across tabs/instances
    useEffect(() => {
        const handleSync = (event) => {
            if (event.detail && event.detail._id) {
                setNotifications(prev => {
                    const exists = prev.some(n => n._id === event.detail._id);
                    if (exists) return prev;
                    return [event.detail, ...prev];
                });
                setTotal(prev => prev + 1);
            } else {
                // If it's a generic update (like a mark as read), refresh the unread count
                fetchUnreadCountFromAPI();
                // Optionally refresh notifications if we're on the history page
                if (window.location.pathname.includes('/notifications')) {
                    fetchNotificationsFromAPI(true);
                }
            }
        };

        window.addEventListener('notifications:updated', handleSync);
        return () => window.removeEventListener('notifications:updated', handleSync);
    }, [restaurantId, role]);

    const fetchNotificationsFromAPI = async (reset = false) => {
        setLoading(true);
        const targetPage = reset ? 1 : page + 1;
        try {
            let responseData;
            if (role === 'admin') {
                responseData = await adminApi.getAdminNotifications({
                    limit: 15,
                    page: targetPage
                });
            } else {
                const response = await axios.get(getEndpoint('history'), {
                    withCredentials: true,
                    params: {
                        limit: 15,
                        page: targetPage,
                        ...(restaurantId && { restaurantId })
                    }
                });
                responseData = response.data;
            }

            const data = responseData.notifications || responseData.data?.notifications || responseData.data || [];
            const newTotal = responseData.total ?? responseData.data?.total ?? data.length;
            const newHasMore = responseData.hasMore ?? responseData.data?.hasMore ?? (data.length === 15);

            if (reset) {
                setNotifications(data);
                setPage(1);
            } else {
                setNotifications(prev => [...prev, ...data]);
                setPage(targetPage);
            }

            setHasMore(newHasMore);
            setTotal(newTotal);

            // Update unread count if provided in history
            const count = responseData.unreadCount ?? responseData.count ?? responseData.unread_count ??
                responseData.data?.unreadCount ?? responseData.data?.count;

            if (count !== undefined) {
                setApiUnreadCount(count);
                if (refreshUnreadCount) refreshUnreadCount();
            }
        } catch (error) {
            console.error(`Failed to fetch ${role} notifications:`, error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCountFromAPI = async () => {
        try {
            let responseData;
            if (role === 'admin') {
                responseData = await adminApi.getAdminUnreadCount();
            } else {
                const response = await axios.get(getEndpoint('unread-count'), {
                    withCredentials: true,
                    params: {
                        ...(restaurantId && { restaurantId })
                    }
                });
                responseData = response.data;
            }
            const count = responseData.unreadCount ?? responseData.count ?? responseData?.data?.count ?? responseData?.data ?? 0;
            setApiUnreadCount(count);
            if (refreshUnreadCount) refreshUnreadCount();
        } catch (error) {
            console.error(`Failed to fetch ${role} unread count:`, error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await axios.patch(getEndpoint('mark-read', notificationId), {}, {
                withCredentials: true
            });

            setNotifications(prev => prev.map(n =>
                n._id === notificationId ? { ...n, read: true } : n
            ));

            setApiUnreadCount(prev => Math.max(0, prev - 1));
            if (refreshUnreadCount) refreshUnreadCount();

            // Notify other instances
            window.dispatchEvent(new CustomEvent('notifications:updated', { detail: { action: 'mark-read', id: notificationId } }));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.patch(getEndpoint('mark-all-read'), {}, {
                withCredentials: true
            });

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setApiUnreadCount(0);
            if (refreshUnreadCount) refreshUnreadCount();

            // Notify other instances
            window.dispatchEvent(new CustomEvent('notifications:updated', { detail: { action: 'mark-all-read' } }));
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await axios.delete(getEndpoint('delete', notificationId), {
                withCredentials: true
            });

            setNotifications(prev => {
                const filtered = prev.filter(n => n._id !== notificationId);
                const deleted = prev.find(n => n._id === notificationId);
                if (deleted && !deleted.read) {
                    setApiUnreadCount(prevCount => Math.max(0, prevCount - 1));
                    if (refreshUnreadCount) refreshUnreadCount();
                }
                return filtered;
            });

            setTotal(prev => Math.max(0, prev - 1));

            // Notify other instances
            window.dispatchEvent(new CustomEvent('notifications:updated', { detail: { action: 'delete', id: notificationId } }));
        } catch (error) {
            console.error('Failed to delete notification:', error);
            throw error;
        }
    };

    const clearAll = async () => {
        if (role !== 'user') return;
        try {
            await axios.delete(getEndpoint('clear-all'), {
                withCredentials: true
            });
            setNotifications([]);
            setApiUnreadCount(0);
            setTotal(0);
            setHasMore(false);
            if (refreshUnreadCount) refreshUnreadCount();
            window.dispatchEvent(new CustomEvent('notifications:updated', { detail: { action: 'clear-all' } }));
        } catch (error) {
            console.error('Failed to clear all notifications:', error);
        }
    };

    // Unified count management
    const unreadCount = wsConnected ? wsUnreadCount : apiUnreadCount;

    return {
        // Notification data
        notifications,
        unreadCount,
        latestNotification: wsLatestNotification,
        loading,
        hasMore,
        total,

        // Connection states
        isRealtimeConnected: wsConnected,
        isPushEnabled: !!pushSubscription,
        isPushSupported: pushSupported,
        pushPermission,

        // Actions
        refreshNotifications: () => fetchNotificationsFromAPI(true),
        loadMore: () => fetchNotificationsFromAPI(false),
        refreshCount: fetchUnreadCountFromAPI,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        subscribe,
        unsubscribe
    };
}

