"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdmin } from "@/app/context/AdminContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    FolderTree,
    Store,
    Users,
    ShoppingBag,
    Star,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    ChevronDown,
    Shield,
    MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import NotificationBell from "@/app/components/NotificationBell";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { icon: FolderTree, label: "Categories", href: "/admin/categories" },
    { icon: Store, label: "Vendors", href: "/admin/vendors" },
    { icon: Users, label: "Users", href: "/admin/users" },
    { icon: ShoppingBag, label: "Orders", href: "/admin/orders" },
    { icon: Star, label: "Reviews", href: "/admin/reviews" },
    { icon: MapPin, label: "Locations", href: "/admin/locations" },
    { icon: Settings, label: "Settings", href: "/admin/settings" },
];

export default function AdminDashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const { admin, logout } = useAdmin();
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        const confirmed = window.confirm("Are you sure you want to logout?");
        if (confirmed) {
            await logout();
            router.push("/admin/auth/login");
            toast.success("Logged out successfully");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col bg-slate-900 border-r border-slate-800">
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
                        <div className="flex items-center justify-center w-12 h-12 bg-orange-500 rounded-2xl">
                            <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white">GrubDash</h1>
                            <p className="text-xs font-bold text-orange-400">Admin Portal</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <button
                                    key={item.href}
                                    onClick={() => router.push(item.href)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${isActive
                                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                        }`}
                                >
                                    <item.icon size={20} strokeWidth={2.5} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Logout Button */}
                    <div className="p-4 border-t border-slate-800">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                        >
                            <LogOut size={20} strokeWidth={2.5} />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        />

                        {/* Sidebar */}
                        <motion.aside
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 bg-slate-900 z-50 lg:hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-6 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-12 h-12 bg-orange-500 rounded-2xl">
                                        <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-black text-white">GrubDash</h1>
                                        <p className="text-xs font-bold text-orange-400">Admin Portal</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                                {menuItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <button
                                            key={item.href}
                                            onClick={() => {
                                                router.push(item.href);
                                                setSidebarOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${isActive
                                                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                                }`}
                                        >
                                            <item.icon size={20} strokeWidth={2.5} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </nav>

                            {/* Logout */}
                            <div className="p-4 border-t border-slate-800">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                                >
                                    <LogOut size={20} strokeWidth={2.5} />
                                    Logout
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="lg:pl-72">
                {/* Top Navigation Bar */}
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between px-4 py-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <Menu size={24} />
                        </button>

                        {/* Page Title - Hidden on mobile, shown on desktop */}
                        <div className="hidden lg:block">
                            <h2 className="text-2xl font-black text-gray-900">
                                {menuItems.find((item) => item.href === pathname)?.label || "Dashboard"}
                            </h2>
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center gap-4 ml-auto">
                            {/* Notifications */}
                            <NotificationBell
                                role="admin"
                                href="/admin/notifications"
                            />

                            {/* Admin Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">
                                            {admin?.name?.[0]?.toUpperCase() || "A"}
                                        </span>
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-bold text-gray-900">{admin?.name || "Admin"}</p>
                                        <p className="text-xs text-gray-500">{admin?.email || ""}</p>
                                    </div>
                                    <ChevronDown size={16} className="text-gray-400" />
                                </button>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {profileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2"
                                        >
                                            <button
                                                onClick={() => {
                                                    router.push("/admin/settings");
                                                    setProfileOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                <Settings size={16} />
                                                Settings
                                            </button>
                                            <div className="border-t border-gray-100 my-2"></div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut size={16} />
                                                Logout
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
