'use client';

import { useEffect, useRef } from 'react';
import { useSocket } from '@/app/context/SocketContext';
import { useVendorProfile } from '@/app/context/VendorProfileContext';
import socketService from '@/app/lib/socketService';

/**
 * Manages vendor-specific socket logic like joining restaurant rooms
 */
export default function VendorSocketManager() {
    const { isConnected } = useSocket();
    const { vendorProfile } = useVendorProfile();

    // Track the last vendorId we successfully joined to prevent
    // duplicate room joins on rapid reconnect cycles
    const joinedVendorRef = useRef(null);

    useEffect(() => {
        if (isConnected && vendorProfile?._id) {
            // Only emit if this is a new connection for this vendor
            // Prevents duplicate room joins when socket reconnects rapidly
            if (joinedVendorRef.current === vendorProfile._id.toString()) {
                return;
            }
            joinedVendorRef.current = vendorProfile._id.toString();
            console.log(`🔌 Joining restaurant room: ${vendorProfile._id}`);
            socketService.socket?.emit('vendor_connect', { vendorId: vendorProfile._id });
            socketService.subscribeToRestaurant(vendorProfile._id);
        }

        // Reset the guard when disconnected so we rejoin on next connection
        if (!isConnected) {
            joinedVendorRef.current = null;
        }
    }, [isConnected, vendorProfile?._id]);

    return null; // This is a utility component
}
