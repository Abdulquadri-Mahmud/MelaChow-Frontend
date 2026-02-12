'use client';

import { useEffect, useState } from 'react';
import { useRealtimeNotifications } from './useRealtimeNotifications';
import { usePushNotifications } from './usePushNotifications';
import axios from 'axios';

/**
 * UNIFIED NOTIFICATION MANAGER
 * Combines WebSocket, Push, and REST API
 */
export function useNotificationManager() {
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
        permission: pushPermission
    } = usePushNotifications();

    // REST API fallback
    const [apiUnreadCount, setApiUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch initial data from API
    useEffect(() => {
        fetchNotificationsFromAPI();
        fetchUnreadCountFromAPI();
    }, []);

    // Poll API when WebSocket is disconnected (fallback)
    useEffect(() => {
        if (!wsConnected) {
            console.log('📡 WebSocket disconnected - falling back to API polling');
            const interval = setInterval(fetchUnreadCountFromAPI, 30000); // Every 30s
            return () => clearInterval(interval);
        }
    }, [wsConnected]);

    const fetchNotificationsFromAPI = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/notifications/history', {
                withCredentials: true,
                params: { limit: 50 }
            });
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCountFromAPI = async () => {
        try {
            const response = await axios.get('/api/notifications/unread-count', {
                withCredentials: true
            });
            setApiUnreadCount(response.data.count || 0);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    // Intelligent count selection
    // Priority: WebSocket > API fallback
    const unreadCount = wsConnected ? wsUnreadCount : apiUnreadCount;

    // Add new WebSocket notification to local list
    useEffect(() => {
        if (wsLatestNotification) {
            setNotifications(prev => [wsLatestNotification, ...prev]);
        }
    }, [wsLatestNotification]);

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
        refreshCount: fetchUnreadCountFromAPI
    };
}
