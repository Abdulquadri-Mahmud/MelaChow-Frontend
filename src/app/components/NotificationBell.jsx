'use client';

import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotificationManager } from '@/app/hooks/useNotificationManager';

export default function NotificationBell() {
    const router = useRouter();
    const { unreadCount, isRealtimeConnected } = useNotificationManager();

    return (
        <button
            onClick={() => router.push('/notifications')}
            className="relative p-2 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
            aria-label="Notifications"
            title={isRealtimeConnected ? 'Real-time updates active' : 'Using fallback polling'}
        >
            <Bell size={20} className="text-gray-700" />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
            {/* Connection indicator */}
            {isRealtimeConnected && (
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"
                    title="Real-time connected" />
            )}
        </button>
    );
}
