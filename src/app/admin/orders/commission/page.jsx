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
    CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";

const StatCard = ({ icon: Icon, label, value, color, loading }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 border border-gray-100 hover:shadow-xl transition-all group"
    >
        <div className="flex items-center gap-6">
            <div className={`p-4 rounded-[28px] ${color} shadow-lg shadow-${color.split('-')[1]}-100 rotate-6 group-hover:rotate-0 transition-transform`}>
                <Icon size={32} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
                {loading ? (
                    <Loader2 size={24} className="animate-spin text-gray-300" />
                ) : (
                    <h3 className="text-3xl font-black text-gray-900 leading-none">₦{value.toLocaleString()}</h3>
                )}
            </div>
        </div>
    </motion.div>
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

    useEffect(() => {
        fetchLedger();
    }, [fetchLedger]);

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-10">
                    {/* Header */}
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2">Commission Ledger</h1>
                        <p className="text-gray-500 font-medium tracking-tight">Financial breakdown of platform revenue and delivery earnings</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <StatCard
                            icon={Percent}
                            label="Total Commission Earned"
                            value={summary?.totalCommissionEarned || 0}
                            color="bg-purple-500"
                            loading={loading}
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Total Delivery Fees Held"
                            value={summary?.totalDeliveryFeesHeld || 0}
                            color="bg-blue-500"
                            loading={loading}
                        />
                        <StatCard
                            icon={DollarSign}
                            label="Combined Platform Revenue"
                            value={summary?.combinedPlatformRevenue || 0}
                            color="bg-orange-500"
                            loading={loading}
                        />
                    </div>

                    {/* Date Filters */}
                    <div className="flex flex-col md:flex-row items-end gap-4 p-8 bg-white border border-gray-100 rounded-[32px] shadow-sm">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Start Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full h-14 pl-14 pr-6 bg-gray-50 border border-transparent focus:bg-white focus:border-orange-500 rounded-2xl outline-none font-semibold transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">End Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full h-14 pl-14 pr-6 bg-gray-50 border border-transparent focus:bg-white focus:border-orange-500 rounded-2xl outline-none font-semibold transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <button
                                onClick={fetchLedger}
                                className="h-14 px-10 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-100 uppercase tracking-[0.1em] text-[11px]"
                            >
                                Generate Report
                            </button>
                            {(filters.startDate || filters.endDate) && (
                                <button
                                    onClick={() => setFilters({ startDate: "", endDate: "" })}
                                    className="w-14 h-14 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl flex items-center justify-center transition-all border border-rose-100"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white border border-gray-200 rounded-[40px] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-8 py-6 text-[11px] font-black uppercase text-gray-400 tracking-widest">Order ID</th>
                                        <th className="px-8 py-6 text-[11px] font-black uppercase text-gray-400 tracking-widest text-center">Date</th>
                                        <th className="px-8 py-6 text-[11px] font-black uppercase text-gray-400 tracking-widest">Vendors</th>
                                        <th className="px-8 py-6 text-[11px] font-black uppercase text-gray-400 tracking-widest">Subtotal</th>
                                        <th className="px-8 py-6 text-[11px] font-black uppercase text-gray-400 tracking-widest">Platform Commission</th>
                                        <th className="px-8 py-6 text-[11px] font-black uppercase text-gray-400 tracking-widest">Delivery Fees (Held)</th>
                                        <th className="px-8 py-6 text-[11px] font-black uppercase text-gray-400 tracking-widest">Total Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr><td colSpan="7" className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" size={32} /></td></tr>
                                    ) : ledgerData.length > 0 ? (
                                        ledgerData.map((row) => (
                                            <tr key={row._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                        <span className="font-black text-orange-600 font-mono tracking-tighter">{row.orderId}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center text-xs font-bold text-gray-400 uppercase">
                                                    {new Date(row.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-1.5 flex-wrap max-w-[200px]">
                                                        {row.vendorOrders?.map((vo, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[9px] font-bold uppercase tracking-widest">
                                                                {vo.restaurantId?.storeName?.toString()?.slice(0, 10)}...
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 font-bold text-gray-400">₦{row.subtotal?.toLocaleString()}</td>
                                                <td className="px-8 py-6">
                                                    <span className="text-orange-600 font-black tracking-tight">
                                                        ₦{row.commissionTotal?.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 font-bold text-gray-900">₦{row.deliveryFeeHeld?.toLocaleString()}</td>
                                                <td className="px-8 py-6">
                                                    <span className="font-black text-gray-950 text-lg">₦{row.total?.toLocaleString()}</span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="7" className="p-20 text-center text-gray-400 font-medium">No ledger entries found for the selected period.</td></tr>
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
