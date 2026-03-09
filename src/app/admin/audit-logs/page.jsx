"use client";

import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    Clock,
    User,
    Key,
    CheckCircle,
    AlertCircle,
    XCircle,
    DollarSign,
    Settings,
    Search,
    Filter,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Info,
    RefreshCcw,
    Shield
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import adminApi from "@/app/lib/adminApi";
import { Loader2 } from "lucide-react";

const getActivityConfig = (action) => {
    switch (action) {
        case 'LOGIN':
        case 'LOGOUT':
            return { icon: Key, color: 'text-blue-500 bg-blue-50', label: action };
        case 'APPROVE_VENDOR':
        case 'REACTIVATE_USER':
        case 'REACTIVATE_VENDOR':
            return { icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50', label: action.replace('_', ' ') };
        case 'REJECT_VENDOR':
        case 'SUSPEND_USER':
        case 'SUSPEND_VENDOR':
            return { icon: AlertCircle, color: 'text-amber-500 bg-amber-50', label: action.replace('_', ' ') };
        case 'BAN_USER':
        case 'DELETE_ADMIN':
            return { icon: XCircle, color: 'text-rose-500 bg-rose-50', label: action.replace('_', ' ') };
        case 'UPDATE_COMMISSION':
        case 'CITY_FEE':
            return { icon: DollarSign, color: 'text-purple-500 bg-purple-50', label: action.replace('_', ' ') };
        default:
            return { icon: Settings, color: 'text-gray-500 bg-gray-50', label: action };
    }
};

export default function AuditLogsPage() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({
        action: "",
        targetType: "",
        search: ""
    });

    const fetchActivities = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.getActivities({
                page,
                limit: 15,
                ...filters
            });
            setActivities(data.activities || []);
            setTotal(data.total || 0);
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const totalPages = Math.ceil(total / 15);

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <a href="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                    <ArrowLeft size={20} className="text-gray-400" />
                                </a>
                                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">Audit Logs</h1>
                            </div>
                            <p className="text-gray-500 font-bold ml-11">
                                Comprehensive history of administrative actions on GrubDash
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gray-100/50 p-2 rounded-2xl flex items-center gap-2 border border-gray-100"
                        >
                            <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                                <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                                    <Shield size={16} />
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Events</div>
                                    <div className="text-lg font-black text-gray-900 leading-none">{total.toLocaleString()}</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Filter Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-4 rounded-[32px] border border-gray-200 shadow-sm flex flex-wrap items-center gap-4"
                    >
                        {/* Search */}
                        <div className="flex-1 min-w-[300px] relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by details or admin name..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full h-14 pl-14 pr-6 bg-gray-50 border border-gray-100 rounded-2xl focus:border-orange-500 outline-none font-bold text-sm text-gray-900 transition-all placeholder:text-gray-400"
                            />
                        </div>

                        {/* Action Filter */}
                        <div className="relative min-w-[200px]">
                            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                value={filters.action}
                                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                                className="w-full h-14 pl-14 pr-10 bg-gray-50 border border-gray-100 rounded-2xl focus:border-orange-500 outline-none font-bold text-sm text-gray-900 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">All Actions</option>
                                <option value="LOGIN">Admin Login</option>
                                <option value="APPROVE_VENDOR">Approve Vendor</option>
                                <option value="REJECT_VENDOR">Reject Vendor</option>
                                <option value="SUSPEND_VENDOR">Suspend Vendor</option>
                                <option value="REACTIVATE_VENDOR">Reactivate Vendor</option>
                                <option value="SUSPEND_USER">Suspend User</option>
                                <option value="BAN_USER">Ban User</option>
                                <option value="REACTIVATE_USER">Reactivate User</option>
                                <option value="UPDATE_COMMISSION">Update Commission</option>
                                <option value="CITY_FEE">City Fee Adjustment</option>
                            </select>
                        </div>

                        {/* Target Type Filter */}
                        <div className="relative min-w-[200px]">
                            <select
                                value={filters.targetType}
                                onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
                                className="w-full h-14 pl-6 pr-10 bg-gray-50 border border-gray-100 rounded-2xl focus:border-orange-500 outline-none font-bold text-sm text-gray-900 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Target: All</option>
                                <option value="Vendor">Vendor</option>
                                <option value="User">User</option>
                                <option value="System">System</option>
                                <option value="Location">Location</option>
                            </select>
                        </div>
                    </motion.div>

                    {/* Logs Table Area */}
                    <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-50">
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-left">Timestamp</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-left">Administrator</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-left">Action</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-left">Event Details</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-left">Metadata</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence mode="wait">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="5" className="py-32">
                                                    <div className="flex flex-col items-center justify-center gap-4 text-gray-400">
                                                        <Loader2 size={48} className="animate-spin text-orange-500" />
                                                        <span className="font-black uppercase tracking-[0.2em] text-sm">Synchronizing Audit Log...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : activities.length > 0 ? (
                                            activities.map((activity, index) => {
                                                const config = getActivityConfig(activity.action);
                                                const Icon = config.icon;
                                                return (
                                                    <motion.tr
                                                        key={activity._id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.03 }}
                                                        className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors group/row"
                                                    >
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-gray-100 text-gray-400 rounded-lg">
                                                                    <Clock size={16} />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-black text-gray-900">
                                                                        {new Date(activity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                    </div>
                                                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                                                        {new Date(activity.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-black text-xs uppercase shadow-sm">
                                                                    {activity.adminId?.name?.split(' ').map(n => n[0]).join('') || 'S'}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-black text-gray-900 lowercase first-letter:uppercase">{activity.adminId?.name || 'System'}</div>
                                                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{activity.adminId?.role || 'SYSTEM_PROC'}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-black/5 ${config.color}`}>
                                                                <Icon size={14} strokeWidth={2.5} />
                                                                <span className="text-[10px] font-black tracking-widest uppercase">{config.label}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="max-w-md">
                                                                <p className="text-sm font-bold text-gray-700 leading-relaxed">{activity.details}</p>
                                                                <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-1 opacity-60">
                                                                    Target: {activity.targetType}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            {(activity.ipAddress || activity.userAgent) ? (
                                                                <div className="flex items-center gap-2 group/meta cursor-help" title={activity.userAgent}>
                                                                    <div className="p-2 bg-gray-50 text-gray-400 rounded-lg border border-gray-100 group-hover/meta:border-orange-200 group-hover/meta:bg-orange-50 group-hover/meta:text-orange-500 transition-all">
                                                                        <Info size={16} />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">IP Address</div>
                                                                        <div className="text-[11px] font-black text-gray-900 mt-1">{activity.ipAddress || 'Internal'}</div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">-- No Metadata --</span>
                                                            )}
                                                        </td>
                                                    </motion.tr>
                                                )
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="py-32">
                                                    <div className="flex flex-col items-center justify-center gap-6 text-gray-300">
                                                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                                                            <Activity size={48} className="text-gray-200" />
                                                        </div>
                                                        <div className="text-center">
                                                            <h3 className="text-lg font-black text-gray-400 uppercase tracking-tight">No events found</h3>
                                                            <p className="text-sm font-bold mt-1 max-w-xs mx-auto">Try adjusting your filters to find the logs you're looking for.</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setFilters({ action: "", targetType: "", search: "" })}
                                                            className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase text-gray-500 hover:bg-gray-50 transition-all"
                                                        >
                                                            Reset All Filters
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-8 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between">
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                Showing {activities.length} of {total} events
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={page === 1 || loading}
                                    onClick={() => setPage(p => p - 1)}
                                    className="w-12 h-12 flex items-center justify-center bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-orange-600 disabled:opacity-50 transition-all shadow-sm"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="px-6 h-12 flex items-center justify-center bg-white border border-gray-200 rounded-2xl text-sm font-black text-gray-900 shadow-sm">
                                    Page {page} <span className="text-gray-300 mx-2">/</span> {totalPages || 1}
                                </div>
                                <button
                                    disabled={page >= totalPages || loading}
                                    onClick={() => setPage(p => p + 1)}
                                    className="w-12 h-12 flex items-center justify-center bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-orange-600 disabled:opacity-50 transition-all shadow-sm"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute >
    );
}
