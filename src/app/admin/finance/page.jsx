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
    Search,
    ChevronLeft,
    ChevronRight,
    Download,
    BarChart3,
    Activity,
    ShoppingBag,
    Truck,
    Hash,
    Lock,
    ChevronDown,
    X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from "recharts";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";
import Link from "next/link";

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, gradient, iconBg, iconColor, subtitle }) => (
    <div className={`relative rounded-xl border overflow-hidden ${gradient}`}>
        {/* Top accent strip */}
        <div className={`h-0.5 w-full ${iconBg}`} />
        <div className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${iconBg} bg-opacity-20`}>
                    <Icon size={17} className={iconColor} />
                </div>
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.18em] text-right leading-tight max-w-[100px]">{title}</p>
            </div>
            <div>
                <h3 className="text-xl font-extrabold text-slate-900 leading-none">₦{value?.toLocaleString() ?? 0}</h3>
                {subtitle && <p className="text-[10px] text-slate-500 font-medium mt-1 leading-tight">{subtitle}</p>}
            </div>
        </div>
    </div>
);

// ─── Mini Metric Card ──────────────────────────────────────────────────────────
const MiniMetric = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-start justify-between gap-2 hover:border-orange-200 hover:shadow-sm transition-all">
        <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
            <h4 className="text-lg font-extrabold text-slate-900 leading-none">₦{value?.toLocaleString() ?? 0}</h4>
        </div>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
            <Icon size={14} />
        </span>
    </div>
);

// ─── Table Shell ───────────────────────────────────────────────────────────────
const TableCard = ({ children, footer }) => (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="h-0.5 bg-gradient-to-r from-orange-500 to-amber-400" />
        <div className="overflow-x-auto">{children}</div>
        {footer}
    </div>
);

const Th = ({ children, right }) => (
    <th className={`px-4 py-2.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.15em] bg-slate-50 border-b border-slate-100 ${right ? "text-right" : ""}`}>
        {children}
    </th>
);

const Pagination = ({ currentPage, totalPages, onPrev, onNext, label }) => (
    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{label} {currentPage} / {totalPages}</p>
        <div className="flex gap-1.5">
            <button disabled={currentPage === 1} onClick={onPrev}
                className="h-7 w-7 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-orange-500 hover:border-orange-200 disabled:opacity-30 transition-all">
                <ChevronLeft size={13} />
            </button>
            <button disabled={currentPage === totalPages} onClick={onNext}
                className="h-7 w-7 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-orange-500 hover:border-orange-200 disabled:opacity-30 transition-all">
                <ChevronRight size={13} />
            </button>
        </div>
    </div>
);

const EmptyRow = ({ colSpan, icon: Icon, message }) => (
    <tr>
        <td colSpan={colSpan} className="px-4 py-16 text-center">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon size={22} className="text-slate-300" />
            </div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{message}</p>
        </td>
    </tr>
);

// ─── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
    { id: "overview",      label: "Financial Pulse",     icon: BarChart3  },
    { id: "transactions",  label: "Event Ledger",        icon: Activity   },
    { id: "vendors",       label: "Partner Settlements", icon: Store      },
    { id: "escrow",        label: "Escrow Vault",        icon: Lock       },
    { id: "refunds",       label: "Refund Audits",       icon: FileText   },
];

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
    const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ startDate: "", endDate: "" });

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
            setVendorBreakdown(breakdownData);
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
            const rawData = Array.isArray(res.data) ? res.data : (res.data?.chart || res.data?.chartData || []);
            setChartData(rawData.map(item => ({
                ...item,
                date: item.date || item.label || item._id,
                revenue: item.globalGMV || item.totalRevenue || 0,
                deliveryRevenue: item.deliveryRevenue || 0,
                commission: item.commission || 0,
            })));
        } catch (err) { console.error(err); }
    }, [chartPeriod]);

    const fetchTransactions = useCallback(async () => {
        try {
            const queryParams = { page: currentPage, type: typeFilter !== "all" ? typeFilter : "", search: searchQuery };
            if (transactionTypeFilter !== "all") queryParams.transactionType = transactionTypeFilter;
            const res = await adminApi.getTransactions(queryParams);
            setTransactions(res.data.transactions);
            setTotalPages(res.data.pagination.totalPages);
        } catch (err) { console.error(err); }
    }, [currentPage, typeFilter, transactionTypeFilter, searchQuery]);

    const fetchEscrowList = useCallback(async () => {
        try {
            const res = await adminApi.getUnreleasedEscrow({ page: currentPage, search: searchQuery });
            setEscrowList(res.data.escrowOrders || []);
            setTotalPages(res.data.pagination?.totalPages || 1);
        } catch (err) { console.error(err); }
    }, [currentPage, searchQuery]);

    const fetchRefundList = useCallback(async () => {
        try {
            const res = await adminApi.getRefundsList({ page: currentPage, search: searchQuery });
            setRefundList(res.data.refunds || []);
            setTotalPages(res.data.pagination?.totalPages || 1);
        } catch (err) { console.error(err); }
    }, [currentPage, searchQuery]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { fetchChartData(); }, [fetchChartData]);
    useEffect(() => {
        if (activeTab === "transactions") fetchTransactions();
        if (activeTab === "escrow") fetchEscrowList();
        if (activeTab === "refunds") fetchRefundList();
    }, [activeTab, fetchTransactions, fetchEscrowList, fetchRefundList]);

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-5">

                    {/* ── PAGE HEADER ──────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-md shadow-orange-200 shrink-0">
                                    <BarChart3 size={17} className="text-white" />
                                </div>
                                <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                                    Finance Hub
                                </h1>
                                <span className="text-[9px] font-extrabold px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-200 uppercase tracking-widest">
                                    Finance Center
                                </span>
                            </div>
                            <div className="flex items-center gap-2 ml-12">
                                <div className="h-0.5 w-8 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" />
                                <p className="text-xs text-slate-500 font-medium">
                                    Global commission tracking, settlements, and platform accounting
                                </p>
                            </div>
                        </div>

                        {/* Date filter + export */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-orange-200 transition-colors">
                                <div className="flex items-center px-2.5 gap-1.5">
                                    <Calendar className="text-orange-400" size={12} />
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="h-9 text-[11px] font-bold bg-transparent outline-none w-28 text-slate-600"
                                    />
                                </div>
                                <div className="w-px bg-slate-200 my-1.5" />
                                <div className="flex items-center px-2.5 gap-1.5">
                                    <Calendar className="text-orange-400" size={12} />
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="h-9 text-[11px] font-bold bg-transparent outline-none w-28 text-slate-600"
                                    />
                                </div>
                                {(filters.startDate || filters.endDate) && (
                                    <button
                                        onClick={() => setFilters({ startDate: "", endDate: "" })}
                                        className="px-2 text-slate-400 hover:text-rose-500 transition-colors border-l border-slate-200"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                            <button className="h-9 px-4 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-xl flex items-center gap-2 font-bold text-xs uppercase shadow-md shadow-orange-200 hover:from-orange-600 hover:to-amber-500 transition-all">
                                <Download size={13} /> Export CSV
                            </button>
                        </div>
                    </div>

                    {/* ── NAVIGATION TABS ──────────────────────────────────── */}
                    <div className="flex overflow-x-auto no-scrollbar gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative h-9 px-4 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider transition-all rounded-lg whitespace-nowrap flex-shrink-0 ${
                                    activeTab === tab.id
                                        ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-md shadow-orange-200"
                                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                }`}
                            >
                                <tab.icon size={12} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ── TAB CONTENT ──────────────────────────────────────── */}
                    <AnimatePresence mode="wait">

                        {/* ── OVERVIEW ─────────────────────────────────────── */}
                        {activeTab === "overview" && (
                            <motion.div key="overview" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-5">

                                {/* Primary stat cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <StatCard
                                        title="Gross Platform Balance"
                                        value={summary?.currentPlatformBalance}
                                        icon={Wallet}
                                        gradient="bg-gradient-to-br from-slate-50 to-white border-slate-200"
                                        iconBg="bg-blue-100"
                                        iconColor="text-blue-600"
                                        subtitle="Platform-wide holdings"
                                    />
                                    <StatCard
                                        title="Escrow Hold"
                                        value={summary?.totalEscrowHeld}
                                        icon={Lock}
                                        gradient="bg-gradient-to-br from-amber-50/50 to-white border-amber-200"
                                        iconBg="bg-amber-100"
                                        iconColor="text-amber-600"
                                        subtitle="Vendor food reserve"
                                    />
                                    <StatCard
                                        title="Available Funds"
                                        value={summary?.availableBalance}
                                        icon={DollarSign}
                                        gradient="bg-gradient-to-br from-emerald-50/50 to-white border-emerald-200"
                                        iconBg="bg-emerald-100"
                                        iconColor="text-emerald-600"
                                        subtitle="Cleared and ready"
                                    />
                                    <StatCard
                                        title="Delivery Spread Earned"
                                        value={summary?.totalDeliverySpreadEarned}
                                        icon={TrendingUp}
                                        gradient="bg-gradient-to-br from-orange-50/60 to-white border-orange-200"
                                        iconBg="bg-orange-100"
                                        iconColor="text-orange-600"
                                        subtitle="₦400 per platform delivery"
                                    />
                                </div>

                                {/* Mini metrics + Chart */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div className="space-y-3">
                                        <MiniMetric
                                            label="Gross Marketplace Volume"
                                            value={summary?.totalOrderRevenue}
                                            icon={ShoppingBag}
                                            color="bg-slate-100 text-slate-500"
                                        />
                                        <MiniMetric
                                            label="Logistics Fees Generated"
                                            value={summary?.totalDeliveryFeesCollected}
                                            icon={Truck}
                                            color="bg-blue-50 text-blue-500"
                                        />
                                        {/* Platform summary pill */}
                                        <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-6 h-6 bg-orange-100 rounded-md flex items-center justify-center">
                                                    <Activity size={12} className="text-orange-500" />
                                                </span>
                                                <p className="text-[9px] font-extrabold text-orange-600 uppercase tracking-[0.2em]">Settlement Pool</p>
                                            </div>
                                            <p className="text-xs font-semibold text-slate-600 leading-snug">
                                                Platform manages vendor escrow release, rider payouts, and commission capture automatically.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Revenue chart */}
                                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                        <div className="h-0.5 bg-gradient-to-r from-orange-500 to-amber-400" />
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Revenue Trajectory</h3>
                                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Marketplace GMV vs. Commission Yield</p>
                                                </div>
                                                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 gap-0.5">
                                                    {["7days", "30days", "3months", "12months"].map((p) => (
                                                        <button
                                                            key={p}
                                                            onClick={() => setChartPeriod(p)}
                                                            className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase transition-all ${
                                                                chartPeriod === p
                                                                    ? "bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-sm"
                                                                    : "text-slate-400 hover:text-slate-700"
                                                            }`}
                                                        >
                                                            {p.replace("days", "D").replace("months", "M")}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="h-[240px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                                            </linearGradient>
                                                            <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 700 }} dy={10} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 700 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                                                            itemStyle={{ fontWeight: 700 }}
                                                        />
                                                        <Legend iconType="rect" wrapperStyle={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", paddingTop: "10px" }} />
                                                        <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Global GMV" />
                                                        <Area type="monotone" dataKey="deliveryRevenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCommission)" name="Delivery Spread" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── TRANSACTIONS ─────────────────────────────────── */}
                        {activeTab === "transactions" && (
                            <motion.div key="transactions" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-3">
                                {/* Filter bar */}
                                <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row gap-2 items-center shadow-sm">
                                    <div className="relative flex-1 group w-full">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={13} />
                                        <input
                                            type="text"
                                            placeholder="Search reference, order ID, or description…"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
                                        />
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <div className="relative flex-1 md:flex-none">
                                            <select
                                                value={transactionTypeFilter}
                                                onChange={(e) => setTransactionTypeFilter(e.target.value)}
                                                className="w-full h-9 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg outline-none text-[10px] font-bold uppercase tracking-wider appearance-none cursor-pointer focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400"
                                            >
                                                <option value="all">All Event Types</option>
                                                <option value="delivery_fee">Delivery Fee</option>
                                                <option value="delivery_spread">Delivery Spread</option>
                                                <option value="escrow_hold">Escrow Hold</option>
                                                <option value="escrow_release">Escrow Release</option>
                                                <option value="rider_payout">Rider Payout</option>
                                                <option value="refund">Refund</option>
                                                <option value="withdrawal">Withdrawal</option>
                                                <option value="top_up">Top-Up</option>
                                                <option value="manual_credit">Manual Credit</option>
                                                <option value="manual_debit">Manual Debit</option>
                                            </select>
                                            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                        <div className="flex bg-slate-50 border border-slate-200 p-0.5 rounded-lg gap-0.5">
                                            {["all", "credit", "debit"].map((t) => (
                                                <button key={t} onClick={() => setTypeFilter(t)}
                                                    className={`px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase transition-all ${
                                                        typeFilter === t
                                                            ? t === "credit" ? "bg-emerald-500 text-white" : t === "debit" ? "bg-rose-500 text-white" : "bg-gradient-to-r from-orange-500 to-amber-400 text-white"
                                                            : "text-slate-500 hover:bg-white"
                                                    }`}
                                                >{t}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <TableCard footer={totalPages > 1 && (
                                    <Pagination currentPage={currentPage} totalPages={totalPages}
                                        onPrev={() => setCurrentPage(p => p - 1)} onNext={() => setCurrentPage(p => p + 1)} label="Page" />
                                )}>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr>
                                                <Th>Date</Th>
                                                <Th>Description</Th>
                                                <Th>Order</Th>
                                                <Th>Amount</Th>
                                                <Th>Balance</Th>
                                                <Th right>Type</Th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {transactions.length > 0 ? transactions.map((tx) => (
                                                <tr key={tx._id} className="hover:bg-orange-50/30 transition-colors group">
                                                    <td className="px-4 py-2.5">
                                                        <p className="text-[10px] font-bold text-slate-900 leading-none mb-0.5">{new Date(tx.date || tx.createdAt).toLocaleDateString()}</p>
                                                        <p className="text-[9px] text-slate-400 font-medium">{new Date(tx.date || tx.createdAt).toLocaleTimeString()}</p>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <p className="text-xs font-semibold text-slate-700 max-w-xs truncate">{tx.description}</p>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        {(tx.orderId || tx.order?.orderId) ? (
                                                            <Link href={`/admin/orders/${tx.order?.orderId || tx.orderId}`}
                                                                className="inline-flex items-center gap-1 text-[9px] font-extrabold text-orange-500 hover:text-orange-700 uppercase border border-orange-100 bg-orange-50 px-1.5 py-0.5 rounded-md">
                                                                <Hash size={9} /> {tx.order?.orderId || tx.orderId}
                                                            </Link>
                                                        ) : <span className="text-slate-300">—</span>}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className={`text-xs font-extrabold ${tx.type === "credit" ? "text-emerald-600" : "text-rose-600"}`}>
                                                            {tx.type === "credit" ? "+" : "−"}₦{tx.amount?.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-xs font-bold text-slate-900">₦{tx.runningBalance?.toLocaleString()}</td>
                                                    <td className="px-4 py-2.5 text-right">
                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider border ${tx.type === "credit" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                                                            {tx.type}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )) : <EmptyRow colSpan={6} icon={Activity} message="Empty Ledger Pool" />}
                                        </tbody>
                                    </table>
                                </TableCard>
                            </motion.div>
                        )}

                        {/* ── VENDOR SETTLEMENTS ───────────────────────────── */}
                        {activeTab === "vendors" && (
                            <motion.div key="vendors" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                                <TableCard>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr>
                                                <Th>Partner Identity</Th>
                                                <Th>Volume</Th>
                                                <Th>Food Subtotal</Th>
                                                <Th>Net Payable</Th>
                                                <Th right>Delivery Share</Th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {vendorBreakdown.length > 0 ? vendorBreakdown.map((vendor, idx) => (
                                                <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm shadow-orange-200">
                                                                {vendor.storeName?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-extrabold text-slate-900 leading-none">{vendor.storeName}</p>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{vendor.category || "General Store"}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">{vendor.orderCount} orders</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-700">₦{vendor.totalSubtotal?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-xs font-extrabold text-slate-900">₦{vendor.vendorEarnings?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="text-xs font-bold text-indigo-600">₦{vendor.deliveryShareGenerated?.toLocaleString() || 0}</span>
                                                    </td>
                                                </tr>
                                            )) : <EmptyRow colSpan={5} icon={Store} message="Awaiting Synchronization" />}
                                        </tbody>
                                    </table>
                                </TableCard>
                            </motion.div>
                        )}

                        {/* ── ESCROW VAULT ─────────────────────────────────── */}
                        {activeTab === "escrow" && (
                            <motion.div key="escrow" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                                <TableCard footer={totalPages > 1 && (
                                    <Pagination currentPage={currentPage} totalPages={totalPages}
                                        onPrev={() => setCurrentPage(p => p - 1)} onNext={() => setCurrentPage(p => p + 1)} label="Vault Page" />
                                )}>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr>
                                                <Th>Order ID</Th>
                                                <Th>Counterparty</Th>
                                                <Th>Timestamp</Th>
                                                <Th>State</Th>
                                                <Th right>Reserved Value</Th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {escrowList.length > 0 ? escrowList.map((escrow, idx) => (
                                                <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                                                    <td className="px-4 py-2.5">
                                                        <span className="text-[10px] font-extrabold text-orange-500 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                                                            #{escrow.parentOrder?.orderId}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-xs font-bold text-slate-900">{escrow.vendorInfo?.storeName}</td>
                                                    <td className="px-4 py-2.5 text-[10px] font-medium text-slate-400">{new Date(escrow.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                                            {escrow.orderStatus.replace(/_/g, " ")}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-extrabold text-slate-900 text-xs">₦{escrow.escrowAmount?.toLocaleString()}</td>
                                                </tr>
                                            )) : <EmptyRow colSpan={5} icon={Lock} message="No Active Escrow Holds" />}
                                        </tbody>
                                    </table>
                                </TableCard>
                            </motion.div>
                        )}

                        {/* ── REFUND AUDITS ────────────────────────────────── */}
                        {activeTab === "refunds" && (
                            <motion.div key="refunds" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                                <TableCard footer={totalPages > 1 && (
                                    <Pagination currentPage={currentPage} totalPages={totalPages}
                                        onPrev={() => setCurrentPage(p => p - 1)} onNext={() => setCurrentPage(p => p + 1)} label="Audit Phase" />
                                )}>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr>
                                                <Th>Event ID</Th>
                                                <Th>Reasoning</Th>
                                                <Th>Date</Th>
                                                <Th>Commission Retained</Th>
                                                <Th>Status</Th>
                                                <Th right>Refund Outlay</Th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {refundList.length > 0 ? refundList.map((refund, idx) => (
                                                <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className="text-[10px] font-extrabold text-orange-500 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                                                            #{refund.orderId?.orderId}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-xs font-bold text-slate-700">{refund.reason}</p>
                                                        <p className="text-[9px] font-medium text-slate-400 mt-0.5 max-w-[200px] truncate">{refund.notes}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-[10px] font-medium text-slate-400">{new Date(refund.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-600">₦{refund.commissionRetained?.toLocaleString()}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider border ${
                                                            refund.status === "completed"
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                : refund.status === "pending_wallet"
                                                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                                                    : "bg-slate-50 text-slate-500 border-slate-200"
                                                        }`}>
                                                            {refund.status === "pending_wallet" ? "⚠ Wallet Pending" : refund.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-xs font-extrabold text-rose-600">₦{refund.amount?.toLocaleString()}</td>
                                                </tr>
                                            )) : <EmptyRow colSpan={6} icon={FileText} message="Perfect Fulfillment Trace" />}
                                        </tbody>
                                    </table>
                                </TableCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
