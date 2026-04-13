"use client";

import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
    FolderTree,
    Store,
    Users,
    ShoppingBag,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    Key,
    XCircle,
    DollarSign,
    Settings,
    ArrowUpRight,
    ArrowRight,
    Activity,
    ShieldCheck,
    BarChart3,
    Download
} from "lucide-react";
import { useState, useEffect } from "react";
import adminApi from "@/app/lib/adminApi";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import PermanentInstallButton from "@/app/components/PermanentInstallButton";

// Recharts for operations analytics
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from "recharts";

// ─── Shared Stat Tile Component ───────────────────────────────────────────────
const StatTile = ({ icon: Icon, label, value, loading, bgClass, textClass }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:border-orange-200 hover:shadow-sm transition-all group">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bgClass} ${textClass} bg-opacity-30 group-hover:bg-opacity-50 transition-colors`}>
            <Icon size={20} className={textClass} />
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1 truncate">{label}</p>
            {loading ? (
                <div className="h-6 w-16 bg-slate-100 animate-pulse rounded-md" />
            ) : (
                <p className="text-xl font-extrabold text-slate-900 leading-none">{value.toLocaleString()}</p>
            )}
        </div>
    </div>
);

const getActivityConfig = (action) => {
    switch (action) {
        case 'LOGIN':
        case 'LOGOUT':
            return { icon: Key, color: 'text-blue-500 bg-blue-50 border-blue-100' };
        case 'APPROVE_VENDOR':
        case 'REACTIVATE_USER':
        case 'REACTIVATE_VENDOR':
            return { icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' };
        case 'REJECT_VENDOR':
        case 'SUSPEND_USER':
        case 'SUSPEND_VENDOR':
            return { icon: AlertCircle, color: 'text-amber-500 bg-amber-50 border-amber-100' };
        case 'BAN_USER':
        case 'DELETE_ADMIN':
            return { icon: XCircle, color: 'text-rose-500 bg-rose-50 border-rose-100' };
        case 'UPDATE_COMMISSION':
        case 'CITY_FEE':
            return { icon: DollarSign, color: 'text-purple-500 bg-purple-50 border-purple-100' };
        default:
            return { icon: Settings, color: 'text-slate-500 bg-slate-50 border-slate-100' };
    }
};

// ======================================================================

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        categories: 0,
        vendors: 0,
        users: 0,
        orders: 0,
        pendingVendors: 0
    });
    const [loading, setLoading] = useState(true);
    const [pendingVendors, setPendingVendors] = useState([]);
    const [activities, setActivities] = useState([]);
    const [chartData, setChartData] = useState([]);

    const formatTimeAgo = (dateString) => {
        if (!dateString) return "Recently";
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [userStats, vendorsData, categoriesData, activitiesData, operationsData] = await Promise.all([
                    adminApi.getUserStats(),
                    adminApi.getAllVendors(),
                    adminApi.getAllCategories(),
                    adminApi.getActivities({ limit: 10 }),
                    adminApi.getOperationalVelocity()
                ]);

                const pending = vendorsData.vendors?.filter(v => !v.verified) || [];
                setStats({
                    users: userStats.stats?.totalUsers || 0,
                    vendors: vendorsData.vendors?.length || 0,
                    categories: categoriesData.data?.length || 0,
                    orders: userStats.stats?.totalOrders || 0,
                    pendingVendors: pending.length
                });

                setPendingVendors(pending.slice(0, 5) || []);
                setActivities(activitiesData.activities || []);
                setChartData(operationsData.operationalData || []);
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-5">
                    {/* ── HEADER ────────────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-md shadow-orange-200 shrink-0">
                                    <Activity size={17} className="text-white" />
                                </div>
                                <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                                    Platform Control Center
                                </h1>
                                <span className="hidden md:inline text-[9px] font-extrabold px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-200 uppercase tracking-widest">
                                    Live Operations
                                </span>
                            </div>
                            <div className="flex items-center gap-2 ml-12">
                                <div className="h-0.5 w-8 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" />
                                <p className="text-xs text-slate-500 font-medium leading-snug">
                                    Real-time analytics, key metrics, and immediate administrative alerts.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Link href="/admin/audit-logs" className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800 text-xs font-extrabold uppercase tracking-widest hover:bg-slate-800 transition-colors">
                                <Activity size={14} className="text-orange-400" /> System Logs
                            </Link>
                        </div>
                    </div>

                    {/* ── STAT METRICS GRID ─────────────────────────────────── */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        <StatTile icon={ShoppingBag} label="Total Orders" value={stats.orders} loading={loading} bgClass="bg-emerald-100" textClass="text-emerald-600" />
                        <StatTile icon={Store} label="Active Vendors" value={stats.vendors} loading={loading} bgClass="bg-orange-100" textClass="text-orange-600" />
                        <StatTile icon={Users} label="Registered Users" value={stats.users} loading={loading} bgClass="bg-blue-100" textClass="text-blue-600" />
                        <StatTile icon={FolderTree} label="Menu Categories" value={stats.categories} loading={loading} bgClass="bg-amber-100" textClass="text-amber-600" />
                        <StatTile icon={ShieldCheck} label="Pending Review" value={stats.pendingVendors} loading={loading} bgClass="bg-rose-100" textClass="text-rose-600" />
                    </div>

                    {/* ── OPERATIONS ANALYTICS CHART ────────────────────────── */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="h-0.5 bg-gradient-to-r from-orange-500 to-amber-400 shrink-0" />
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-2.5">
                                <BarChart3 size={16} className="text-orange-500" />
                                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">7-Day Operational Velocity</h3>
                            </div>
                            {!loading && (
                                <div className="hidden md:flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 font-extrabold text-[9px] uppercase tracking-widest text-slate-500">
                                        <div className="w-2 h-2 rounded-full bg-orange-500" /> System Volume
                                    </div>
                                    <div className="flex items-center gap-1.5 font-extrabold text-[9px] uppercase tracking-widest text-slate-500">
                                        <div className="w-2 h-2 rounded-full bg-amber-300" /> Onboarding Flux
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 h-[280px]">
                            {loading ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Loader2 size={32} className="animate-spin text-orange-400" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorOnboard" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#fcd34d" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#fcd34d" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                            labelStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}
                                        />
                                        <Area type="monotone" dataKey="volume" name="System Volume" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
                                        <Area type="monotone" dataKey="onboarding" name="Partners Onboarded" stroke="#fcd34d" strokeWidth={3} fillOpacity={1} fill="url(#colorOnboard)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* ── PENDING APPROVALS LIST ──────────────────────────────── */}
                        <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
                            <div className="h-0.5 bg-rose-500 shrink-0" />
                            <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={15} className="text-rose-500" /> Pending Approvals
                                </h3>
                                <Link href="/admin/vendors/pending" className="text-[10px] font-extrabold text-rose-600 uppercase hover:text-rose-700 hover:underline tracking-widest">Review All</Link>
                            </div>
                            <div className="divide-y divide-slate-100 flex-1">
                                {loading ? (
                                    <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-rose-300" /></div>
                                ) : pendingVendors.length > 0 ? pendingVendors.map((vendor) => (
                                    <div key={vendor._id} className="flex items-center justify-between p-4 hover:bg-rose-50/50 transition-colors group cursor-pointer" onClick={() => router.push(`/admin/vendors/pending/${vendor._id}`)}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-extrabold text-[10px] uppercase">
                                                {vendor.logo ? <img src={vendor.logo} className="w-full h-full object-cover rounded-lg" alt=""/> : vendor.storeName?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-extrabold text-slate-900 leading-none mb-1.5 group-hover:text-rose-600 transition-colors">{vendor.storeName}</p>
                                                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Applied {new Date(vendor.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-white border border-transparent group-hover:border-rose-200 flex items-center justify-center text-slate-300 group-hover:text-rose-600 transition-all shadow-sm opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0">
                                            <ArrowRight size={14} strokeWidth={2.5} />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <CheckCircle size={32} className="mb-2 text-emerald-300 opacity-50" />
                                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Queue Clear</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── PLATFORM AUDIT LIST ────────────────────────────────── */}
                        <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
                            <div className="h-0.5 bg-blue-500 shrink-0" />
                            <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={15} className="text-blue-500" /> Platform Audit
                                </h3>
                                <Link href="/admin/audit-logs" className="text-[10px] font-extrabold text-blue-600 uppercase hover:text-blue-700 hover:underline tracking-widest">Full Audit</Link>
                            </div>
                            <div className="divide-y divide-slate-100 flex-1">
                                {loading ? (
                                    <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-blue-300" /></div>
                                ) : activities.length > 0 ? (
                                    activities.map((activity) => {
                                        const config = getActivityConfig(activity.action);
                                        const Icon = config.icon;
                                        return (
                                            <div key={activity._id} className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors group">
                                                <div className={`mt-0.5 w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${config.color}`}>
                                                    <Icon size={14} strokeWidth={2.5} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex justify-between items-start gap-2 mb-1.5">
                                                        <p className="text-xs font-bold text-slate-700 truncate group-hover:text-slate-900">{activity.details}</p>
                                                        <span className="text-[9px] font-extrabold text-slate-400 shrink-0 uppercase tracking-widest">{formatTimeAgo(activity.createdAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded text-[9px] font-extrabold uppercase tracking-widest">
                                                            {activity.adminId?.name || 'System Auto'}
                                                        </span>
                                                        <span className="text-[9px] font-extrabold text-slate-400 tracking-widest uppercase truncate">{activity.action}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <Activity size={32} className="mb-2 text-slate-300 opacity-50" />
                                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">No Recent Logs</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── OPERATIONAL GUARDRAILS (Dark Footer Action Area) ──────── */}
                    <div className="bg-slate-900 rounded-xl p-6 text-white overflow-hidden relative shadow-lg">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-5">
                                <Settings size={18} className="text-orange-500" />
                                <h3 className="text-xs font-extrabold uppercase tracking-[0.2em]">Core Management Routing</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Link href="/admin/categories" className="group bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm relative overflow-hidden">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mb-3 shadow-sm border border-blue-400/30">
                                        <FolderTree size={18} className="text-white" />
                                    </div>
                                    <h4 className="text-sm font-extrabold mb-1.5 flex items-center justify-between">
                                        Catalog Editor <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 -translate-y-1 translate-x-1 group-hover:translate-x-0 group-hover:translate-y-0" />
                                    </h4>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-widest">Standardize food categories and platform menus.</p>
                                </Link>
                                
                                <Link href="/admin/vendors" className="group bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm relative overflow-hidden">
                                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center mb-3 shadow-sm border border-orange-400/30">
                                        <Store size={18} className="text-white" />
                                    </div>
                                    <h4 className="text-sm font-extrabold mb-1.5 flex items-center justify-between">
                                        Partner Directory <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-400 -translate-y-1 translate-x-1 group-hover:translate-x-0 group-hover:translate-y-0" />
                                    </h4>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-widest">Manage store operational states and commission settings.</p>
                                </Link>
                                
                                <Link href="/admin/finance" className="group bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm relative overflow-hidden">
                                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center mb-3 shadow-sm border border-emerald-400/30">
                                        <DollarSign size={18} className="text-white" />
                                    </div>
                                    <h4 className="text-sm font-extrabold mb-1.5 flex items-center justify-between">
                                        Financial Hub <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400 -translate-y-1 translate-x-1 group-hover:translate-x-0 group-hover:translate-y-0" />
                                    </h4>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-widest">Reconcile platform payouts, fees, and spread income.</p>
                                </Link>
                            </div>
                        </div>
                        
                        {/* Background subtle decoration */}
                        <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 origin-top-right transform-gpu pointer-events-none">
                            <ShieldCheck size={200} />
                        </div>
                    </div>

                    {/* ── PWA HEADER & INSTALL TILE ──────────────────────────── */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                                <Download size={14} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-widest leading-none">Install Admin App</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Direct system access</p>
                            </div>
                        </div>
                        <PermanentInstallButton />
                    </div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
