"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdmin } from "@/app/context/AdminContext";
import { usePWAInstall } from "@/app/hooks/usePWAInstall";
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
    Smartphone,
    ChevronUp,
    Download,
    CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import NotificationBell from "@/app/components/NotificationBell";

const navigation = [
    {
        title: "Overview",
        items: [
            { icon: LayoutDashboard, label: "Dashboard",     href: "/admin/dashboard" },
            { icon: Bell,            label: "Notifications", href: "/admin/notifications" },
            { icon: Activity,        label: "Audit Logs",    href: "/admin/audit-logs" },
        ],
    },
    {
        title: "Marketplace",
        items: [
            { icon: Store,  label: "Vendors",          href: "/admin/vendors" },
            { icon: Clock,  label: "Pending Approvals",href: "/admin/vendors/pending" },
            { icon: Bike,   label: "Riders",           href: "/admin/riders" },
            { icon: Users,  label: "Customers",        href: "/admin/users" },
        ],
    },
    {
        title: "Operations",
        items: [
            { icon: ShoppingBag, label: "Order Queue",   href: "/admin/orders" },
            { icon: Truck,       label: "Logistics Hub", href: "/admin/orders/platform" },
            { icon: Star,        label: "Vendor Reviews",href: "/admin/reviews" },
        ],
    },
    {
        title: "Financials",
        items: [
            { icon: BarChart3, label: "Finance Hub",    href: "/admin/finance" },
            { icon: Percent,   label: "Revenue Ledger", href: "/admin/orders/commission" },
        ],
    },
    {
        title: "Configuration",
        items: [
            { icon: FolderTree, label: "Categories", href: "/admin/categories" },
            { icon: MapPin,     label: "Locations",  href: "/admin/locations" },
            { icon: Settings,   label: "Settings",   href: "/admin/settings" },
        ],
    },
];

const menuItems = navigation.flatMap((s) => s.items);

// ── Compact sidebar install button ────────────────────────────────────────────
function SidebarInstallButton() {
    const { isInstallable, isInstalled, platform, installPWA } = usePWAInstall();

    if (isInstalled) {
        return (
            <div className="flex items-center gap-2 px-3 py-2">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span className="text-[11px] font-bold text-emerald-400">App Installed</span>
            </div>
        );
    }

    const handleInstall = async () => {
        if (platform === "ios") {
            toast("On iOS Safari: tap Share → Add to Home Screen", { icon: "📱", duration: 5000 });
        } else if (isInstallable) {
            await installPWA();
        } else {
            toast("In Chrome: tap ⋮ menu → Add to Home Screen", { icon: "📲", duration: 5000 });
        }
    };

    return (
        <button
            onClick={handleInstall}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-bold text-slate-300 hover:bg-orange-500/10 hover:text-orange-300 transition-all border border-transparent hover:border-orange-500/20"
        >
            <Download size={13} className="text-orange-400 shrink-0" />
            <span>Install MelaChow App</span>
        </button>
    );
}

