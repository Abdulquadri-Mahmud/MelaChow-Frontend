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
    Shield,
    MapPin,
    Bike,
    ChevronDown,
    Clock,
    PanelLeft,
    BarChart3,
    Activity,
    Truck,
    Percent,
    Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import NotificationBell from "@/app/components/NotificationBell";

const navigation = [
    {
        title: "Overview",
        items: [
            { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
            { icon: Bell, label: "Notifications", href: "/admin/notifications" },
            { icon: Activity, label: "Audit Logs", href: "/admin/audit-logs" },
        ]
    },
    {
        title: "Marketplace",
        items: [
            { icon: Store, label: "Vendors", href: "/admin/vendors" },
            { icon: Clock, label: "Pending Approvals", href: "/admin/vendors/pending" },
            { icon: Bike, label: "Riders", href: "/admin/riders" },
            { icon: Users, label: "Customers", href: "/admin/users" },
        ]
    },
    {
        title: "Operations",
        items: [
            { icon: ShoppingBag, label: "Order Queue", href: "/admin/orders" },
            { icon: Truck, label: "Logistics Hub", href: "/admin/orders/platform" },
            { icon: Star, label: "Vendor Reviews", href: "/admin/reviews" },
        ]
    },
    {
        title: "Financials",
        items: [
            { icon: BarChart3, label: "Finance Hub", href: "/admin/finance" },
            { icon: Percent, label: "Revenue Ledger", href: "/admin/orders/commission" },
        ]
    },
    {
        title: "Configuration",
        items: [
            { icon: FolderTree, label: "Categories", href: "/admin/categories" },
            { icon: MapPin, label: "Locations", href: "/admin/locations" },
            { icon: Settings, label: "Settings", href: "/admin/settings" },
        ]
    },
];

const menuItems = navigation.flatMap(section => section.items);

export default function AdminDashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
    const [profileOpen, setProfileOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { admin, logout } = useAdmin();
    const pathname = usePathname();
    const router = useRouter();

    const handleOpenLogoutModal = () => {
        setShowLogoutModal(true);
        setProfileOpen(false);
        setSidebarOpen(false);
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            router.push("/admin/auth/login");
            toast.success("Logged out successfully");
        } catch (err) {
            toast.error("Logout failed: " + err.message);
            setIsLoggingOut(false);
        } finally {
            setShowLogoutModal(false);
        }
    };

    const currentPage = menuItems.find((item) => item.href === pathname)?.label || "Dashboard";

    return (
        <div className="min-h-screen bg-slate-50">

            {/* â”€â”€ Desktop Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <aside className={`fixed inset-y-0 left-0 z-40 hidden lg:flex lg:flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ${desktopSidebarOpen ? "lg:w-60 translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden"}`}>
                <div className="flex flex-col flex-1 min-h-0 w-60">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-800">
                        <div className="w-7 h-7 bg-orange-500 rounded flex items-center justify-center flex-shrink-0">
                            <Shield size={14} className="text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white leading-none">MelaChow</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Admin Portal</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4 scrollbar-hide">
                        {navigation.map((section) => (
                            <div key={section.title}>
                                <p className="px-3 text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                    {section.title}
                                </p>
                                <div className="space-y-0.5">
                                    {section.items.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <button
                                                key={item.href}
                                                onClick={() => router.push(item.href)}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all ${isActive
                                                    ? "bg-slate-800 text-white shadow-sm shadow-black/20"
                                                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                                                    }`}
                                            >
                                                <item.icon size={15} className={isActive ? "text-orange-500" : "text-slate-500"} />
                                                <span>{item.label}</span>
                                                {isActive && <span className="ml-auto w-1 h-4 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="px-3 py-3 border-t border-slate-800">
                        <button
                            onClick={handleOpenLogoutModal}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                        >
                            <LogOut size={15} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* â”€â”€ Mobile Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                            transition={{ type: "spring", damping: 28, stiffness: 220 }}
                            className="fixed inset-y-0 left-0 w-64 bg-slate-900 z-50 lg:hidden flex flex-col border-r border-slate-800"
                        >
                            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 bg-orange-500 rounded flex items-center justify-center">
                                        <Shield size={14} className="text-white" strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white leading-none">MelaChow</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Admin Portal</p>
                                    </div>
                                </div>
                                <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
                                {navigation.map((section) => (
                                    <div key={section.title}>
                                        <p className="px-3 text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                            {section.title}
                                        </p>
                                        <div className="space-y-0.5">
                                            {section.items.map((item) => {
                                                const isActive = pathname === item.href;
                                                return (
                                                    <button
                                                        key={item.href}
                                                        onClick={() => { router.push(item.href); setSidebarOpen(false); }}
                                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all ${isActive
                                                            ? "bg-slate-800 text-white"
                                                            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                                                            }`}
                                                    >
                                                        <item.icon size={15} className={isActive ? "text-orange-500" : "text-slate-500"} />
                                                        <span>{item.label}</span>
                                                        {isActive && <span className="ml-auto w-1 h-4 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </nav>

                            <div className="px-3 py-3 border-t border-slate-800">
                                <button onClick={handleOpenLogoutModal}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors">
                                    <LogOut size={15} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* â”€â”€ Main Content Area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className={`transition-all duration-300 ${desktopSidebarOpen ? "lg:pl-60" : "lg:pl-0"}`}>

                {/* Top Header */}
                <header className="sticky top-0 z-30 bg-white border-b border-slate-200 border-t-2 border-t-orange-500">
                    <div className="flex items-center justify-between px-4 h-16">

                        {/* Left: toggle + breadcrumb */}
                        <div className="flex items-center gap-2">
                            <button onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors">
                                <Menu size={18} />
                            </button>
                            <button
                                onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
                                className="hidden lg:flex p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                                title={desktopSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                            >
                                <PanelLeft size={18} className={`transition-transform duration-300 ${!desktopSidebarOpen ? "rotate-180" : ""}`} />
                            </button>

                            {/* Breadcrumb */}
                            <div className="hidden md:flex items-center gap-1.5 text-sm ml-1">
                                <span className="text-slate-400">Admin</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-slate-900 font-medium">{currentPage}</span>
                            </div>
                        </div>

                        {/* Right: notifications + profile */}
                        <div className="flex items-center gap-1">
                            <NotificationBell role="admin" href="/admin/notifications" />

                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg transition-colors ml-1"
                                >
                                    <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center flex-shrink-0 border border-slate-800 group-hover:border-orange-500 transition-colors">
                                        <span className="text-white font-bold text-xs uppercase">
                                            {admin?.name?.[0] || "A"}
                                        </span>
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-xs font-semibold text-slate-900 leading-none">{admin?.name || "Administrator"}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{admin?.role || "admin"}</p>
                                    </div>
                                    <ChevronDown size={13} className="text-slate-400 hidden md:block" />
                                </button>

                                <AnimatePresence>
                                    {profileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="absolute right-0 mt-1.5 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50"
                                        >
                                            <div className="px-3 py-2 border-b border-slate-100 mb-1">
                                                <p className="text-xs font-semibold text-slate-900">{admin?.name || "Administrator"}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{admin?.email || ""}</p>
                                            </div>
                                            <button
                                                onClick={() => { router.push("/admin/settings"); setProfileOpen(false); }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                            >
                                                <Settings size={14} /> Settings
                                            </button>
                                            <div className="border-t border-slate-100 my-1" />
                                            <button
                                                onClick={handleOpenLogoutModal}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut size={14} /> Sign Out
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4">{children}</main>
            </div>

            {/* â”€â”€ Logout Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <AnimatePresence>
                {showLogoutModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutModal(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 10 }}
                            className="relative w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200"
                        >
                            <div className="p-6 text-center">
                                <div className="w-11 h-11 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <LogOut size={18} className="text-red-500" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-1">Sign out?</h3>
                                <p className="text-sm text-slate-500 max-w-[220px] mx-auto">
                                    You'll need to log back in to access the admin portal.
                                </p>
                                <div className="mt-5 flex gap-2">
                                    <button
                                        onClick={() => !isLoggingOut && setShowLogoutModal(false)}
                                        disabled={isLoggingOut}
                                        className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isLoggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                                        {isLoggingOut ? "Signing out..." : "Sign Out"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

