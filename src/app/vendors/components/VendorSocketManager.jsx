'use client';

import { useEffect } from 'react';
import { useSocket } from '@/app/context/SocketContext';
import { useVendorProfile } from '@/app/context/VendorProfileContext';
import socketService from '@/app/lib/socketService';

/**
 * Manages vendor-specific socket logic like joining restaurant rooms
 */
export default function VendorSocketManager() {
    const { isConnected } = useSocket();
    const { vendorProfile } = useVendorProfile();

    useEffect(() => {
        if (isConnected && vendorProfile?._id) {
            console.log(`🔌 Joining restaurant room: ${vendorProfile._id}`);
            socketService.subscribeToRestaurant(vendorProfile._id);
        }
    }, [isConnected, vendorProfile?._id]);

    return null; // This is a utility component
}