// ── Shared sidebar content (rendered in both desktop & mobile) ─────────────────
function SidebarContent({ pathname, router, onNavigate, onLogout, installOpen, setInstallOpen }) {
    return (
        <>
            {/* Brand left-edge accent */}
            <div className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-orange-500 via-amber-400 to-transparent opacity-70 pointer-events-none" />

            {/* ── Logo ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-900/50">
                    <Shield size={15} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                    <p className="text-sm font-extrabold text-white leading-none tracking-wide">MelaChow</p>
                    <p className="text-[10px] text-amber-400/60 mt-0.5 font-semibold tracking-widest uppercase">Admin Portal</p>
                </div>
                <div className="ml-auto flex gap-0.5 opacity-25 shrink-0">
                    <span className="w-1 h-1 rounded-full bg-orange-400" />
                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                    <span className="w-1 h-1 rounded-full bg-orange-300" />
                </div>
            </div>

            {/* ── Navigation ───────────────────────────────────────────── */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5 scrollbar-hide min-h-0">
                {navigation.map((section) => (
                    <div key={section.title}>
                        <p className="px-3 text-[9px] font-extrabold text-amber-400 uppercase tracking-[0.2em] mb-1.5 opacity-60">
                            {section.title}
                        </p>
                        <div className="space-y-0.5">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <button
                                        key={item.href}
                                        onClick={() => { router.push(item.href); onNavigate?.(); }}
                                        className={`
                                            w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium
                                            transition-all duration-150 relative group
                                            ${isActive
                                                ? "bg-gradient-to-r from-orange-500/20 to-amber-400/10 text-white border border-orange-500/25 shadow-sm"
                                                : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 border border-transparent"
                                            }
                                        `}
                                    >
                                        {/* Active glow bar */}
                                        {isActive && (
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-orange-400 to-amber-400 rounded-full shadow-[0_0_10px_rgba(251,146,60,0.85)]" />
                                        )}
                                        <item.icon
                                            size={15}
                                            className={isActive ? "text-orange-400 shrink-0" : "text-slate-500 shrink-0 group-hover:text-slate-400 transition-colors"}
                                        />
                                        <span className={isActive ? "font-bold" : ""}>{item.label}</span>
                                        {isActive && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.9)] shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <div className="shrink-0 border-t border-white/[0.06] px-3 pt-2 pb-3 space-y-1">

                {/* Collapsible Install App */}
                <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                    <button
                        onClick={() => setInstallOpen(!installOpen)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-bold text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-all"
                    >
                        <Smartphone size={13} className="text-orange-400 shrink-0" />
                        <span className="flex-1 text-left text-[12px]">Install App</span>
                        {installOpen
                            ? <ChevronUp size={12} className="text-slate-500 shrink-0" />
                            : <ChevronDown size={12} className="text-slate-500 shrink-0" />
                        }
                    </button>
                    <AnimatePresence initial={false}>
                        {installOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.18, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="pb-1">
                                    <SidebarInstallButton />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sign Out */}
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/20"
                >
                    <LogOut size={15} className="shrink-0" />
                    <span>Sign Out</span>
                </button>
            </div>
        </>
    );
}

export default function AdminDashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
    const [profileOpen, setProfileOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [installOpen, setInstallOpen] = useState(false);
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

    const sidebarBg = { background: "linear-gradient(180deg, #1c0e05 0%, #101828 55%, #080f1a 100%)" };

    return (
        <div className="min-h-screen bg-slate-50">

            {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
            <aside
                className={`
                    fixed top-0 left-0 bottom-0 z-40
                    hidden lg:flex lg:flex-col
                    overflow-hidden
                    transition-all duration-300
                    ${desktopSidebarOpen ? "lg:w-72" : "lg:w-0 lg:overflow-hidden"}
                `}
                style={sidebarBg}
            >
                <div className="flex flex-col w-72 h-full min-h-0">
                    <SidebarContent
                        pathname={pathname}
                        router={router}
                        onLogout={handleOpenLogoutModal}
                        installOpen={installOpen}
                        setInstallOpen={setInstallOpen}
                    />
                </div>
            </aside>

            {/* ── Mobile Sidebar ──────────────────────────────────────────── */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 bg-black/55 backdrop-blur-sm z-40 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: -288 }} animate={{ x: 0 }} exit={{ x: -288 }}
                            transition={{ type: "spring", damping: 28, stiffness: 220 }}
                            className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden flex flex-col overflow-hidden"
                            style={sidebarBg}
                        >
                            {/* Close button row */}
                            <div className="absolute top-3 right-3 z-10">
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/10 rounded-lg transition-all"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                            <SidebarContent
                                pathname={pathname}
                                router={router}
                                onNavigate={() => setSidebarOpen(false)}
                                onLogout={handleOpenLogoutModal}
                                installOpen={installOpen}
                                setInstallOpen={setInstallOpen}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── Main Content Area ───────────────────────────────────────── */}
            <div className={`transition-all duration-300 ${desktopSidebarOpen ? "lg:pl-72" : "lg:pl-0"}`}>

                {/* Top Header */}
                <header
                    className="sticky top-0 z-30 bg-white border-b border-slate-200"
                    style={{
                        borderTop: "2px solid transparent",
                        backgroundImage: "linear-gradient(white, white), linear-gradient(to right, #f97316, #fbbf24)",
                        backgroundOrigin: "border-box",
                        backgroundClip: "padding-box, border-box",
                    }}
                >
                    <div className="flex items-center justify-between px-4 h-16">

                        {/* Left: toggles + breadcrumb */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                            >
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
                                <span className="text-slate-900 font-semibold">{currentPage}</span>
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
                                    <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-amber-400 rounded-md flex items-center justify-center shrink-0 shadow-sm shadow-orange-200">
                                        <span className="text-white font-extrabold text-xs uppercase">
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
                                            className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 overflow-hidden"
                                        >
                                            <div className="h-0.5 bg-gradient-to-r from-orange-500 to-amber-400" />
                                            <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                                                <p className="text-xs font-bold text-slate-900">{admin?.name || "Administrator"}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{admin?.email || ""}</p>
                                            </div>
                                            <button
                                                onClick={() => { router.push("/admin/settings"); setProfileOpen(false); }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
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

            {/* ── Logout Modal ─────────────────────────────────────────────── */}
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
                            className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200"
                        >
                            <div className="h-1 bg-gradient-to-r from-rose-500 to-rose-400" />
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
                                        className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
