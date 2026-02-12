'use client';

import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function NotificationBell() {
    const router = useRouter();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchUnreadCount();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get('/api/notifications/unread-count', {
                withCredentials: true
            });
            setUnreadCount(response.data.count || 0);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    return (
        <button
            onClick={() => router.push('/notifications')}
            className="relative p-2 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
            aria-label="Notifications"
        >
            <Bell size={20} className="text-gray-700" />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    );
}
