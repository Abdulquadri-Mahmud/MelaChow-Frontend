'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getRiderProfile, toggleRiderAvailability } from '@/app/lib/riderApi';
import { TokenManager } from '@/app/lib/auth-token';
import toast from 'react-hot-toast';
import socketService from '@/app/lib/socketService';
import { useSocket } from './SocketContext';

const RiderContext = createContext(null);

export const useRider = () => useContext(RiderContext);

// ─── Helper: extract rider object from any API response shape ───────────────
function extractRider(data) {
    if (!data) return null;

    // Shape 1: { success, data: { rider: {...} } }
    if (data?.data?.rider?._id || data?.data?.rider?.id) return data.data.rider;

    // Shape 2: { success, data: { _id, id, ... } }  ← YOUR ACTUAL SHAPE
    if (data?.data?._id || data?.data?.id) return data.data;

    // Shape 3: { rider: {...} }
    if (data?.rider?._id || data?.rider?.id) return data.rider;

    // Shape 4: raw rider object
    if (data?._id || data?.id) return data;

    return null;
}

export const RiderProvider = ({ children }) => {
    const [rider, setRider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(false);

    const refreshProfile = async () => {
        const token = TokenManager.getToken('rider');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const raw = await getRiderProfile();
            const riderData = extractRider(raw);
            const riderId = riderData?._id || riderData?.id;

            if (!riderId) {
                console.error('⚠️ Could not resolve rider ID from API response:', raw);
                setLoading(false);
                return;
            }

            console.log('🛵 Rider loaded, id:', riderId);
            setRider(riderData);
            setIsOnline(riderData?.status === 'available' || riderData?.isAvailable === true);
        } catch (error) {
            console.error('Failed to fetch rider profile:', error);
            if (error?.response?.status === 401) {
                TokenManager.clearToken('rider');
                setRider(null);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshProfile();
    }, []);

    const { isConnected: wsConnected, socket } = useSocket();
    const riderId = rider?._id || rider?.id;

    useEffect(() => {
        if (!socket || !rider?._id) return;

        console.log('🛵 Emitting rider_connect for:', rider._id);
        socket.emit('rider_connect', { riderId: rider._id });
    }, [socket, rider?._id]);

    useEffect(() => {
        if (!riderId || !wsConnected || !socket) return;

        // Also ensure they are in the secondary room if used by subscribeToRider
        socketService.subscribeToRider(riderId);

        const handleStatusChange = (data) => {
            if (data.riderId === riderId) {
                setIsOnline(data.status === 'available');
                setRider(prev => prev ? { ...prev, status: data.status } : prev);
                if (data.status === 'offline') {
                    toast.error('Your status was changed to offline');
                }
            }
        };

        const handleRiderDeactivated = (data) => {
            if (data.riderId === riderId) {
                toast.error('Your account has been deactivated.', { duration: 6000 });
                logout();
            }
        };

        const handleRiderAssigned = (data) => {
            // console.log("Incoming assignment data:", data);
            // Check both riderId and the object structure
            if (data.riderId === riderId || data === riderId) {
                window.dispatchEvent(new CustomEvent('rider:new_assignment', { detail: data }));
            }
        };

        socket.on('rider_status_changed', handleStatusChange);
        socket.on('rider_deactivated', handleRiderDeactivated);
        socket.on('order_assigned', handleRiderAssigned);

        return () => {
            socket.off('rider_status_changed', handleStatusChange);
            socket.off('rider_deactivated', handleRiderDeactivated);
            socket.off('order_assigned', handleRiderAssigned);
        };
    }, [riderId, wsConnected, socket]);

    const logout = () => {
        TokenManager.clearToken('rider');
        setRider(null);
        setIsOnline(false);
        window.location.href = '/auth/rider/login';
    };

    const toggleAvailability = async () => {
        const riderId = rider?._id || rider?.id;

        if (!riderId) {
            toast.error('Rider profile not loaded yet. Please wait.');
            return;
        }

        if (isOnline && rider?.currentOrderId) {
            toast.error('You cannot go offline while on an active delivery!');
            return;
        }

        const newStatus = isOnline ? 'offline' : 'available';
        try {
            await toggleRiderAvailability(riderId, newStatus);
            setIsOnline(!isOnline);
            setRider(prev => prev ? { ...prev, status: newStatus } : prev);
            toast.success(`You are now ${newStatus}`);
        } catch (error) {
            console.log(error);

            toast.error(error?.response?.data?.message || 'Failed to update status');
        }
    };

    return (
        <RiderContext.Provider value={{
            rider,
            loading,
            isOnline,
            toggleAvailability,
            logout,
            refreshProfile,
        }}>
            {children}
        </RiderContext.Provider>
    );
};