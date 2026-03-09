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
    Eye,
    Key,
    User,
    XCircle,
    DollarSign,
    Settings,
    Info,
    ExternalLink
} from "lucide-react";

import { useState, useEffect } from "react";
import adminApi from "@/app/lib/adminApi";
import { Loader2 } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, change, color, loading }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {label}
                </p>
                {loading ? (
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                ) : (
                    <h3 className="text-3xl font-black text-gray-900">{value}</h3>
                )}
                {change && !loading && (
                    <p className={`text-sm font-medium mt-2 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change > 0 ? '+' : ''}{change}% from last month
                    </p>
                )}
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={24} className="text-white" strokeWidth={2.5} />
            </div>
        </div>
    </motion.div>
);

const getActivityConfig = (action) => {
    switch (action) {
        case 'LOGIN':
        case 'LOGOUT':
            return { icon: Key, color: 'text-blue-500 bg-blue-50' };
        case 'APPROVE_VENDOR':
        case 'REACTIVATE_USER':
        case 'REACTIVATE_VENDOR':
            return { icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50' };
        case 'REJECT_VENDOR':
        case 'SUSPEND_USER':
        case 'SUSPEND_VENDOR':
            return { icon: AlertCircle, color: 'text-amber-500 bg-amber-50' };
        case 'BAN_USER':
        case 'DELETE_ADMIN':
            return { icon: XCircle, color: 'text-rose-500 bg-rose-50' };
        case 'UPDATE_COMMISSION':
        case 'CITY_FEE':
            return { icon: DollarSign, color: 'text-purple-500 bg-purple-50' };
        default:
            return { icon: Settings, color: 'text-gray-500 bg-gray-50' };
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
                <div className="space-y-8">
                    {/* Welcome Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl font-black text-gray-900 mb-2">
                            Welcome to Admin Dashboard
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Manage your GrubDash platform from here
                        </p>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            icon={FolderTree}
                            label="Total Categories"
                            value={stats.categories}
                            loading={loading}
                            color="bg-blue-500"
                        />
                        <StatCard
                            icon={Store}
                            label="Total Vendors"
                            value={stats.vendors}
                            loading={loading}
                            color="bg-orange-500"
                        />
                        <StatCard
                            icon={Users}
                            label="Total Users"
                            value={stats.users}
                            loading={loading}
                            color="bg-purple-500"
                        />
                        <StatCard
                            icon={CheckCircle}
                            label="Pending Vendors"
                            value={stats.pendingVendors}
                            loading={loading}
                            color="bg-amber-500"
                        />
                        <StatCard
                            icon={ShoppingBag}
                            label="Total Orders"
                            value={stats.orders}
                            loading={loading}
                            color="bg-green-500"
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pending Approvals */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl p-6 border border-gray-200"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-gray-900">Pending Approvals</h3>
                                <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-bold">
                                    {pendingVendors.length} New
                                </span>
                            </div>
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="flex justify-center py-10"><Loader2 size={32} className="animate-spin text-orange-500" /></div>
                                ) : pendingVendors.length > 0 ? pendingVendors.map((vendor) => (
                                    <div key={vendor._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                                <Store size={20} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{vendor.storeName}</p>
                                                <p className="text-xs text-gray-500">{new Date(vendor.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a href="/admin/vendors" className="p-2 bg-white rounded-lg border border-gray-100 text-orange-600 hover:text-orange-700 transition-colors shadow-sm">
                                                <Eye size={16} />
                                            </a>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 text-gray-400 font-medium">No pending approvals</div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl p-6 border border-gray-200 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-gray-900">Platform Audit Log</h3>
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                    <Clock size={16} />
                                </div>
                            </div>

                            <div className="space-y-4 flex-1">
                                {loading ? (
                                    <div className="flex justify-center py-10"><Loader2 size={32} className="animate-spin text-orange-500" /></div>
                                ) : activities.length > 0 ? (
                                    activities.map((activity) => {
                                        const config = getActivityConfig(activity.action);
                                        const Icon = config.icon;

                                        return (
                                            <div key={activity._id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                                                <div className={`p-2.5 rounded-xl shadow-sm border border-black/5 ${config.color}`}>
                                                    <Icon size={18} strokeWidth={2.5} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <p className="font-bold text-gray-900 text-sm">{activity.details}</p>
                                                        {activity.ipAddress && (
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-help" title={`IP: ${activity.ipAddress}`}>
                                                                <Info size={12} className="text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">
                                                            {formatTimeAgo(activity.createdAt)}
                                                        </p>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                        <p className="text-[10px] font-black uppercase text-orange-500 tracking-widest leading-none">
                                                            {activity.adminId?.name || 'System'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-10 text-gray-400 font-medium italic">No administrative events recorded</div>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-50">
                                <a
                                    href="/admin/audit-logs"
                                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-black text-gray-500 hover:text-orange-600 transition-colors group"
                                >
                                    View Full Audit Log
                                    <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                            </div>
                        </motion.div>
                    </div>

                    {/* Getting Started Guide */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white"
                    >
                        <h3 className="text-2xl font-black mb-4">Quick Start Guide</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                                    <FolderTree size={24} />
                                </div>
                                <h4 className="font-bold mb-2">Manage Categories</h4>
                                <p className="text-sm text-orange-100">
                                    Create and organize food categories for your platform
                                </p>
                            </div>
                            <div>
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                                    <Store size={24} />
                                </div>
                                <h4 className="font-bold mb-2">Approve Vendors</h4>
                                <p className="text-sm text-orange-100">
                                    Review and approve vendor applications
                                </p>
                            </div>
                            <div>
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                                    <TrendingUp size={24} />
                                </div>
                                <h4 className="font-bold mb-2">Monitor Growth</h4>
                                <p className="text-sm text-orange-100">
                                    Track platform metrics and user engagement
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
