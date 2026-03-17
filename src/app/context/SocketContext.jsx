'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import socketService from '@/app/lib/socketService';
import { TokenManager } from '@/app/lib/auth-token';
import toast from 'react-hot-toast';

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

    // Rider assignment alert for admin — platform-managed order ready
    const [riderAssignmentAlert, setRiderAssignmentAlert] = useState(null);

    // Guard: ensures socket event listeners are registered only once per
    // socket instance, not on every reconnection attempt from the interval
    const listenersRegistered = useRef(false);

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

                // Only register listeners once — prevent stacking on reconnect attempts
                if (listenersRegistered.current) {
                    setIsConnected(true);
                    return;
                }
                listenersRegistered.current = true;

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

                        const newOrderNotification = {
                            _id: `order-${order._id || Date.now()}`,
                            title: '🔔 New Order Received!',
                            body: `Order #${order.orderNumber || order._id?.slice(-6)} · ${order.customerName || 'Customer'} · ${order.deliveryAddress?.address || ''}`,
                            type: 'vendor_new_order',
                            orderId: order._id,
                            url: `/vendors/orders/${order._id}`,
                            createdAt: new Date().toISOString(),
                            read: false,
                            customerName: order.customerName,
                            location: order.deliveryAddress?.address
                        };

                        setLatestNotification(newOrderNotification);
                        setUnreadCount(prev => prev + 1);
                        window.dispatchEvent(new CustomEvent('notifications:updated', { detail: newOrderNotification }));

                        // Premium vendor new order toast — distinct from standard notification toasts
                        toast.custom((t) => (
                            <div
                                className={`bg-white dark:bg-slate-900 shadow-2xl rounded-2xl p-4 flex items-start gap-4 w-full max-w-sm border-l-4 border-orange-500 cursor-pointer ${t.visible ? 'animate-in slide-in-from-right-full' : 'animate-out fade-out'}`}
                                onClick={() => {
                                    window.location.href = `/vendors/orders/${order._id}`;
                                    toast.dismiss(t.id);
                                }}
                            >
                                <div className="flex-shrink-0 w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-orange-200">
                                    🔔
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-slate-900 dark:text-white uppercase italic tracking-tight">
                                        New Order!
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                                        #{order.orderNumber || order._id?.slice(-6)} · {order.customerName || 'Customer'}
                                    </p>
                                    <button className="mt-2 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
                                        View Order →
                                    </button>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
                                    className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                        ), {
                            duration: 15000,
                            position: 'top-right',
                            id: `new-order-${order._id}`
                        });

                        // Play alert sound for new orders
                        try {
                            const audio = new Audio('/sounds/notification.mp3');
                            audio.volume = 0.6;
                            audio.play().catch(() => { });
                        } catch (e) { }
                    }
                });

                // Handle missed notifications delivered on reconnect
                socketService.onMissedNotifications(({ notifications: missed, count }) => {
                    if (role === 'vendor' && missed?.length > 0) {
                        console.log(`📬 ${count} missed notification(s) received on reconnect`);

                        // Batch dispatch all missed notifications to the notification state
                        missed.forEach(notification => {
                            window.dispatchEvent(new CustomEvent('notifications:updated', {
                                detail: notification
                            }));
                        });

                        // Update unread count by the number of missed notifications
                        setUnreadCount(prev => prev + count);

                        // Show a single summary toast — not one per notification (avoid toast spam)
                        toast.custom((t) => (
                            <div
                                className={`bg-white dark:bg-slate-900 shadow-2xl rounded-2xl p-4 flex items-start gap-4 w-full max-w-sm border-l-4 border-amber-500 cursor-pointer ${t.visible ? 'animate-in slide-in-from-right-full' : 'animate-out fade-out'}`}
                                onClick={() => {
                                    window.location.href = '/vendors/notifications';
                                    toast.dismiss(t.id);
                                }}
                            >
                                <div className="flex-shrink-0 w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-xl">
                                    📬
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-slate-900 dark:text-white uppercase italic tracking-tight">
                                        {count} Missed {count === 1 ? 'Notification' : 'Notifications'}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Updates arrived while you were away
                                    </p>
                                    <button className="mt-2 text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors">
                                        Review All →
                                    </button>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
                                    className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                        ), {
                            duration: 10000,
                            position: 'top-right',
                            id: 'missed-notifications-summary'
                        });
                    }
                });

                // Admin rider assignment alert
                // Fired when a platform-managed vendor marks order ready_for_pickup
                if (role === 'admin') {
                  socketService.socket?.on('rider_assignment_needed', (data) => {
                    console.log('🚨 Rider assignment needed:', data);
                    
                    setRiderAssignmentAlert(data);
                    setUnreadCount(prev => prev + 1);

                    // Dispatch to notification manager
                    window.dispatchEvent(new CustomEvent('notifications:updated', {
                      detail: {
                        _id: `rider-alert-${data.vendorOrderId || Date.now()}`,
                        title: '🚨 Rider Assignment Required',
                        body: `${data.restaurantName || 'A restaurant'} has an order ready for pickup. Assign a rider now.`,
                        type: 'rider_assignment_needed',
                        url: `/admin/orders/${data.vendorOrderId}`,
                        createdAt: new Date().toISOString(),
                        read: false,
                        ...data
                      }
                    }));

                    // High-urgency toast with assign action
                    toast.custom((t) => (
                      <div
                        className={`bg-white shadow-2xl rounded-2xl p-4 flex items-start gap-4 
                          w-full max-w-sm border-l-4 border-red-500 cursor-pointer
                          ${t.visible ? 'animate-in slide-in-from-right-full' : 'animate-out fade-out'}`}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent(
                            'admin:open_rider_assignment', 
                            { detail: data }
                          ));
                          toast.dismiss(t.id);
                        }}
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-xl 
                          flex items-center justify-center text-xl border border-red-100">
                          🚨
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm text-slate-900 uppercase 
                            italic tracking-tight">
                            Rider Assignment Required!
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5 truncate">
                            {data.restaurantName || 'Restaurant'} — order ready for pickup
                          </p>
                          <button className="mt-2 text-xs font-bold text-red-500 
                            hover:text-red-600 transition-colors">
                            Assign Rider Now →
                          </button>
                        </div>
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            toast.dismiss(t.id); 
                          }}
                          className="text-slate-300 hover:text-slate-500 
                            transition-colors flex-shrink-0 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ), {
                      duration: 30000, // 30s — high urgency, stays longer
                      position: 'top-right',
                      id: `rider-assignment-${data.vendorOrderId}`
                    });
                  });
                }

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
            listenersRegistered.current = false;
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
        refreshUnreadCount: fetchUnreadCount,
        riderAssignmentAlert,
        clearRiderAssignmentAlert: () => setRiderAssignmentAlert(null)
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
