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
            { icon: FolderTree, label: "System Categories", href: "/admin/categories" },
            { icon: MapPin, label: "Service Locations", href: "/admin/locations" },
            { icon: Settings, label: "Global Settings", href: "/admin/settings" },
        ]
    },
];

// Flat list for path matching
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
        setProfileOpen(false); // Close profile dropdown if open
        setSidebarOpen(false); // Close mobile sidebar if open
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
            // No need to set isLoggingOut(false) here if redirecting, 
            // but added in catch for error cases.
            setShowLogoutModal(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar - Desktop */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 hidden lg:flex lg:w-72 lg:flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 transform ${desktopSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Logo Area */}
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800/50 bg-slate-900/50">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg shadow-orange-500/20">
                            <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-black text-white leading-none tracking-tight">GrubDash</h1>
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-1 opacity-80">Security Terminal</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-4 space-y-6 scroll overflow-y-auto scrollbar-hide">
                        {navigation.map((section) => (
                            <div key={section.title} className="space-y-1">
                                <h3 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 leading-none">
                                    {section.title}
                                </h3>
                                <div className="space-y-0.5">
                                    {section.items.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <button
                                                key={item.href}
                                                onClick={() => router.push(item.href)}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-[13px] transition-all group ${isActive
                                                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                                                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                                                    }`}
                                            >
                                                <item.icon size={18} strokeWidth={isActive ? 3 : 2} className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"} />
                                                <span className="tracking-tight">{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Footer / Terminal Info */}
                    <div className="p-4 border-t border-slate-800/50 bg-slate-900/40">
                        <button
                            onClick={handleOpenLogoutModal}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[13px] text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all border border-transparent hover:border-rose-500/20 group"
                        >
                            <LogOut size={18} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
                            <span>Sign Out Terminal</span>
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
                            <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                                {navigation.map((section) => (
                                    <div key={section.title} className="space-y-1">
                                        <h3 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                                            {section.title}
                                        </h3>
                                        <div className="space-y-0.5">
                                            {section.items.map((item) => {
                                                const isActive = pathname === item.href;
                                                return (
                                                    <button
                                                        key={item.href}
                                                        onClick={() => {
                                                            router.push(item.href);
                                                            setSidebarOpen(false);
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-[13px] transition-all ${isActive
                                                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                                                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                                            }`}
                                                    >
                                                        <item.icon size={18} strokeWidth={2.5} />
                                                        {item.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </nav>

                            {/* Logout */}
                            <div className="p-4 border-t border-slate-800">
                                <button
                                    onClick={handleOpenLogoutModal}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[13px] text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
                                >
                                    <LogOut size={18} strokeWidth={2.5} />
                                    Sign Out Terminal
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${desktopSidebarOpen ? "lg:pl-72" : "lg:pl-0"}`}>
                {/* Top Navigation Bar */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
                    <div className="flex items-center justify-between px-4 py-2.5">
                        {/* Sidebar Toggle Buttons */}
                        <div className="flex items-center gap-2">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <Menu size={24} />
                            </button>

                            {/* Desktop Toggle Button */}
                            <button
                                onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
                                className="hidden lg:flex p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
                                title={desktopSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                            >
                                <PanelLeft
                                    size={24}
                                    className={`transition-transform duration-300 ${!desktopSidebarOpen ? "rotate-180" : ""}`}
                                />
                            </button>
                        </div>

                        {/* Page Context - Breadcrumb style for professionalism */}
                        <div className="hidden lg:flex flex-col">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Management Terminal</span>
                                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span className="text-[9px] font-black text-orange-500 uppercase tracking-[0.2em]">Live</span>
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tighter">
                                {menuItems.find((item) => item.href === pathname)?.label || "System Overview"}
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
                                    className="flex items-center gap-3 px-3 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl transition-all active:scale-[0.98]"
                                >
                                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-md shadow-slate-900/10">
                                        <span className="text-white font-black text-xs">
                                            {admin?.name?.[0]?.toUpperCase() || "A"}
                                        </span>
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-[11px] font-black text-slate-900 leading-none uppercase tracking-tight">{admin?.name || "Administrator"}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">System Root</p>
                                    </div>
                                    <ChevronDown size={14} className="text-slate-400" />
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
                                                onClick={handleOpenLogoutModal}
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
                <main className="p-4">{children}</main>
            </div>

            {/* Premium Logout Modal */}
            <AnimatePresence>
                {showLogoutModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutModal(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-black/50"
                        >
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-inner">
                                    <LogOut size={32} strokeWidth={2.5} />
                                </div>

                                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                                    Terminate Session
                                </h3>
                                <p className="text-slate-500 font-bold text-[11px] leading-relaxed max-w-[240px] mx-auto uppercase tracking-wide">
                                    Are you sure you want to logout? You will need to re-authenticate to access the portal.
                                </p>

                                <div className="mt-8 flex flex-col gap-3">
                                    <button
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        className="w-full h-14 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-rose-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : "Yes, Logout"}
                                    </button>
                                    <button
                                        onClick={() => !isLoggingOut && setShowLogoutModal(false)}
                                        disabled={isLoggingOut}
                                        className="w-full h-14 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        Stay Logged In
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-50 py-3 border-t border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
                                    GrubDash Secure Terminal v2.4
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
