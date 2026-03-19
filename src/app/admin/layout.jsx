"use client";

import { AdminProvider } from "@/app/context/AdminContext";

import AdminLogoutHandler from "./components/AdminLogoutHandler";
import PushNotificationPrompt from "@/app/components/notifications/PushNotificationPrompt";
import RealtimeNotificationListener from "@/app/components/notifications/RealtimeNotificationListener";

export default function AdminLayout({ children }) {
    return (
        <AdminProvider>
            {children}
            <AdminLogoutHandler />
            <PushNotificationPrompt />
            <RealtimeNotificationListener />
        </AdminProvider>
    );
}
