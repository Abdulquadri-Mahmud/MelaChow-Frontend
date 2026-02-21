'use client';

import { useEffect, useState } from 'react';
import { useRealtimeNotifications } from './useRealtimeNotifications';
import { usePushNotifications } from './usePushNotifications';
import axios from 'axios';

/**
 * UNIFIED NOTIFICATION MANAGER
 * Combines WebSocket, Push, and REST API
 */
export function useNotificationManager(options = {}) {
    const { restaurantId, role: providedRole } = options;

    // Detect role
    let role = providedRole || 'user';
    if (!providedRole && restaurantId) role = 'vendor';
    // Potential further inference from path could be added if needed

    const apiBase = role === 'vendor' ? '/api/vendors/notifications' :
        role === 'admin' ? '/api/admin/notifications' :
            '/api/notifications';

    // Real-time (WebSocket)
    const {
        unreadCount: wsUnreadCount,
        latestNotification: wsLatestNotification,
        isConnected: wsConnected
    } = useRealtimeNotifications();

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
        fetchUnreadCountFromAPI();
    }, [restaurantId, role]);

    // Poll API when WebSocket is disconnected (fallback)
    useEffect(() => {
        if (!wsConnected) {
            console.log(`📡 WebSocket disconnected - falling back to ${role} API polling`);
            const interval = setInterval(fetchUnreadCountFromAPI, 30000); // Every 30s
            return () => clearInterval(interval);
        }
    }, [wsConnected, restaurantId, role]);

    const fetchNotificationsFromAPI = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${apiBase}/history`, {
                withCredentials: true,
                params: {
                    limit: 50,
                    ...(restaurantId && { restaurantId })
                }
            });
            setNotifications(response.data.notifications || response.data.data || []);
        } catch (error) {
            console.error(`Failed to fetch ${role} notifications:`, error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCountFromAPI = async () => {
        try {
            const response = await axios.get(`${apiBase}/unread-count`, {
                withCredentials: true,
                params: {
                    ...(restaurantId && { restaurantId })
                }
            });
            // Handle multiple possible response structures
            const count = response.data?.count ?? response.data?.data?.count ?? response.data?.data ?? 0;
            setApiUnreadCount(count);
        } catch (error) {
            console.error(`Failed to fetch ${role} unread count:`, error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await axios.patch(`${apiBase}/mark-read/${notificationId}`, {}, {
                withCredentials: true
            });
            setNotifications(prev => prev.map(n =>
                n._id === notificationId ? { ...n, read: true } : n
            ));
            // Trigger count refresh
            fetchUnreadCountFromAPI();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.patch(`${apiBase}/mark-all-read`, {}, {
                withCredentials: true,
                params: {
                    ...(restaurantId && { restaurantId })
                }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setApiUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
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
        subscribe,
        unsubscribe
    };
}
