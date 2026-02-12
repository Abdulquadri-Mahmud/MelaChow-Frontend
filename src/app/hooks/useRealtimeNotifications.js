'use client';

import { useEffect, useState } from 'react';
import socketService from '@/app/lib/socketService';
import { TokenManager } from '@/app/lib/auth-token';

/**
 * Hook for real-time notifications via Socket.IO
 */
export function useRealtimeNotifications() {
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [latestNotification, setLatestNotification] = useState(null);

    useEffect(() => {
        // Get token and connect
        const token = TokenManager.getToken();

        if (token) {
            socketService.connect(token);

            // Update connection status
            const checkConnection = () => {
                const status = socketService.getConnectionStatus();
                setIsConnected(status.isConnected);
            };

            // Check immediately and then periodically
            checkConnection();
            const interval = setInterval(checkConnection, 5000);

            // Listen for new notifications
            socketService.onNewNotification((notification) => {
                console.log('[Real-time] New notification:', notification);
                setLatestNotification(notification);
            });

            // Listen for count updates
            socketService.onNotificationCountUpdate((data) => {
                console.log('[Real-time] Count update:', data.count);
                setUnreadCount(data.count);
            });

            return () => {
                clearInterval(interval);
                socketService.removeAllListeners();
                socketService.disconnect();
            };
        }
    }, []);

    return {
        isConnected,
        unreadCount,
        latestNotification
    };
}
