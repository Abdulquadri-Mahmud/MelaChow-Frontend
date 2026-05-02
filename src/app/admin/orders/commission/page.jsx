"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Percent,
    TrendingUp,
    DollarSign,
    Calendar,
    X,
    Loader2,
    Eye,
    ChevronDown,
    Store,
    RefreshCw,
    BarChart3,
    ArrowUpRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, loading, variant = "default" }) => {
    const variants = {
        default: {
            wrap:   "bg-white border-slate-200",
            strip:  "from-slate-300 to-slate-400",
            iconBg: "bg-slate-100 text-slate-600",
            val:    "text-slate-900",
        },
        emerald: {
            wrap:   "bg-gradient-to-br from-emerald-50/60 to-white border-emerald-200",
            strip:  "from-emerald-400 to-teal-400",
            iconBg: "bg-emerald-100 text-emerald-600",
            val:    "text-emerald-700",
        },
        orange: {
            wrap:   "bg-gradient-to-br from-orange-50/70 to-white border-orange-200",
            strip:  "from-orange-500 to-amber-400",
            iconBg: "bg-orange-100 text-orange-600",
            val:    "text-orange-600",
        },
    };
    const v = variants[variant];

    return (
        <div className={`relative rounded-xl border overflow-hidden shadow-sm ${v.wrap}`}>
            <div className={`h-0.5 bg-gradient-to-r ${v.strip}`} />
            <div className="p-4 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${v.iconBg}`}>
                    <Icon size={19} />
                </div>
                <div className="min-w-0">
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.18em] mb-1 leading-none">{label}</p>
                    {loading ? (
                        <div className="h-6 w-28 bg-slate-100 animate-pulse rounded-md" />
                    ) : (
                        <p className={`text-xl font-extrabold leading-none ${v.val}`}>₦{(value || 0).toLocaleString()}</p>
                    )}
                </div>
                <div className={`ml-auto w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${v.iconBg} opacity-40`}>
                    <ArrowUpRight size={14} />
                </div>
            </div>
        </div>
    );
};

