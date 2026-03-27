"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Percent,
    Wallet,
    Calendar,
    Search,
    X,
    Loader2,
    Eye,
    ChevronDown,
    TrendingUp,
    Store,
    DollarSign,
    CheckCircle2,
    RefreshCw,
    Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";

const StatTile = ({ icon: Icon, label, value, loading, accentColor = "slate" }) => (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 bg-${accentColor}-50 text-${accentColor}-600 border border-${accentColor}-100`}>
            <Icon size={18} />
        </div>
        <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
            {loading ? (
                <div className="h-6 w-24 bg-slate-100 animate-pulse rounded" />
            ) : (
                <p className="text-xl font-bold text-slate-900 leading-none">₦{value.toLocaleString()}</p>
            )}
        </div>
    </div>
);

export default function CommissionLedgerPage() {
    const router = useRouter();

    const [ledgerData, setLedgerData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: ""
    });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchLedger = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.getCommissionLedger(filters);
            setLedgerData(data.data?.ledger || []);
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
            toast.success("Ledger synchronized");
        } catch (error) {
            toast.error("Sync failed");
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLedger();
    }, [fetchLedger]);

    const formatCurrency = (val) => `₦${(val || 0).toLocaleString()}`;

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-4">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Commission Ledger</h1>
                            <p className="text-sm text-slate-500 mt-0.5">Financial breakdown of platform revenue and delivery earnings</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
                                RefreshSync
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StatTile
                            icon={Percent}
                            label="Commission Earned"
                            value={summary?.totalCommissionEarned || 0}
                            accentColor="indigo"
                            loading={loading}
                        />
                        <StatTile
                            icon={TrendingUp}
                            label="Delivery Fees Held"
                            value={summary?.totalDeliveryFeesHeld || 0}
                            accentColor="emerald"
                            loading={loading}
                        />
                        <StatTile
                            icon={DollarSign}
                            label="Combined Revenue"
                            value={summary?.combinedPlatformRevenue || 0}
                            accentColor="orange"
                            loading={loading}
                        />
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row items-end gap-3 shadow-sm">
                        <div className="flex-1 w-full space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Date Range Start</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-md outline-none text-sm focus:ring-1 focus:ring-slate-900 transition-all font-medium"
                                />
                            </div>
                        </div>
                        <div className="flex-1 w-full space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Date Range End</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-md outline-none text-sm focus:ring-1 focus:ring-slate-900 transition-all font-medium"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchLedger}
                                className="h-9 px-6 bg-slate-900 text-white text-xs font-bold rounded-md hover:bg-slate-800 transition-colors uppercase tracking-wider"
                            >
                                Generate
                            </button>
                            {(filters.startDate || filters.endDate) && (
                                <button
                                    onClick={() => setFilters({ startDate: "", endDate: "" })}
                                    className="w-9 h-9 bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-md flex items-center justify-center transition-colors border border-transparent hover:border-rose-100"
                                    title="Reset filters"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Order Reference</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Date</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Involved Vendors</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Subtotal</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Commission</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Delivery (Held)</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider text-right">Total Order</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="py-12">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="animate-spin text-slate-400" size={24} />
                                                    <p className="text-xs text-slate-400 font-medium tracking-wide">Fetching ledger entries...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : ledgerData.length > 0 ? (
                                        ledgerData.map((row) => (
                                            <tr key={row._id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-4 bg-orange-500 rounded-full" />
                                                        <span className="font-bold text-sm text-slate-900 font-mono">{row.orderId}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-slate-700">{new Date(row.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        <span className="text-[10px] text-slate-400">{new Date(row.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {row.vendorOrders?.map((vo, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-semibold border border-slate-200">
                                                                {vo.restaurantId?.storeName || "Unknown Vendor"}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-slate-500">{formatCurrency(row.subtotal)}</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-bold text-slate-900">{formatCurrency(row.commissionTotal)}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-slate-500">{formatCurrency(row.deliveryFeeHeld)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-sm font-bold text-slate-900">{formatCurrency(row.total)}</span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center">
                                                <div className="max-w-[200px] mx-auto opacity-40 grayscale mb-3">
                                                    <Percent size={40} className="mx-auto text-slate-300" />
                                                </div>
                                                <p className="text-sm text-slate-500 font-medium">No ledger entries found</p>
                                                <p className="text-xs text-slate-400 mt-1">Try adjusting your date range filters</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
