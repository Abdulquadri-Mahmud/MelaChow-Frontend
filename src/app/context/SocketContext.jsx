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

import { usePathname } from 'next/navigation';

export const SocketProvider = ({ children }) => {
    const pathname = usePathname();
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [latestNotification, setLatestNotification] = useState(null);

    // Determine role based on path
    const getRoleFromPath = (path) => {
        if (path?.startsWith('/vendors')) return 'vendor';
        if (path?.startsWith('/admin')) return 'admin';
        return 'user';
    };

    const role = getRoleFromPath(pathname);

    useEffect(() => {
        // Function to handle connection
        const connect = async () => {
            const token = TokenManager.getToken(role);
            if (token) {
                socketService.connect(token);

                // Fetch initial unread count to seed the global state
                const apiBase = role === 'vendor' ? '/api/vendors/notifications' :
                    role === 'admin' ? '/api/admin/notifications' :
                        '/api/notifications';

                try {
                    const response = await fetch(`${apiBase}/unread-count`, {
                        credentials: 'include',
                        headers: { 'Accept': 'application/json' }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const count = data.count ?? data.data?.count ?? 0;
                        setUnreadCount(count);
                    }
                } catch (error) {
                    console.error(`Failed to fetch initial ${role} unread count:`, error);
                }

                // Set up basic listeners
                socketService.onNewNotification((notification) => {
                    setLatestNotification(notification);
                    if (!notification.read) {
                        setUnreadCount(prev => prev + 1);
                    }
                });

                socketService.onNotificationCountUpdate((data) => {
                    setUnreadCount(data.count);
                });

                socketService.onNewOrder((order) => {
                    if (role === 'vendor') {
                        console.log('🆕 New order received via socket:', order);
                        setLatestNotification({
                            _id: `temp-${Date.now()}`,
                            title: 'New Order Received!',
                            body: `Order #${order.orderNumber || order._id?.slice(-6)} from ${order.customerName || 'Customer'}`,
                            type: 'new_order',
                            orderId: order._id,
                            createdAt: new Date().toISOString(),
                            read: false
                        });
                    }
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
            if (!status.isConnected && TokenManager.getToken(role)) {
                connect();
            }
        }, 5000);

        return () => {
            clearInterval(interval);
            socketService.removeAllListeners();
            socketService.disconnect();
        };
    }, [role]); // Reconnect if role changes (e.g. switching between dashboard and store)

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