export default function CommissionLedgerPage() {
    const router = useRouter();

    const [ledgerData, setLedgerData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ startDate: "", endDate: "" });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchLedger = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.getCommissionLedger(filters);
            setLedgerData(data.data?.orders || []);
            setSummary(data.data?.summary || null);
        } catch (error) {
            console.error(error);
            toast.error("Could not load commission ledger");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchLedger();
            toast.success("Ledger refreshed");
        } catch {
            toast.error("Refresh failed");
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => { fetchLedger(); }, [fetchLedger]);

    const fmt = (val) => `₦${(val || 0).toLocaleString()}`;
    const hasFilters = filters.startDate || filters.endDate;

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-5">

                    {/* ── PAGE HEADER ──────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-md shadow-orange-200 shrink-0">
                                    <Percent size={17} className="text-white" />
                                </div>
                                <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                                    Revenue Ledger
                                </h1>
                                <span className="hidden md:inline text-[9px] font-extrabold px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-200 uppercase tracking-widest">
                                    Paid Orders
                                </span>
                            </div>
                            <div className="flex items-center gap-2 ml-12">
                                <div className="h-0.5 w-8 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" />
                                <p className="text-xs text-slate-500 font-medium leading-snug">
                                    See what each paid order brought in and what the platform kept.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-orange-200 hover:from-orange-600 hover:to-amber-500 transition-all disabled:opacity-60"
                        >
                            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
                            {isRefreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    {/* ── STAT CARDS ───────────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StatCard
                            icon={Percent}
                            label="Commission Earned"
                            value={summary?.totalCommissionEarned}
                            variant="default"
                            loading={loading}
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Delivery Profit"
                            value={summary?.totalDeliverySpread}
                            variant="emerald"
                            loading={loading}
                        />
                        <StatCard
                            icon={DollarSign}
                            label="Platform Share"
                            value={summary?.combinedPlatformRevenue}
                            variant="orange"
                            loading={loading}
                        />
                    </div>

                    {/* ── DATE FILTER BAR ──────────────────────────────────── */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <p className="text-[9px] font-extrabold text-orange-500 uppercase tracking-[0.2em] mb-3">Filter by date</p>
                        <div className="flex flex-col md:flex-row items-end gap-3">
                            {/* Start date */}
                            <div className="flex-1 w-full space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">From</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={13} />
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-medium focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
                                    />
                                </div>
                            </div>

                            {/* End date */}
                            <div className="flex-1 w-full space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">To</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={13} />
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-medium focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={fetchLedger}
                                    className="h-9 px-6 bg-gradient-to-r from-orange-500 to-amber-400 text-white text-xs font-extrabold rounded-lg hover:from-orange-600 hover:to-amber-500 transition-all uppercase tracking-wider shadow-sm shadow-orange-200"
                                >
                                    Generate
                                </button>
                                <AnimatePresence>
                                    {hasFilters && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            onClick={() => setFilters({ startDate: "", endDate: "" })}
                                            className="w-9 h-9 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg flex items-center justify-center transition-colors border border-rose-200"
                                            title="Clear filters"
                                        >
                                            <X size={14} />
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Active filter indicator */}
                        <AnimatePresence>
                            {hasFilters && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 flex items-center gap-2 overflow-hidden"
                                >
                                    <div className="h-0.5 w-4 bg-orange-400 rounded-full" />
                                    <p className="text-[10px] font-bold text-orange-500">
                                        Showing results
                                        {filters.startDate && ` from ${new Date(filters.startDate).toLocaleDateString()}`}
                                        {filters.endDate && ` to ${new Date(filters.endDate).toLocaleDateString()}`}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── DATA TABLE ───────────────────────────────────────── */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Brand top strip */}
                        <div className="h-0.5 bg-gradient-to-r from-orange-500 to-amber-400" />

                        {/* Table header info */}
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={14} className="text-orange-500" />
                                <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Order Money Log</p>
                                {!loading && (
                                    <span className="text-[9px] font-extrabold bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">
                                        {ledgerData.length} entries
                                    </span>
                                )}
                            </div>
                            {loading && (
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <Loader2 size={12} className="animate-spin" />
                                    <span className="text-[10px] font-bold">Loading…</span>
                                </div>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100">
                                        {["Order", "Date", "Restaurants", "Food Total", "Commission", "Delivery Profit", "Order Total"].map((h, i) => (
                                            <th key={h} className={`px-4 py-2.5 text-[9px] font-extrabold uppercase text-slate-400 tracking-[0.15em] ${i === 6 ? "text-right" : ""}`}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        /* Skeleton rows */
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                {Array.from({ length: 7 }).map((_, j) => (
                                                    <td key={j} className="px-4 py-3">
                                                        <div className="h-3.5 bg-slate-100 rounded-md" style={{ width: `${60 + (j * 10) % 40}%` }} />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : ledgerData.length > 0 ? (
                                        ledgerData.map((row) => (
                                            <tr
                                                key={row._id}
                                                onClick={() => router.push(`/admin/orders/${row._id}`)}
                                                className="hover:bg-orange-50/40 transition-colors group cursor-pointer"
                                            >
                                                {/* Order ID */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-1 h-5 bg-gradient-to-b from-orange-500 to-amber-400 rounded-full shrink-0 shadow-[0_0_6px_rgba(251,146,60,0.6)]" />
                                                        <span className="font-extrabold text-sm text-orange-500 font-mono group-hover:text-orange-700 transition-colors">
                                                            {row.orderId}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Date */}
                                                <td className="px-4 py-3">
                                                    <p className="text-xs font-bold text-slate-700 leading-none">
                                                        {new Date(row.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                                                        {new Date(row.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                                                    </p>
                                                </td>

                                                {/* Vendors */}
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {(row.vendorNames || []).map((name, idx) => (
                                                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[9px] font-extrabold">
                                                                <Store size={8} />
                                                                {name || "Unknown"}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>

                                                {/* Subtotal */}
                                                <td className="px-4 py-3 text-sm font-bold text-slate-600">{fmt(row.subtotal)}</td>

                                                {/* Commission */}
                                                <td className="px-4 py-3">
                                                    <span className={`text-sm font-extrabold ${(row.totalCommission || 0) > 0 ? "text-emerald-600" : "text-slate-300"}`}>
                                                        {fmt(row.totalCommission)}
                                                    </span>
                                                </td>

                                                {/* Delivery held */}
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-bold text-indigo-600">{fmt(row.deliverySpread)}</span>
                                                </td>

                                                {/* Total */}
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-sm font-extrabold text-slate-900">{fmt(row.total)}</span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="py-16 text-center">
                                                <div className="w-14 h-14 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                                    <Percent size={26} className="text-orange-300" />
                                                </div>
                                                <p className="text-sm font-extrabold text-slate-500">No ledger entries found</p>
                                                <p className="text-xs text-slate-400 mt-1 font-medium">Try adjusting your date range filters</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Table footer summary */}
                        {!loading && ledgerData.length > 0 && summary && (
                            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                                    {ledgerData.length} record{ledgerData.length !== 1 ? "s" : ""} in view
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Commission</span>
                                        <span className="text-[11px] font-extrabold text-emerald-600">{fmt(summary.totalCommissionEarned)}</span>
                                    </div>
                                    <div className="w-px h-4 bg-slate-200" />
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Delivery Profit</span>
                                        <span className="text-[11px] font-extrabold text-indigo-600">{fmt(summary.totalDeliverySpread)}</span>
                                    </div>
                                    <div className="w-px h-4 bg-slate-200" />
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Platform Share</span>
                                        <span className="text-[11px] font-extrabold text-orange-600">{fmt(summary.combinedPlatformRevenue)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
