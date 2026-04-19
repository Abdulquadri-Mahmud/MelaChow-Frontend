"use client";

import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import { motion } from "framer-motion";
import {
    FolderTree,
    Store,
    Users,
    ShoppingBag,
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
    ResponsiveContainer
} from "recharts";

// ── Shared Stat Tile Component ───────────────────────────────────────────────
const StatTile = ({ icon: Icon, label, value, loading, iconColor }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 transition-all hover:border-slate-300">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-50 border border-slate-100">
            <Icon size={16} className={iconColor} />
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate">{label}</p>
            {loading ? (
                <div className="h-5 w-12 bg-slate-50 animate-pulse rounded" />
            ) : (
                <p className="text-lg font-bold text-slate-900 leading-none">{value.toLocaleString()}</p>
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
                    adminApi.getActivities({ limit: 8 }),
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
                <div className="max-w-[1200px] mx-auto space-y-6 pb-12">
                    
                    {/* ── Header ─────────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center">
                                <Activity size={15} className="text-slate-600" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Control Center</h1>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">Platform overview & live ops</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <Link href="/admin/audit-logs" className="h-9 px-4 bg-slate-900 text-white rounded-lg flex items-center gap-2 font-bold text-[10px] uppercase">
                                <Activity size={12} className="text-orange-400" /> Audit Logs
                            </Link>
                        </div>
                    </div>

                    {/* ── Stats Grid ─────────────────────────────────────── */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <StatTile icon={ShoppingBag} label="Orders" value={stats.orders} loading={loading} iconColor="text-emerald-500" />
                        <StatTile icon={Store} label="Vendors" value={stats.vendors} loading={loading} iconColor="text-orange-500" />
                        <StatTile icon={Users} label="Users" value={stats.users} loading={loading} iconColor="text-blue-500" />
                        <StatTile icon={FolderTree} label="Categories" value={stats.categories} loading={loading} iconColor="text-amber-500" />
                        <StatTile icon={ShieldCheck} label="Pending" value={stats.pendingVendors} loading={loading} iconColor="text-rose-500" />
                    </div>

                    {/* ── Main Operations Area ───────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Velocity Chart */}
                        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BarChart3 size={14} className="text-slate-400" />
                                    <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">System Velocity (7D)</h3>
                                </div>
                            </div>
                            <div className="p-5 h-[280px]">
                                {loading ? (
                                    <div className="w-full h-full flex items-center justify-center"><Loader2 size={24} className="animate-spin text-slate-200" /></div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.05} />
                                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} />
                                            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: '#fff', fontSize: '10px' }} />
                                            <Area type="monotone" dataKey="volume" name="Orders" stroke="#f97316" strokeWidth={2} fill="url(#colorVolume)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Recent Alerts / Pending */}
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={14} className="text-rose-400" /> Pending Review
                                </h3>
                                <Link href="/admin/vendors/pending" className="text-[9px] font-bold text-slate-400 hover:text-rose-500 uppercase transition-colors">View All</Link>
                            </div>
                            <div className="divide-y divide-slate-100 flex-1">
                                {loading ? (
                                    <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-slate-200" /></div>
                                ) : pendingVendors.length > 0 ? pendingVendors.map((vendor) => (
                                    <div key={vendor._id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-[9px] uppercase">
                                                {vendor.storeName?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 leading-none mb-1 group-hover:text-rose-600 transition-colors">{vendor.storeName}</p>
                                                <p className="text-[9px] text-slate-400 font-medium">{new Date(vendor.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <ArrowRight size={12} className="text-slate-200 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                                        <CheckCircle size={24} className="mb-2 opacity-50" />
                                        <p className="text-[9px] font-bold uppercase">No pending reviews</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Audit & Routing Area ───────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Audit Feed */}
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={14} className="text-blue-400" /> Platform Feed
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {loading ? (
                                    <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-slate-200" /></div>
                                ) : activities.slice(0, 6).map((activity) => {
                                    const config = getActivityConfig(activity.action);
                                    const Icon = config.icon;
                                    return (
                                        <div key={activity._id} className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors">
                                            <div className={`mt-0.5 w-7 h-7 rounded flex items-center justify-center shrink-0 ${config.color.split(' ')[1]} border border-slate-100`}>
                                                <Icon size={12} className={config.color.split(' ')[0]} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <p className="text-xs font-medium text-slate-700 truncate">{activity.details}</p>
                                                    <span className="text-[9px] font-medium text-slate-400 shrink-0">{formatTimeAgo(activity.createdAt)}</span>
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{activity.action}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Routing */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Link href="/admin/categories" className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-400 transition-all group">
                                    <FolderTree size={16} className="text-blue-500 mb-3" />
                                    <h4 className="text-xs font-bold text-slate-800 uppercase mb-1 flex items-center justify-between">Categories <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100" /></h4>
                                    <p className="text-[9px] text-slate-400 font-medium uppercase leading-normal">Menu & Catalog management</p>
                                </Link>
                                <Link href="/admin/vendors" className="bg-white border border-slate-200 rounded-xl p-4 hover:border-orange-400 transition-all group">
                                    <Store size={16} className="text-orange-500 mb-3" />
                                    <h4 className="text-xs font-bold text-slate-800 uppercase mb-1 flex items-center justify-between">Vendors <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100" /></h4>
                                    <p className="text-[9px] text-slate-400 font-medium uppercase leading-normal">Partner directory & settings</p>
                                </Link>
                            </div>
                            
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Download size={14} className="text-slate-400" />
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mobile Integration</p>
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-4">Install MelaChow Admin PWA</h3>
                                    <PermanentInstallButton />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
