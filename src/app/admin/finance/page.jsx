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
    Hash,
    Lock
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
    const [escrowList, setEscrowList] = useState([]);
    const [refundList, setRefundList] = useState([]);
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

    const fetchEscrowList = useCallback(async () => {
        try {
            const res = await adminApi.getUnreleasedEscrow({
                page: currentPage,
                search: searchQuery
            });
            setEscrowList(res.data.escrowOrders || []);
            setTotalPages(res.data.pagination?.totalPages || 1);
        } catch (err) {
            console.error(err);
        }
    }, [currentPage, searchQuery]);

    const fetchRefundList = useCallback(async () => {
        try {
            const res = await adminApi.getRefundsList({
                page: currentPage,
                search: searchQuery
            });
            setRefundList(res.data.refunds || []);
            setTotalPages(res.data.pagination?.totalPages || 1);
        } catch (err) {
            console.error(err);
        }
    }, [currentPage, searchQuery]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        fetchChartData();
    }, [fetchChartData]);

    useEffect(() => {
        // Reset page when switching tabs handled by setActiveTab side effects if needed
        if (activeTab === "transactions") fetchTransactions();
        if (activeTab === "escrow") fetchEscrowList();
        if (activeTab === "refunds") fetchRefundList();
    }, [activeTab, fetchTransactions, fetchEscrowList, fetchRefundList]);

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-[1400px] mx-auto space-y-4 pb-20">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                    <div className="flex flex-wrap flex-col sm:flex-row gap-2 p-2 bg-slate-100/50 rounded-[28px] w-full sm:w-fit overflow-x-auto">
                        {[
                            { id: "overview", label: "Overview", icon: BarChart3 },
                            { id: "transactions", label: "Transactions", icon: Activity },
                            { id: "vendors", label: "Vendor Breakdown", icon: Store },
                            { id: "escrow", label: "Escrow Holdings", icon: Lock },
                            { id: "refunds", label: "Refund Audits", icon: FileText },
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard
                                        title="Gross Platform Balance"
                                        value={summary?.currentPlatformBalance || 0}
                                        icon={Wallet}
                                        color="bg-blue-500"
                                        subtitle="Total wallet balance (Incl. Escrow)"
                                    />
                                    <StatCard
                                        title="Active Escrow Hold"
                                        value={summary?.totalEscrowHeld || 0}
                                        icon={Lock}
                                        color="bg-indigo-500"
                                        subtitle="Reserved for vendors"
                                    />
                                    <StatCard
                                        title="Available Balance"
                                        value={summary?.availableBalance || 0}
                                        icon={DollarSign}
                                        color="bg-emerald-500"
                                        subtitle="Net cleared platform funds"
                                    />
                                    <StatCard
                                        title="Platform Revenue"
                                        value={summary?.combinedPlatformRevenue || 0}
                                        icon={TrendingUp}
                                        color="bg-orange-500"
                                        subtitle="Total income incl. fees"
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

                                {/* Chart Section (Premium Dark UI) */}
                                <div className="bg-[#0b1121] border border-slate-800 rounded-[32px] p-4 lg:p-8 shadow-2xl relative overflow-hidden group mt-8">
                                    {/* Ambient Glow Effects */}
                                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>
                                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -ml-40 -mb-40 pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>
                                    
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 relative z-10 border-b border-slate-800/50 pb-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl flex items-center justify-center text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.15)] relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent"></div>
                                                <Activity size={32} className="relative z-10" />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2 flex items-center gap-3">
                                                    Revenue Flow <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                                                </h3>
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Live Platform Trajectory</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 p-1.5 bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-md shadow-inner">
                                            {[
                                                { id: "7days", label: "7D" },
                                                { id: "30days", label: "30D" },
                                                { id: "3months", label: "3M" },
                                                { id: "12months", label: "1Y" },
                                            ].map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setChartPeriod(p.id)}
                                                    className={`h-11 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${chartPeriod === p.id
                                                        ? "bg-indigo-500 text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)] border border-indigo-400/50 scale-105"
                                                        : "text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent"
                                                        }`}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-[450px] w-full flex items-center justify-center relative z-10">
                                        {chartData && chartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#1e293b" opacity={0.6} />
                                                    <XAxis
                                                        dataKey="date"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }}
                                                        dy={20}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }}
                                                        tickFormatter={(val) => `₦${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                                                        dx={-15}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'rgba(15, 23, 42, 0.85)',
                                                            backdropFilter: 'blur(16px)',
                                                            border: '1px solid rgba(255,255,255,0.08)',
                                                            borderRadius: '24px',
                                                            padding: '24px',
                                                            boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.6)'
                                                        }}
                                                        itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '8px' }}
                                                        labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.15em' }}
                                                        formatter={(val, name) => [`₦${val.toLocaleString()}`, name === 'revenue' ? 'GROSS REVENUE' : 'PLATFORM COMMISSION']}
                                                    />
                                                    <Legend 
                                                        verticalAlign="top" 
                                                        height={40}
                                                        iconType="circle"
                                                        wrapperStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.1em' }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="revenue"
                                                        stroke="#6366f1"
                                                        strokeWidth={5}
                                                        fillOpacity={1}
                                                        fill="url(#colorRevenue)"
                                                        name="Gross Revenue"
                                                        activeDot={{ r: 8, fill: '#6366f1', stroke: '#0f172a', strokeWidth: 4 }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="commission"
                                                        stroke="#10b981"
                                                        strokeWidth={5}
                                                        fillOpacity={1}
                                                        fill="url(#colorCommission)"
                                                        name="Platform Commission"
                                                        activeDot={{ r: 8, fill: '#10b981', stroke: '#0f172a', strokeWidth: 4 }}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex flex-col items-center gap-6 text-slate-500">
                                                <div className="w-20 h-20 rounded-full bg-slate-900/50 border border-slate-800 flex items-center justify-center shadow-inner">
                                                    <BarChart3 size={36} className="text-slate-600" />
                                                </div>
                                                <p className="text-xs font-black uppercase tracking-[0.2em]">No chart data available for this period</p>
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

                        {activeTab === "escrow" && (
                            <motion.div
                                key="escrow"
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
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Order ID</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Vendor</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Date</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest text-right">Pending Escrow</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {escrowList.length > 0 ? (
                                                    escrowList.map((escrow, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-3 font-mono text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1.5 w-fit rounded-lg">
                                                                    <Hash size={14} className="text-slate-400" />
                                                                    {escrow.parentOrder?.orderId || "Unknown"}
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 font-bold text-slate-700 text-sm">
                                                                {escrow.vendorInfo?.storeName || "Unknown Vendor"}
                                                            </td>
                                                            <td className="px-8 py-6 text-sm font-semibold text-slate-500">
                                                                {new Date(escrow.createdAt).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-100 text-yellow-700">
                                                                    {escrow.orderStatus.replace(/_/g, " ")}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6 text-right font-black text-slate-900">
                                                                ₦{escrow.escrowAmount?.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-8 py-20 text-center text-slate-400">
                                                            <Lock size={40} className="mx-auto mb-4 text-slate-200" />
                                                            <h4 className="text-lg font-black text-slate-900 uppercase">No Escrow Holdings</h4>
                                                            <p className="text-xs font-bold leading-relaxed mt-1">All vendor food revenue has been released.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Escrow Pagination */}
                                    {totalPages > 1 && (
                                        <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between">
                                            <p className="text-sm font-bold text-slate-400">Page {currentPage} of {totalPages}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-50"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <button
                                                    disabled={currentPage === totalPages}
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-50"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "refunds" && (
                            <motion.div
                                key="refunds"
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
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Order ID</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Refund Reason</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Date</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Commission Retained</th>
                                                    <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-widest text-right">Amount Refunded</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {refundList.length > 0 ? (
                                                    refundList.map((refund, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="px-8 py-6 flex items-center gap-3 font-mono text-sm font-bold text-slate-900">
                                                                <span className="bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center">
                                                                    <FileText size={12} className="text-slate-500" />
                                                                </span>
                                                                {refund.orderId?.orderId || "Missing"}
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <p className="font-bold text-slate-800 text-sm">{refund.reason}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 mt-1 max-w-[200px] truncate">{refund.notes}</p>
                                                            </td>
                                                            <td className="px-8 py-6 text-sm font-semibold text-slate-500">
                                                                {new Date(refund.createdAt).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-8 py-6 font-bold text-emerald-600 text-sm">
                                                                ₦{refund.commissionRetained?.toLocaleString()}
                                                            </td>
                                                            <td className="px-8 py-6 text-right font-black text-red-600">
                                                                ₦{refund.amount?.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-8 py-20 text-center text-slate-400">
                                                            <FileText size={40} className="mx-auto mb-4 text-slate-200" />
                                                            <h4 className="text-lg font-black text-slate-900 uppercase">No Refunds Issued</h4>
                                                            <p className="text-xs font-bold leading-relaxed mt-1">There are no refund audit records.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Refunds Pagination */}
                                    {totalPages > 1 && (
                                        <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between">
                                            <p className="text-sm font-bold text-slate-400">Page {currentPage} of {totalPages}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-50"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <button
                                                    disabled={currentPage === totalPages}
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-50"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
