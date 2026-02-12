import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
    }

    /**
     * Initialize Socket.IO connection
     * @param {string} token - JWT authentication token
     */
    connect(token) {
        if (this.socket?.connected) {
            console.log('[Socket.IO] Already connected');
            return this.socket;
        }

        const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        this.socket = io(SOCKET_URL, {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.setupEventListeners();
        return this.socket;
    }

    /**
     * Setup core event listeners
     */
    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('✅ Socket.IO connected:', this.socket.id);
            this.isConnected = true;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔴 Socket.IO disconnected:', reason);
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Socket.IO connection error:', error.message);
        });

        this.socket.on('pong', (data) => {
            if (process.env.NODE_ENV === 'development') {
                console.log('🏓 Pong received:', data.timestamp);
            }
        });
    }

    /**
     * Subscribe to order updates
     */
    subscribeToOrder(orderId) {
        if (!this.socket) return;
        this.socket.emit('subscribe_order', orderId);
        console.log(`📦 Subscribed to order: ${orderId}`);
    }

    /**
     * Unsubscribe from order updates
     */
    unsubscribeFromOrder(orderId) {
        if (!this.socket) return;
        this.socket.emit('unsubscribe_order', orderId);
        console.log(`📦 Unsubscribed from order: ${orderId}`);
    }

    /**
     * Subscribe to restaurant updates (for vendors)
     */
    subscribeToRestaurant(restaurantId) {
        if (!this.socket) return;
        this.socket.emit('subscribe_restaurant', restaurantId);
        console.log(`🏪 Subscribed to restaurant: ${restaurantId}`);
    }

    /**
     * Listen for new notifications
     */
    onNewNotification(callback) {
        if (!this.socket) return;
        this.socket.on('new_notification', callback);
    }

    /**
     * Listen for notification count updates
     */
    onNotificationCountUpdate(callback) {
        if (!this.socket) return;
        this.socket.on('notification_count_update', callback);
    }

    /**
     * Listen for order status updates
     */
    onOrderStatusUpdate(callback) {
        if (!this.socket) return;
        this.socket.on('order_status_update', callback);
    }

    /**
     * Listen for delivery location updates
     */
    onDeliveryLocationUpdate(callback) {
        if (!this.socket) return;
        this.socket.on('delivery_location_update', callback);
    }

    /**
     * Listen for new orders (for vendors)
     */
    onNewOrder(callback) {
        if (!this.socket) return;
        this.socket.on('new_order', callback);
    }

    /**
     * Send ping to server
     */
    ping() {
        if (!this.socket) return;
        this.socket.emit('ping');
    }

    /**
     * Disconnect socket
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            console.log('🔴 Socket.IO manually disconnected');
        }
    }

    /**
     * Remove all listeners
     */
    removeAllListeners() {
        if (this.socket) {
            this.socket.removeAllListeners();
        }
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            socketId: this.socket?.id || null
        };
    }
}

export default new SocketService();
