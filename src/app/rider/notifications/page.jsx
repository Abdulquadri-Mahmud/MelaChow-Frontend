"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Package, AlertCircle, CheckCircle2, Info, Bike, Clock } from "lucide-react";

// Simulated notifications — in production these would come from an API / socket
const MOCK_NOTIFICATIONS = [
    {
        id: 1,
        type: "assignment",
        title: "New delivery assigned!",
        body: "Order #A7F2C has been assigned to you. Pickup from GrubDash Kitchen.",
        time: "2 min ago",
        read: false,
        icon: Bike,
        color: "orange",
    },
    {
        id: 2,
        type: "info",
        title: "Status updated",
        body: "Your status was set to available by the system after completing Order #B91D.",
        time: "1 hr ago",
        read: false,
        icon: Info,
        color: "blue",
    },
    {
        id: 3,
        type: "success",
        title: "Delivery completed!",
        body: "Order #9C3E was delivered successfully. Great work! ₦1,200 earned.",
        time: "3 hrs ago",
        read: true,
        icon: CheckCircle2,
        color: "green",
    },
    {
        id: 4,
        type: "warning",
        title: "Low rating warning",
        body: "Your rating dropped slightly. Keep delivering great service to improve it.",
        time: "Yesterday",
        read: true,
        icon: AlertCircle,
        color: "yellow",
    },
];

const colorMap = {
    orange: { bg: "bg-orange-500/10", text: "text-orange-500" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400" },
    green: { bg: "bg-green-500/10", text: "text-green-400" },
    yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
};

export default function RiderNotificationsPage() {
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white mb-1">Notifications</h1>
                    <p className="text-gray-500 font-medium">
                        {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}` : "You're all caught up!"}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        className="text-orange-500 text-sm font-bold hover:underline"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {notifications.map((notif, i) => {
                    const c = colorMap[notif.color];
                    const Icon = notif.icon;
                    return (
                        <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))}
                            className={`relative bg-[#1A1D23] border rounded-2xl p-4 flex items-start gap-4 cursor-pointer transition-all hover:border-orange-500/20 ${notif.read ? "border-white/5 opacity-60" : "border-orange-500/20"
                                }`}
                        >
                            {!notif.read && (
                                <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-orange-500" />
                            )}
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${c.bg}`}>
                                <Icon size={20} className={c.text} />
                            </div>
                            <div className="flex-1 pr-4">
                                <p className="font-bold text-white text-sm mb-0.5">{notif.title}</p>
                                <p className="text-gray-400 text-xs leading-relaxed">{notif.body}</p>
                                <div className="flex items-center gap-1 mt-2 text-gray-600 text-[11px] font-medium">
                                    <Clock size={10} />
                                    <span>{notif.time}</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {notifications.every(n => n.read) && (
                <div className="text-center py-10 text-gray-600">
                    <Bell size={36} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold">No new notifications</p>
                </div>
            )}
        </div>
    );
}
