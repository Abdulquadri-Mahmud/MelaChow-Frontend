"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfileIconWithBadge({ onClick, className = "" }) {
    const [showBadge, setShowBadge] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Check if notifications are disabled/not requested
        if ("Notification" in window) {
            const permission = Notification.permission;
            setShowBadge(permission === "default");
        }
    }, []);

    return (
        <div onClick={onClick} className={`relative cursor-pointer ${className}`}>
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 transition-colors hover:bg-orange-100 dark:hover:bg-orange-500/20">
                <User size={22} strokeWidth={2.5} />
            </div>

            {/* Notification Badge - Small subtle indicator */}
            {showBadge && (
                <motion.div
                    className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white dark:border-gray-900"
                    initial={{ scale: 0 }}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.8, 1]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    title="Enable notifications for the best experience"
                />
            )}
        </div>
    );
}
