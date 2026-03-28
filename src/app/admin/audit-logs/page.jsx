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
    Shield,
    ChevronDown
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import adminApi from "@/app/lib/adminApi";
import { Loader2 } from "lucide-react";

const Badge = ({ children, variant = "default" }) => {
    const variants = {
        default: "bg-slate-100 text-slate-600 border-slate-200",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        danger: "bg-rose-50 text-rose-700 border-rose-200",
        info: "bg-blue-50 text-blue-700 border-blue-200",
        purple: "bg-purple-50 text-purple-700 border-purple-200"
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${variants[variant]}`}>
            {children}
        </span>
    );
};

const getActivityConfig = (action) => {
    switch (action) {
        case 'LOGIN':
        case 'LOGOUT':
            return { icon: Key, variant: 'info', label: action };
        case 'APPROVE_VENDOR':
        case 'REACTIVATE_USER':
        case 'REACTIVATE_VENDOR':
            return { icon: CheckCircle, variant: 'success', label: action.replace('_', ' ') };
        case 'REJECT_VENDOR':
        case 'SUSPEND_USER':
        case 'SUSPEND_VENDOR':
            return { icon: AlertCircle, variant: 'warning', label: action.replace('_', ' ') };
        case 'BAN_USER':
        case 'DELETE_ADMIN':
            return { icon: XCircle, variant: 'danger', label: action.replace('_', ' ') };
        case 'UPDATE_COMMISSION':
        case 'CITY_FEE':
            return { icon: DollarSign, variant: 'purple', label: action.replace('_', ' ') };
        default:
            return { icon: Settings, variant: 'default', label: action };
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
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Audit Logs</h1>
                            <div className="h-0.5 w-6 bg-orange-500 rounded-full mt-1" />
                            <p className="text-sm text-slate-500 mt-1.5 font-medium">Platform-wide administrative activity history.</p>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg text-xs font-bold uppercase tracking-widest italic">
                            <Shield size={14} className="text-orange-500" />
                            <span>{total.toLocaleString()} Events Tracked</span>
                        </div>
                    </div>

                    {/* Filter Toolbar */}
                    <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col lg:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input
                                type="text"
                                placeholder="Search by admin name or event details..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-md outline-none text-sm focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                            />
                        </div>

                        <div className="flex gap-2">
                            <div className="relative min-w-[160px]">
                                <select
                                    value={filters.action}
                                    onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                                    className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-md text-xs font-bold uppercase tracking-tight outline-none focus:ring-1 focus:ring-slate-900 appearance-none cursor-pointer"
                                >
                                    <option value="">All Action Types</option>
                                    <option value="LOGIN">Admin Login</option>
                                    <option value="APPROVE_VENDOR">Approve Vendor</option>
                                    <option value="REJECT_VENDOR">Reject Vendor</option>
                                    <option value="SUSPEND_VENDOR">Suspend Vendor</option>
                                    <option value="REACTIVATE_VENDOR">Reactivate Vendor</option>
                                    <option value="SUSPEND_USER">Suspend User</option>
                                    <option value="BAN_USER">Ban User</option>
                                    <option value="REACTIVATE_USER">Reactivate User</option>
                                    <option value="UPDATE_COMMISSION">Update Commission</option>
                                    <option value="CITY_FEE">Fee Adjustment</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>

                            <div className="relative min-w-[140px]">
                                <select
                                    value={filters.targetType}
                                    onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
                                    className="w-full h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-md text-xs font-bold uppercase tracking-tight outline-none focus:ring-1 focus:ring-slate-900 appearance-none cursor-pointer"
                                >
                                    <option value="">Target: All</option>
                                    <option value="Vendor">Vendor</option>
                                    <option value="User">User</option>
                                    <option value="System">System</option>
                                    <option value="Location">Location</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            
                            <button
                                onClick={() => setFilters({ action: "", targetType: "", search: "" })}
                                className="h-9 px-3 bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition-colors text-xs font-bold flex items-center gap-1.5"
                                title="Reset Filters"
                            >
                                <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
                                <span>Reset</span>
                            </button>
                        </div>
                    </div>

                    {/* Table Area */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col min-h-[500px]">
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Timestamp</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Administrator</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Action</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Event Highlights</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider text-right">Origin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="animate-spin text-slate-400" size={24} />
                                                    <p className="text-xs text-slate-400 font-medium">Syncing activity logs...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : activities.length > 0 ? (
                                        activities.map((activity) => {
                                            const config = getActivityConfig(activity.action);
                                            const Icon = config.icon;
                                            return (
                                                <tr key={activity._id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-2.5 text-slate-400 group-hover:text-slate-600 transition-colors">
                                                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center border border-slate-200">
                                                                <Clock size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-900 leading-none">{new Date(activity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                                <p className="text-[10px] font-semibold text-slate-400 uppercase mt-1 tracking-tight">{new Date(activity.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded border border-slate-200 bg-white flex items-center justify-center text-[11px] font-bold text-slate-600 uppercase">
                                                                {activity.adminId?.name?.split(' ').map(n => n[0]).join('') || 'S'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-slate-900 leading-none truncate">{activity.adminId?.name || 'System'}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{activity.adminId?.role || 'SYSTEM'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant={config.variant}>
                                                            <Icon size={12} strokeWidth={2.5} />
                                                            {config.label}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="max-w-md">
                                                            <p className="text-xs font-semibold text-slate-600 leading-relaxed truncate group-hover:whitespace-normal transition-all" title={activity.details}>
                                                                {activity.details}
                                                            </p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">
                                                                Type: {activity.targetType}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {activity.ipAddress ? (
                                                            <div className="inline-flex items-center gap-2 bg-slate-50 px-2 py-1 rounded border border-slate-100" title={activity.userAgent}>
                                                                <div className="text-right">
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">IP Address</p>
                                                                    <p className="text-[10px] font-bold text-slate-900 mt-0.5">{activity.ipAddress}</p>
                                                                </div>
                                                                <Info size={12} className="text-slate-300" />
                                                            </div>
                                                        ) : <span className="text-[10px] font-bold text-slate-300 italic">Internal</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-24 text-center">
                                                <div className="flex flex-col items-center opacity-30 grayscale mb-2">
                                                    <Activity size={40} className="text-slate-300" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-500 tracking-tight">No activity logs found matching your criteria</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                showing {activities.length} of {total} events
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={page === 1 || loading}
                                    onClick={() => setPage(p => p - 1)}
                                    className="h-8 w-8 flex items-center justify-center bg-white border border-slate-200 rounded-md text-slate-400 hover:text-slate-900 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <div className="px-3 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700">
                                    {page} <span className="text-slate-300 mx-1.5">/</span> {totalPages || 1}
                                </div>
                                <button
                                    disabled={page >= totalPages || loading}
                                    onClick={() => setPage(p => p + 1)}
                                    className="h-8 w-8 flex items-center justify-center bg-white border border-slate-200 rounded-md text-slate-400 hover:text-slate-900 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute >
    );
}
