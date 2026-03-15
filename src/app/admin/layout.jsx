"use client";

import { AdminProvider } from "@/app/context/AdminContext";

import AdminLogoutHandler from "./components/AdminLogoutHandler";

export default function AdminLayout({ children }) {
    return (
        <AdminProvider>
            {children}
            <AdminLogoutHandler />
        </AdminProvider>
    );
}
