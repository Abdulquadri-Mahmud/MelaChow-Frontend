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
        const connect = () => {
            const token = TokenManager.getToken();
            if (token) {
                socketService.connect(token);

                // Set up basic listeners
                socketService.onNewNotification((notification) => {
                    setLatestNotification(notification);
                });

                socketService.onNotificationCountUpdate((data) => {
                    setUnreadCount(data.count);
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
