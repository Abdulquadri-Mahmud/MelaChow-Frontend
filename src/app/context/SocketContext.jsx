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
        if (path?.startsWith('/rider')) return 'rider';
        return 'user';
    };

    const role = getRoleFromPath(pathname);

    const fetchUnreadCount = async () => {
        const apiBase = role === 'vendor' ? '/api/vendors/notifications' :
            role === 'admin' ? '/api/admin/notifications' :
                role === 'rider' ? '/api/riders/notifications' :
                    '/api/notifications';

        try {
            // Refined fetching based on role-specific endpoints
            const fetchUrl = (role === 'vendor' || role === 'rider') ? `${apiBase}/history` : `${apiBase}/unread-count`;

            const response = await fetch(fetchUrl, {
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                let count = 0;

                if (role === 'vendor' || role === 'rider') {
                    count = data.unreadCount ?? data.count ?? data.data?.unreadCount ?? data.data?.count ?? 0;
                } else {
                    count = data.count ?? data.data?.count ?? 0;
                }

                setUnreadCount(count);
                return count;
            }
        } catch (error) {
            console.error(`Failed to fetch ${role} unread count:`, error);
        }
        return 0;
    };

    useEffect(() => {
        // Function to handle connection
        const connect = async () => {
            const token = TokenManager.getToken(role);
            if (token) {
                socketService.connect(token);

                // Fetch initial unread count
                await fetchUnreadCount();

                // Set up basic listeners
                socketService.onNewNotification((notification) => {
                    setLatestNotification(notification);
                    if (!notification.read) {
                        setUnreadCount(prev => prev + 1);
                    }
                    // Dispatch custom event for notifications list update
                    window.dispatchEvent(new CustomEvent('notifications:updated', { detail: notification }));
                });

                socketService.onNotificationCountUpdate((data) => {
                    setUnreadCount(data.count);
                });

                socketService.onNewOrder((order) => {
                    if (role === 'vendor') {
                        console.log('🆕 New order received via socket:', order);
                        const tempNotification = {
                            _id: `temp-${Date.now()}`,
                            title: 'New Order Received!',
                            body: `Order #${order.orderNumber || order._id?.slice(-6)} from ${order.customerName || 'Customer'}`,
                            type: 'new_order',
                            orderId: order._id,
                            createdAt: new Date().toISOString(),
                            read: false,
                            customerName: order.customerName,
                            location: order.deliveryAddress?.address
                        };
                        setLatestNotification(tempNotification);
                        setUnreadCount(prev => prev + 1);
                        window.dispatchEvent(new CustomEvent('notifications:updated', { detail: tempNotification }));
                    }
                });

                // Rider specific event
                const handleAssignment = (data) => {
                    if (role === 'rider') {
                        console.log('🛵 Order assigned to rider:', data);
                        const assignmentNotification = {
                            _id: `assign-${Date.now()}`,
                            title: 'New Job Assigned!',
                            body: `You have a new pickup at ${data.vendorName || data.restaurantName || 'the restaurant'}`,
                            type: 'order_assigned',
                            orderId: data.orderId,
                            data: data,
                            createdAt: new Date().toISOString(),
                            read: false
                        };
                        setLatestNotification(assignmentNotification);
                        setUnreadCount(prev => prev + 1);
                        window.dispatchEvent(new CustomEvent('notifications:updated', { detail: assignmentNotification }));

                        // Play native notification sound
                        try {
                            const audio = new Audio('/sounds/notification.mp3');
                            audio.play().catch(e => console.log('Audio play prevented by browser', e));
                        } catch (e) { }

                        // Toast from Socket Context
                        import('react-hot-toast').then(({ default: toast }) => {
                            toast.success('New Order Assigned! 🛵', { duration: 8000 });
                        });

                        // Also trigger a global event for the rider dashboard to react
                        window.dispatchEvent(new CustomEvent('rider:new_assignment', { detail: data }));
                    }
                };

                socketService.onOrderAssigned(handleAssignment);
                socketService.socket?.on('ORDER_ASSIGNED_TO_RIDER', handleAssignment);

                setIsConnected(true);

                // Listen for connection state changes to update context state immediately
                socketService.socket?.on('connect', () => setIsConnected(true));
                socketService.socket?.on('disconnect', () => setIsConnected(false));
            }
        };

        connect();

        const interval = setInterval(() => {
            const status = socketService.getConnectionStatus();
            setIsConnected(status.isConnected);

            if (!status.isConnected && TokenManager.getToken(role)) {
                connect();
            }
        }, 5000);

        return () => {
            clearInterval(interval);
            socketService.removeAllListeners();
            socketService.disconnect();
        };
    }, [role]);

    const value = {
        isConnected,
        socket: socketService.socket,
        unreadCount,
        latestNotification,
        setUnreadCount,
        refreshUnreadCount: fetchUnreadCount
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
