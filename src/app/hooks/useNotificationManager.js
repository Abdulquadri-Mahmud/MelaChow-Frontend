'use client';

import { useEffect, useState } from 'react';
import { useRealtimeNotifications } from './useRealtimeNotifications';
import { usePushNotifications } from './usePushNotifications';
import axios from 'axios';
import socketService from '@/app/lib/socketService';

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
            if (action === 'subscribe') return `${base}/subscribe`;
            if (action === 'unsubscribe') return `${base}/unsubscribe`;
            return base;
        }

        if (role === 'admin') {
            const base = '/api/admin/notifications';
            if (action === 'history') return `${base}/history`;
            if (action === 'subscribe') return `${base}/subscribe`;
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
        isConnected: wsConnected
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

    // REST API fallback
    const [apiUnreadCount, setApiUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch initial data from API
    useEffect(() => {
        fetchNotificationsFromAPI();
        if (role === 'user') {
            fetchUnreadCountFromAPI();
        }
    }, [restaurantId, role]);

    // Poll API when WebSocket is disconnected (fallback)
    useEffect(() => {
        if (!wsConnected) {
            console.log(`📡 WebSocket disconnected - falling back to ${role} API polling`);
            const interval = setInterval(() => {
                fetchNotificationsFromAPI();
                if (role === 'user') fetchUnreadCountFromAPI();
            }, 30000); // Every 30s
            return () => clearInterval(interval);
        }
    }, [wsConnected, restaurantId, role]);

    const fetchNotificationsFromAPI = async () => {
        setLoading(true);
        try {
            const response = await axios.get(getEndpoint('history'), {
                withCredentials: true,
                params: {
                    limit: 50,
                    ...(restaurantId && { restaurantId })
                }
            });

            const data = response.data.notifications || response.data.data?.notifications || response.data.data || [];
            setNotifications(data);

            // For vendors, count is included in history
            if (role === 'vendor') {
                const count = response.data.unreadCount ?? response.data.count ?? response.data.unread_count ??
                    response.data.data?.unreadCount ?? response.data.data?.count ?? 0;
                setApiUnreadCount(count);
            }
        } catch (error) {
            console.error(`Failed to fetch ${role} notifications:`, error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCountFromAPI = async () => {
        if (role !== 'user') return; // Only user has explicit unread-count endpoint in reference
        try {
            const response = await axios.get(getEndpoint('unread-count'), {
                withCredentials: true,
                params: {
                    ...(restaurantId && { restaurantId })
                }
            });
            const count = response.data?.count ?? response.data?.data?.count ?? response.data?.data ?? 0;
            setApiUnreadCount(count);
        } catch (error) {
            console.error(`Failed to fetch ${role} unread count:`, error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            // For user role, use the specific pattern :id/read
            if (role === 'user') {
                await axios.patch(getEndpoint('mark-read', notificationId), {}, {
                    withCredentials: true
                });
            } else {
                // If vendor/admin don't have separate PATCH for single read in reference,
                // we might need to skip or use a generic one if it exists.
                // The reference doesn't specify mark-read for vendor/admin explicitly.
                // I'll assume they might use the user-like pattern or we skip for now.
                console.warn(`Mark as read not explicitly defined for ${role} in reference`);
            }

            setNotifications(prev => prev.map(n =>
                n._id === notificationId ? { ...n, read: true } : n
            ));

            if (role === 'user') fetchUnreadCountFromAPI();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            if (role === 'user') {
                await axios.patch(getEndpoint('mark-all-read'), {}, {
                    withCredentials: true
                });
            } else {
                console.warn(`Mark all as read not explicitly defined for ${role} in reference`);
            }

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setApiUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
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
        } catch (error) {
            console.error('Failed to clear all notifications:', error);
        }
    };

    // Add new WebSocket notification to local list and increment count
    useEffect(() => {
        if (wsLatestNotification) {
            // Check if notification belongs to this restaurant if restaurantId is provided
            // For now we add it and increment the local count
            setNotifications(prev => {
                // Prevent duplicate entries if the socket and API overlap
                const exists = prev.some(n => n._id === wsLatestNotification._id);
                if (exists) return prev;
                return [wsLatestNotification, ...prev];
            });

            if (!wsLatestNotification.read) {
                setApiUnreadCount(prev => prev + 1);
            }
        }
    }, [wsLatestNotification]);

    // Intelligent count selection
    // Priority: If it's a general notification bell (no restaurantId), use global socket count.
    // If it's restaurant-specific, use the local apiUnreadCount (which is also live-updated by wsLatestNotification).
    const unreadCount = (wsConnected && !restaurantId) ? wsUnreadCount : apiUnreadCount;


    return {
        // Notification data
        notifications,
        unreadCount,
        latestNotification: wsLatestNotification,
        loading,

        // Connection states
        isRealtimeConnected: wsConnected,
        isPushEnabled: !!pushSubscription,
        isPushSupported: pushSupported,
        pushPermission,

        // Actions
        refreshNotifications: fetchNotificationsFromAPI,
        refreshCount: fetchUnreadCountFromAPI,
        markAsRead,
        markAllAsRead,
        clearAll,
        subscribe,
        unsubscribe
    };
}
