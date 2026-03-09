"use client";

import { useState, useEffect, useCallback } from "react";
import {
    DollarSign,
    TrendingUp,
    Wallet,
    FileText,
    Store,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    ChevronLeft,
    ChevronRight,
    Filter,
    Download,
    BarChart3,
    Activity,
    CreditCard,
    ArrowLeft,
    ShoppingBag,
    Truck,
    Hash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend
} from 'recharts';
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";
import Link from "next/link";

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white border border-slate-100 rounded-[32px] p-4 shadow-xl shadow-slate-100/50 relative overflow-hidden group"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-[0.03] rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700`} />
        <div className="relative z-10">
            <div className={`w-14 h-14 ${color.replace('bg-', 'bg-').replace('500', '100')} ${color.replace('bg-', 'text-')} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">₦{value?.toLocaleString()}</h3>
            {subtitle && <p className="text-xs font-bold text-slate-400 mt-2">{subtitle}</p>}
        </div>
    </motion.div>
);

export default function FinancePage() {
    const [activeTab, setActiveTab] = useState("overview");
    const [summary, setSummary] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [vendorBreakdown, setVendorBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartPeriod, setChartPeriod] = useState("7days");
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: ""
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [summaryRes, breakdownRes] = await Promise.all([
                adminApi.getFinanceSummary(filters),
                adminApi.getVendorBreakdown(filters)
            ]);
            setSummary(summaryRes.data);
            const breakdownData = Array.isArray(breakdownRes.data)
                ? breakdownRes.data
                : (breakdownRes.data?.vendors || []);

            const sortedBreakdown = [...breakdownData].sort((a, b) => (b.commissionPaid || 0) - (a.commissionPaid || 0));
            setVendorBreakdown(sortedBreakdown);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load finance data");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const fetchChartData = useCallback(async () => {
        try {
            const res = await adminApi.getFinanceChart(chartPeriod);
            // Extract array from res.data.chart or fallback
            const rawData = Array.isArray(res.data) ? res.data : (res.data?.chart || res.data?.chartData || []);

            // Map keys (label -> date, totalRevenue -> revenue) to match chart component
            const formattedData = rawData.map(item => ({
                ...item,
                date: item.date || item.label || item._id,
                revenue: item.revenue || item.totalRevenue || 0,
                commission: item.commission || 0
            }));

            setChartData(formattedData);
        } catch (err) {
            console.error(err);
        }
    }, [chartPeriod]);

    const fetchTransactions = useCallback(async () => {
        try {
            const res = await adminApi.getTransactions({
                page: currentPage,
                type: typeFilter !== "all" ? typeFilter : "",
                search: searchQuery
            });
            setTransactions(res.data.transactions);
            setTotalPages(res.data.pagination.totalPages);
        } catch (err) {
            console.error(err);
        }
    }, [currentPage, typeFilter, searchQuery]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        fetchChartData();
    }, [fetchChartData]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter uppercase mb-2">Finance Hub</h1>
                            <p className="text-slate-500 font-bold">Platform revenue, commission tracking, and audit-level transparency</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="h-10 pl-9 pr-3 bg-transparent outline-none text-[10px] font-black uppercase tracking-widest text-slate-600 w-36"
                                    />
                                </div>
                                <div className="w-[1px] h-4 bg-slate-100 self-center" />
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="h-10 pl-9 pr-3 bg-transparent outline-none text-[10px] font-black uppercase tracking-widest text-slate-600 w-36"
                                    />
                                </div>
                            </div>
                            <button className="h-13 px-6 bg-slate-900 border border-slate-900 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest text-white hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">
                                <Download size={16} /> Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-100/50 rounded-[28px] w-fit">
                        {[
                            { id: "overview", label: "Overview", icon: BarChart3 },
                            { id: "transactions", label: "Transactions", icon: Activity },
                            { id: "vendors", label: "Vendor Breakdown", icon: Store },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`h-12 px-8 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                    ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                                    : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === "overview" && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-8"
                            >
                                {/* Primary Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <StatCard
                                        title="Platform Balance"
                                        value={summary?.currentPlatformBalance || 0}
                                        icon={Wallet}
                                        color="bg-blue-500"
                                        subtitle="Available for settlement"
                                    />
                                    <StatCard
                                        title="Platform Revenue"
                                        value={summary?.combinedPlatformRevenue || 0}
                                        icon={TrendingUp}
                                        color="bg-orange-500"
                                        subtitle="Total income incl. fees"
                                    />
                                    <StatCard
                                        title="Commission Earned"
                                        value={summary?.totalCommissionEarned || 0}
                                        icon={DollarSign}
                                        color="bg-emerald-500"
                                        subtitle="Gross commission from orders"
                                    />
                                </div>

                                {/* Secondary Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-900 rounded-[20px] p-4 text-white flex items-center justify-between border border-slate-800 shadow-2xl">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Order Sales Volume</p>
                                            <h4 className="text-4xl font-black tracking-tighter">₦{summary?.totalOrderRevenue?.toLocaleString() || 0}</h4>
                                        </div>
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400">
                                            <ShoppingBag size={32} />
                                        </div>
                                    </div>
                                    <div className="bg-white border border-slate-100 rounded-[20px] p-4 flex items-center justify-between shadow-xl shadow-slate-100/50">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Delivery Fees Collected</p>
                                            <h4 className="text-4xl font-black tracking-tighter text-slate-900">₦{summary?.totalDeliveryFeesCollected?.toLocaleString() || 0}</h4>
                                        </div>
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                                            <Truck size={32} />
                                        </div>
                                    </div>
                                </div>

                                {/* Chart Section */}
                                <div className="bg-white border border-slate-100 rounded-[28px] p-3 lg:p-6 shadow-xl shadow-slate-100/50">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                                                <TrendingUp size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">Revenue Flow</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform performance over time</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                                            {[
                                                { id: "7days", label: "7D" },
                                                { id: "30days", label: "30D" },
                                                { id: "3months", label: "3M" },
                                                { id: "12months", label: "1Y" },
                                            ].map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setChartPeriod(p.id)}
                                                    className={`h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chartPeriod === p.id
                                                        ? "bg-white text-slate-900 shadow-md border border-slate-100"
                                                        : "text-slate-400 hover:text-slate-600"
                                                        }`}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-[400px] w-full flex items-center justify-center relative">
                                        {chartData && chartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
                                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis
                                                        dataKey="date"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                                                        tickFormatter={(val) => `₦${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: '#0f172a',
                                                            border: 'none',
                                                            borderRadius: '24px',
                                                            padding: '20px',
                                                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                                        }}
                                                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                                        labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '8px', fontWeight: '900', textTransform: 'uppercase' }}
                                                        formatter={(val) => [`₦${val.toLocaleString()}`, '']}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="revenue"
                                                        stroke="#f97316"
                                                        strokeWidth={4}
                                                        fillOpacity={1}
                                                        fill="url(#colorRevenue)"
                                                        name="Total Revenue"
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="commission"
                                                        stroke="#10b981"
                                                        strokeWidth={4}
                                                        fillOpacity={1}
                                                        fill="url(#colorCommission)"
                                                        name="Commission"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex flex-col items-center gap-4 text-slate-300">
                                                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                                                    <BarChart3 size={32} />
                                                </div>
                                                <p className="text-xs font-black uppercase tracking-widest">No chart data available for this period</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "transactions" && (
                            <motion.div
                                key="transactions"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                {/* Filters */}
                                <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
                                    <div className="relative w-full lg:w-96">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Search by description or reference..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full h-14 pl-14 pr-6 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-slate-900 transition-all font-bold text-slate-900"
                                        />
                                    </div>
                                    <div className="flex gap-4 w-full lg:w-auto">
                                        <div className="flex p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                                            {["all", "credit", "debit"].map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setTypeFilter(type)}
                                                    className={`h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === type
                                                        ? "bg-white text-slate-900 shadow-md border border-slate-100"
                                                        : "text-slate-400 hover:text-slate-600"
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Transactions Table */}
                                <div className="bg-white border border-slate-100 rounded-[20px] shadow-xl shadow-slate-100/50 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50">
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Date / Time</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Description</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Order</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Amount</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Balance</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Type</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {transactions.length > 0 ? (
                                                    transactions.map((tx) => (
                                                        <tr key={tx._id} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="px-8 py-6">
                                                                <p className="font-black text-slate-900 text-sm tracking-tight">{new Date(tx.date || tx.createdAt).toLocaleDateString()}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(tx.date || tx.createdAt).toLocaleTimeString()}</p>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <p className="font-bold text-slate-800 text-sm max-w-xs truncate">{tx.description}</p>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                {(tx.orderId || tx.order?.orderId) ? (
                                                                    <Link
                                                                        href={`/admin/orders/${tx.order?.orderId || tx.orderId}`}
                                                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all transform active:scale-95 border border-orange-100"
                                                                    >
                                                                        <Hash size={10} /> {tx.order?.orderId || tx.orderId}
                                                                    </Link>
                                                                ) : (
                                                                    <span className="text-slate-300 font-bold text-xs">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className={`text-sm font-black ${tx.type === 'credit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {tx.type === 'credit' ? '+' : '-'}₦{tx.amount?.toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6 font-black text-slate-900 text-sm">
                                                                ₦{tx.runningBalance?.toLocaleString()}
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest outline outline-1 outline-offset-2 ${tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600 outline-emerald-100' : 'bg-rose-50 text-rose-600 outline-rose-100'
                                                                    }`}>
                                                                    {tx.type}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                <button className="w-10 h-10 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl flex items-center justify-center transition-all group-hover:shadow-md">
                                                                    <ArrowUpRight size={18} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="7" className="px-8 py-20 text-center">
                                                            <div className="max-w-xs mx-auto text-slate-400">
                                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                                                                    <FileText size={40} />
                                                                </div>
                                                                <h4 className="text-lg font-black text-slate-900 uppercase mb-2">No Transactions</h4>
                                                                <p className="text-xs font-bold leading-relaxed">We couldn&apos;t find any transactions matching your filters.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="px-8 py-6 bg-slate-50/50 flex items-center justify-between border-t border-slate-50">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                                    className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-50 transition-all"
                                                >
                                                    <ChevronLeft size={20} />
                                                </button>
                                                <button
                                                    disabled={currentPage === totalPages}
                                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                                    className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-50 transition-all"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "vendors" && (
                            <motion.div
                                key="vendors"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                <div className="bg-white border border-slate-100 rounded-[20px] shadow-xl shadow-slate-100/50 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50">
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Vendor Name</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Orders</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Commissions Paid</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Vendor Earnings</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest text-right">Delivery Share Generated</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {vendorBreakdown.length > 0 ? (
                                                    vendorBreakdown.map((vendor, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-sm">
                                                                        {vendor.storeName?.[0]?.toUpperCase() || "V"}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-black text-slate-900 text-sm tracking-tight">{vendor.storeName}</p>
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{vendor.category || "General"}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 pt-7">
                                                                <div className="px-3 py-1 bg-slate-100 rounded-lg inline-flex items-center gap-2">
                                                                    <ShoppingBag size={12} className="text-slate-400" />
                                                                    <span className="text-xs font-black text-slate-900">{vendor.orderCount} Orders</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <p className="text-sm font-black text-emerald-600 uppercase tracking-tight">₦{vendor.commissionPaid?.toLocaleString()}</p>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">₦{vendor.vendorEarnings?.toLocaleString()}</p>
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                <p className="text-sm font-black text-blue-600 uppercase tracking-tight">₦{vendor.deliveryShareGenerated?.toLocaleString() || 0}</p>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-8 py-20 text-center">
                                                            <div className="max-w-xs mx-auto text-slate-400">
                                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                                                                    <Store size={40} />
                                                                </div>
                                                                <h4 className="text-lg font-black text-slate-900 uppercase mb-2">No Vendor Data</h4>
                                                                <p className="text-xs font-bold leading-relaxed">Platform revenue data is being calculated. Check back in a few minutes.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
