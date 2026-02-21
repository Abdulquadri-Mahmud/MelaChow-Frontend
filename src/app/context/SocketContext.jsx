'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '@/app/lib/socketService';
import { TokenManager } from '@/app/lib/auth-token';

const SocketContext = createContext({
    isConnected: false,
    socket: null,
    unreadCount: 0,
    latestNotification: null
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [latestNotification, setLatestNotification] = useState(null);

    useEffect(() => {
        // Function to handle connection
        const connect = async () => {
            const token = TokenManager.getToken();
            if (token) {
                socketService.connect(token);

                // Fetch initial unread count to seed the global state
                try {
                    const response = await fetch('/api/notifications/unread-count', {
                        credentials: 'include',
                        headers: { 'Accept': 'application/json' }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const count = data.count ?? data.data?.count ?? 0;
                        setUnreadCount(count);
                    }
                } catch (error) {
                    console.error('Failed to fetch initial unread count:', error);
                }

                // Set up basic listeners
                socketService.onNewNotification((notification) => {
                    setLatestNotification(notification);
                    // Force refresh unread count if notification is new
                    if (!notification.read) {
                        setUnreadCount(prev => prev + 1);
                    }
                });

                socketService.onNotificationCountUpdate((data) => {
                    setUnreadCount(data.count);
                });

                socketService.onNewOrder((order) => {
                    // This is specifically for vendors
                    console.log('🆕 New order received via socket:', order);
                    // Check if we should also show a toast here if new_notification didn't handle it
                    setLatestNotification({
                        _id: `temp-${Date.now()}`,
                        title: 'New Order Received!',
                        body: `Order #${order.orderNumber || order._id?.slice(-6)} from ${order.customerName || 'Customer'}`,
                        type: 'new_order',
                        orderId: order._id,
                        createdAt: new Date().toISOString(),
                        read: false
                    });
                });

                setIsConnected(true);
            }
        };

        // Connect initially
        connect();

        // Monitor connection status
        const interval = setInterval(() => {
            const status = socketService.getConnectionStatus();
            setIsConnected(status.isConnected);

            // If not connected but we have a token, try to connect
            if (!status.isConnected && TokenManager.getToken()) {
                connect();
            }
        }, 5000);

        return () => {
            clearInterval(interval);
            socketService.removeAllListeners();
            socketService.disconnect();
        };
    }, []);

    const value = {
        isConnected,
        socket: socketService.socket,
        unreadCount,
        latestNotification
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
