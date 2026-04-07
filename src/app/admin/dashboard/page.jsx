"use client";

import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import { motion } from "framer-motion";
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
    Info,
    ArrowUpRight,
    ArrowRight,
    Activity,
    ShieldCheck
} from "lucide-react";

import { useState, useEffect } from "react";
import adminApi from "@/app/lib/adminApi";
import { Loader2, Download } from "lucide-react";
import Link from "next/link";
import PermanentInstallButton from "@/app/components/PermanentInstallButton";

const CompactStat = ({ icon: Icon, label, value, colorClass, loading }) => (
    <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3">
        <div className={`w-10 h-10 rounded flex items-center justify-center ${colorClass} bg-opacity-10 shrink-0`}>
            <Icon size={20} className={colorClass.split(' ')[1]} />
        </div>
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            {loading ? (
                <div className="h-5 w-16 bg-slate-100 animate-pulse rounded" />
            ) : (
                <p className="text-base font-bold text-slate-900 leading-none">{value}</p>
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
                const [userStats, vendorsData, categoriesData, activitiesData] = await Promise.all([
                    adminApi.getUserStats(),
                    adminApi.getAllVendors(),
                    adminApi.getAllCategories(),
                    adminApi.getActivities({ limit: 10 })
                ]);

                const pending = vendorsData.vendors?.filter(v => !v.verified) || [];
                setStats({
                    users: userStats.stats.totalUsers || 0,
                    vendors: vendorsData.vendors?.length || 0,
                    categories: categoriesData.data?.length || 0,
                    orders: userStats.stats.totalOrders || 0,
                    pendingVendors: pending.length
                });

                setPendingVendors(pending.slice(0, 5) || []);
                setActivities(activitiesData.activities || []);
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
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                Platform Overview
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full tracking-widest uppercase border border-orange-100 italic">Live Activity</span>
                            </h1>
                            <div className="h-0.5 w-6 bg-orange-500 rounded-full mt-1" />
                            <p className="text-sm text-slate-500 mt-1.5">Key performance indicators and administrative alerts.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href="/admin/audit-logs" className="h-9 px-3 bg-white border border-slate-200 text-slate-600 rounded-md flex items-center gap-2 font-bold text-[10px] uppercase hover:bg-slate-50 transition-colors">
                                <Activity size={14} /> Global Logs
                            </Link>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        <CompactStat icon={FolderTree} label="Categories" value={stats.categories} loading={loading} colorClass="bg-blue-100 text-blue-600" />
                        <CompactStat icon={Store} label="Active Vendors" value={stats.vendors} loading={loading} colorClass="bg-orange-100 text-orange-600" />
                        <CompactStat icon={Users} label="Total Registries" value={stats.users} loading={loading} colorClass="bg-purple-100 text-purple-600" />
                        <CompactStat icon={ShoppingBag} label="Platform Volume" value={stats.orders} loading={loading} colorClass="bg-emerald-100 text-emerald-600" />
                        <CompactStat icon={ShieldCheck} label="Action Required" value={stats.pendingVendors} loading={loading} colorClass="bg-red-100 text-red-600" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Pending Approvals */}
                        <div className="bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden">
                            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={14} className="text-orange-600" /> Pending Approvals
                                </h3>
                                <Link href="/admin/vendors/pending" className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Review All</Link>
                            </div>
                            <div className="divide-y divide-slate-100 flex-1">
                                {loading ? (
                                    <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
                                ) : pendingVendors.length > 0 ? pendingVendors.map((vendor) => (
                                    <div key={vendor._id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-slate-400 font-bold text-xs">
                                                {vendor.storeName?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 leading-none mb-1">{vendor.storeName}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Applied {new Date(vendor.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <Link href="/admin/vendors/pending" className="p-1.5 text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200 rounded transition-all">
                                            <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <CheckCircle size={24} className="mb-2 opacity-20" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Queue Clear</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden">
                            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={14} className="text-blue-500" /> Platform Audit
                                </h3>
                                <Link href="/admin/audit-logs" className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Full Audit</Link>
                            </div>
                            <div className="divide-y divide-slate-100 flex-1">
                                {loading ? (
                                    <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
                                ) : activities.length > 0 ? (
                                    activities.map((activity) => {
                                        const config = getActivityConfig(activity.action);
                                        const Icon = config.icon;
                                        return (
                                            <div key={activity._id} className="flex items-start gap-3 p-3 hover:bg-slate-50 transition-colors group">
                                                <div className={`mt-0.5 w-7 h-7 rounded border flex items-center justify-center shrink-0 ${config.color}`}>
                                                    <Icon size={14} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-xs font-bold text-slate-700 truncate">{activity.details}</p>
                                                        <span className="text-[9px] font-bold text-slate-400 shrink-0 uppercase">{formatTimeAgo(activity.createdAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{activity.adminId?.name || 'Automated System'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <Activity size={24} className="mb-2 opacity-20" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">No Recent Logs</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Operational Guardrails */}
                    <div className="bg-slate-900 rounded-lg p-5 text-white overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-4">Core Management Access</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Link href="/admin/categories" className="group bg-white/5 border border-white/10 p-3 rounded-md hover:bg-white/10 transition-colors">
                                    <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center mb-2.5">
                                        <FolderTree size={16} />
                                    </div>
                                    <h4 className="text-xs font-bold mb-1 flex items-center gap-1.5">
                                        Catalog Management <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h4>
                                    <p className="text-[10px] text-slate-400 leading-normal font-medium">Standardize food categories and platform menus.</p>
                                </Link>
                                <Link href="/admin/vendors/pending" className="group bg-white/5 border border-white/10 p-3 rounded-md hover:bg-white/10 transition-colors">
                                    <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center mb-2.5">
                                        <Store size={16} />
                                    </div>
                                    <h4 className="text-xs font-bold mb-1 flex items-center gap-1.5">
                                        Partner Verification <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h4>
                                    <p className="text-[10px] text-slate-400 leading-normal font-medium">Review and verify incoming vendor applications.</p>
                                </Link>
                                <Link href="/admin/dashboard" className="group bg-white/5 border border-white/10 p-3 rounded-md hover:bg-white/10 transition-colors">
                                    <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center mb-2.5">
                                        <TrendingUp size={16} />
                                    </div>
                                    <h4 className="text-xs font-bold mb-1 flex items-center gap-1.5">
                                        Operational Yield <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h4>
                                    <p className="text-[10px] text-slate-400 leading-normal font-medium">Live monitoring of system growth and engagement.</p>
                                </Link>
                            </div>
                        </div>
                        {/* Background subtle decoration */}
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Settings size={120} className="animate-spin-slow" />
                        </div>
                    </div>
                    {/* PWA Install CTA */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Download size={14} className="text-orange-600" />
                            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Install Admin App</h3>
                        </div>
                        <PermanentInstallButton />
                    </div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
