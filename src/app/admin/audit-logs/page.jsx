"use client";

import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    Clock,
    Key,
    CheckCircle,
    AlertCircle,
    XCircle,
    DollarSign,
    Settings,
    Search,
    ChevronLeft,
    ChevronRight,
    Info,
    RefreshCcw,
    Shield,
    ChevronDown,
    ClipboardList
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import adminApi from "@/app/lib/adminApi";
import { Loader2 } from "lucide-react";

// ─── Shared Components ─────────────────────────────────────────────────────────
const Badge = ({ children, variant = "default" }) => {
    const variants = {
        default: "bg-slate-50 text-slate-600 border-slate-200",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        danger: "bg-rose-50 text-rose-700 border-rose-200",
        info: "bg-blue-50 text-blue-700 border-blue-200",
        purple: "bg-purple-50 text-purple-700 border-purple-200",
        orange: "bg-orange-50 text-orange-700 border-orange-200"
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold border uppercase tracking-widest ${variants[variant] || variants.default}`}>
            {children}
        </span>
    );
};

const TableCard = ({ children }) => (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
        <div className="h-0.5 bg-gradient-to-r from-orange-500 to-amber-400 shrink-0" />
        <div className="flex-1 overflow-x-auto">{children}</div>
    </div>
);

const Th = ({ children, right, center }) => (
    <th className={`px-4 py-2.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.15em] bg-slate-50 border-b border-slate-100 ${right ? "text-right" : ""} ${center ? "text-center" : ""}`}>
        {children}
    </th>
);

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
                <div className="space-y-5">
                    {/* ── HEADER ────────────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-md shadow-orange-200 shrink-0">
                                    <ClipboardList size={17} className="text-white" />
                                </div>
                                <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                                    Audit Logs
                                </h1>
                                <span className="hidden md:inline text-[9px] font-extrabold px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-200 uppercase tracking-widest">
                                    System Compliance
                                </span>
                            </div>
                            <div className="flex items-center gap-2 ml-12">
                                <div className="h-0.5 w-8 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" />
                                <p className="text-xs text-slate-500 font-medium leading-snug">
                                    Platform-wide administrative activity history and security tracking.
                                </p>
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800 shrink-0">
                            <Shield size={14} className="text-orange-400" />
                            <span className="text-xs font-extrabold uppercase tracking-widest">{total.toLocaleString()} Events Tracked</span>
                        </div>
                    </div>

                    {/* ── TOOLBAR (Search & Filters) ───────────────────────── */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col lg:flex-row gap-3 shadow-sm">
                        <div className="flex-1 relative group w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Search by admin name or event details..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all text-slate-800"
                            />
                        </div>

                        <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                            <div className="relative flex-1 md:flex-none">
                                <select
                                    value={filters.action}
                                    onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                                    className="w-full h-10 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-extrabold uppercase tracking-wider outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 appearance-none cursor-pointer text-slate-600 min-w-[160px]"
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

                            <div className="relative flex-1 md:flex-none">
                                <select
                                    value={filters.targetType}
                                    onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
                                    className="w-full h-10 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-extrabold uppercase tracking-wider outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 appearance-none cursor-pointer text-slate-600 min-w-[140px]"
                                >
                                    <option value="">Target: All</option>
                                    <option value="Vendor">Vendor</option>
                                    <option value="User">User</option>
                                    <option value="System">System</option>
                                    <option value="Location">Location</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            
                            <AnimatePresence>
                                {(filters.action || filters.targetType || filters.search) && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onClick={() => setFilters({ action: "", targetType: "", search: "" })}
                                        className="h-10 px-4 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-extrabold tracking-widest text-[10px] uppercase transition-colors border border-rose-200 flex items-center gap-1.5 shrink-0"
                                    >
                                        <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
                                        <span>Reset</span>
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* ── TABLE AREA ────────────────────────────────────────── */}
                    <TableCard>
                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    <Th>Timestamp</Th>
                                    <Th>Administrator</Th>
                                    <Th>Action</Th>
                                    <Th>Event Highlights</Th>
                                    <Th right>Origin</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    /* Skeleton rows */
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-4 py-4 flex items-center gap-2"><div className="w-8 h-8 rounded bg-slate-100 shrink-0" /><div className="h-4 bg-slate-100 rounded-md w-24" /></td>
                                            <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded-md w-3/4" /></td>
                                            <td className="px-4 py-4"><div className="h-6 bg-slate-100 rounded-full w-28" /></td>
                                            <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded-md w-[80%]" /></td>
                                            <td className="px-4 py-4 flex justify-end"><div className="h-6 w-20 bg-slate-100 rounded-md" /></td>
                                        </tr>
                                    ))
                                ) : activities.length > 0 ? (
                                    activities.map((activity) => {
                                        const config = getActivityConfig(activity.action);
                                        const Icon = config.icon;
                                        return (
                                            <tr key={activity._id} className="hover:bg-orange-50/40 transition-colors group">
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-3 text-slate-400 group-hover:text-orange-500 transition-colors">
                                                        <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-white flex items-center justify-center border border-slate-200 shadow-sm shrink-0 transition-colors">
                                                            <Clock size={15} className="group-hover:text-orange-500 text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors leading-none">{new Date(activity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">{new Date(activity.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-xs font-extrabold text-orange-500 uppercase">
                                                            {activity.adminId?.name?.split(' ').map(n => n[0]).join('') || 'S'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-extrabold text-slate-900 leading-none truncate">{activity.adminId?.name || 'System'}</p>
                                                            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-1.5">{activity.adminId?.role || 'SYSTEM'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <Badge variant={config.variant}>
                                                        <Icon size={12} strokeWidth={2.5} />
                                                        {config.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="max-w-[18rem] md:max-w-md">
                                                        <p className="text-xs font-bold text-slate-700 leading-relaxed truncate group-hover:whitespace-normal group-hover:text-slate-900 transition-colors" title={activity.details}>
                                                            {activity.details}
                                                        </p>
                                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase mt-1.5 tracking-widest">
                                                            Target System: <span className="text-slate-500">{activity.targetType}</span>
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    {activity.ipAddress ? (
                                                        <div className="inline-flex items-center gap-2.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                                            <div className="text-right">
                                                                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">IP Address</p>
                                                                <p className="text-[10px] font-bold text-slate-900 font-mono tracking-tight">{activity.ipAddress}</p>
                                                            </div>
                                                            <Info size={14} className="text-orange-400" />
                                                        </div>
                                                    ) : <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest italic bg-slate-50 px-3 py-1 rounded-full border border-transparent">Internal Subroutine</span>}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-24 text-center">
                                            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Activity size={32} className="text-slate-300" />
                                            </div>
                                            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide mb-1">No Activity Found</h3>
                                            <p className="text-xs text-slate-500 font-medium tracking-tight">System operations matching your criteria emerged empty.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        
                        {/* ── PAGINATION SYSTEM ────────────────────────────────── */}
                        <div className="mt-auto px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                Showing {activities.length} of <span className="text-slate-600">{total}</span> events
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={page === 1 || loading}
                                    onClick={() => setPage(p => p - 1)}
                                    className="h-9 w-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 shadow-sm disabled:opacity-50 disabled:hover:text-slate-400 disabled:hover:border-slate-200 disabled:hover:bg-white transition-all"
                                >
                                    <ChevronLeft size={16} strokeWidth={2.5} />
                                </button>
                                <div className="px-4 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-xs font-extrabold text-slate-700 shadow-sm">
                                    {page} <span className="text-slate-300 mx-2">/</span> {totalPages || 1}
                                </div>
                                <button
                                    disabled={page >= totalPages || loading}
                                    onClick={() => setPage(p => p + 1)}
                                    className="h-9 w-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 shadow-sm disabled:opacity-50 disabled:hover:text-slate-400 disabled:hover:border-slate-200 disabled:hover:bg-white transition-all"
                                >
                                    <ChevronRight size={16} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    </TableCard>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute >
    );
}
