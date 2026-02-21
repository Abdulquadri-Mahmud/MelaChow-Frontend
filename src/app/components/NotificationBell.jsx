'use client';

import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationManager } from '@/app/hooks/useNotificationManager';

export default function NotificationBell({ restaurantId, role, href = '/notifications' }) {
    const router = useRouter();
    const { unreadCount, isRealtimeConnected } = useNotificationManager({ restaurantId, role });

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(href)}
            className="relative p-2.5 bg-gray-100 dark:bg-zinc-900 rounded-2xl hover:bg-orange-50 dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-orange-200 dark:hover:border-zinc-700 group"
            aria-label="Notifications"
            title={isRealtimeConnected ? 'Real-time updates active' : 'Using fallback polling'}
        >
            <Bell
                size={20}
                className={`transition-colors ${unreadCount > 0
                    ? 'text-orange-500'
                    : 'text-gray-700 dark:text-gray-200 group-hover:text-orange-500'
                    }`}
            />

            <AnimatePresence>
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-orange-500/30 ring-2 ring-white dark:ring-zinc-950"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </AnimatePresence>

            {/* Premium Connection indicator */}
            <div className="absolute bottom-1 right-1">
                <div className={`w-2 h-2 rounded-full border border-white dark:border-zinc-950 shadow-sm ${isRealtimeConnected ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-700'
                    }`} />
                {isRealtimeConnected && (
                    <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-40" />
                )}
            </div>
        </motion.button>
    );
}
