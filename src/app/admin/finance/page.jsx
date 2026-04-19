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
    History,
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

// ── Shared UI Components ───────────────────────────────────────────────────────

const StatCard = ({ title, value, icon: Icon, iconColor, subtitle }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 transition-all hover:border-slate-300">
        <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-50 border border-slate-100`}>
                <Icon size={16} className={iconColor} />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right">{title}</p>
        </div>
        <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">₦{value?.toLocaleString() ?? 0}</h3>
            {subtitle && <p className="text-[10px] text-slate-500 font-medium mt-1">{subtitle}</p>}
        </div>
    </div>
);

const MiniMetric = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-start justify-between gap-2 hover:border-slate-300 transition-all">
        <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <h4 className="text-base font-bold text-slate-900 leading-none">₦{value?.toLocaleString() ?? 0}</h4>
        </div>
        <span className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${color} border border-slate-100`}>
            <Icon size={13} />
        </span>
    </div>
);

const TableCard = ({ children, footer }) => (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">{children}</div>
        {footer}
    </div>
);

const Th = ({ children, right }) => (
    <th className={`px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 ${right ? "text-right" : ""}`}>
        {children}
    </th>
);

const Pagination = ({ currentPage, totalPages, onPrev, onNext, label }) => (
    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label} {currentPage} / {totalPages}</p>
        <div className="flex gap-1">
            <button disabled={currentPage === 1} onClick={onPrev}
                className="h-7 w-7 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-all">
                <ChevronLeft size={12} />
            </button>
            <button disabled={currentPage === totalPages} onClick={onNext}
                className="h-7 w-7 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-all">
                <ChevronRight size={12} />
            </button>
        </div>
    </div>
);

const EmptyRow = ({ colSpan, icon: Icon, message }) => (
    <tr>
        <td colSpan={colSpan} className="px-4 py-12 text-center">
            <Icon size={20} className="text-slate-200 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{message}</p>
        </td>
    </tr>
);

const TABS = [
    { id: "overview",      label: "Overview",     icon: BarChart3  },
    { id: "transactions",  label: "Ledger",       icon: Activity   },
    { id: "vendors",       label: "Partners",     icon: Store      },
    { id: "payouts",       label: "Payouts",      icon: ArrowUpRight },
    { id: "escrow",        label: "Escrow",       icon: Lock       },
    { id: "refunds",       label: "Refunds",      icon: FileText   },
];

export default function FinancePage() {
    const [activeTab, setActiveTab] = useState("overview");
    const [summary, setSummary] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [vendorBreakdown, setVendorBreakdown] = useState([]);
    const [escrowList, setEscrowList] = useState([]);
    const [refundList, setRefundList] = useState([]);
    const [walletBreakdown, setWalletBreakdown] = useState(null);
    const [payoutHistory, setPayoutHistory] = useState([]);
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
            setVendorBreakdown(breakdownRes.data?.vendors || []);
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
        if (activeTab === "payouts") {
            adminApi.getWalletBreakdown().then(res => setWalletBreakdown(res.data));
            adminApi.getPayoutHistory({ page: currentPage, search: searchQuery }).then(res => {
                setPayoutHistory(res.data.payouts || []);
                setTotalPages(res.data.pagination?.totalPages || 1);
            });
        }
    }, [activeTab, fetchTransactions, fetchEscrowList, fetchRefundList, currentPage, searchQuery]);

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-[1200px] mx-auto space-y-5 pb-10">

                    {/* ── Header ─────────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center">
                                <BarChart3 size={15} className="text-slate-600" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900">Finance Hub</h1>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Settlements & accounting</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                                <div className="flex items-center px-2 gap-2">
                                    <Calendar className="text-slate-400" size={12} />
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="h-8 text-[11px] font-bold bg-transparent outline-none w-28 text-slate-600"
                                    />
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="h-8 text-[11px] font-bold bg-transparent outline-none w-28 text-slate-600"
                                    />
                                </div>
                                {(filters.startDate || filters.endDate) && (
                                    <button onClick={() => setFilters({ startDate: "", endDate: "" })} className="p-2 text-slate-400 hover:text-rose-500 border-l border-slate-100">
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                            <button className="h-8 px-3 bg-slate-900 text-white rounded-lg flex items-center gap-2 font-bold text-[10px] uppercase">
                                <Download size={12} /> Export
                            </button>
                        </div>
                    </div>

                    {/* ── Tabs ───────────────────────────────────────────── */}
                    <div className="flex overflow-x-auto no-scrollbar gap-1 bg-white border border-slate-200 rounded-lg p-1">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`h-8 px-4 flex items-center gap-2 text-[10px] font-bold uppercase transition-all rounded-md whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? "bg-slate-100 text-slate-900 shadow-sm border border-slate-200"
                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <tab.icon size={11} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === "overview" && (
                            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard title="Platform Balance" value={summary?.currentPlatformBalance} icon={Wallet} iconColor="text-blue-500" subtitle="Total holdings" />
                                    <StatCard title="Escrow Hold" value={summary?.totalEscrowHeld} icon={Lock} iconColor="text-amber-500" subtitle="Vendor reserve" />
                                    <StatCard title="Available Funds" value={summary?.availableBalance} icon={DollarSign} iconColor="text-emerald-500" subtitle="Ready for payout" />
                                    <StatCard title="Delivery Spread" value={summary?.totalDeliverySpreadEarned} icon={TrendingUp} iconColor="text-orange-500" subtitle="Platform share" />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div className="space-y-3">
                                        <MiniMetric label="Marketplace GMV" value={summary?.totalOrderRevenue} icon={ShoppingBag} color="bg-slate-50" />
                                        <MiniMetric label="Logistics Fees" value={summary?.totalDeliveryFeesCollected} icon={Truck} color="bg-slate-50" />
                                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Notice</p>
                                            <p className="text-[11px] text-slate-600 leading-normal">
                                                Automated daily settlements trigger at 20:00. Use the Payouts tab to audit logs.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Growth Trend</h3>
                                            <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-200 gap-0.5">
                                                {["7days", "30days", "90days"].map((p) => (
                                                    <button key={p} onClick={() => setChartPeriod(p)}
                                                        className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${chartPeriod === p ? "bg-white text-slate-800 border border-slate-100 shadow-sm" : "text-slate-400"}`}>
                                                        {p.replace("days", "D")}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="h-[220px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.05} />
                                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                                                    <Tooltip contentStyle={{ borderRadius: "8px", border: "none", fontSize: "10px", backgroundColor: "#1e293b", color: "#fff" }} />
                                                    <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#colorRev)" name="GMV" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "transactions" && (
                            <motion.div key="transactions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col md:flex-row gap-2 items-center">
                                    <div className="relative flex-1 group w-full">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                        <input type="text" placeholder="Search reference..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs" />
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <select value={transactionTypeFilter} onChange={(e) => setTransactionTypeFilter(e.target.value)}
                                            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider outline-none">
                                            <option value="all">All Types</option>
                                            <option value="delivery_fee">Delivery Fee</option>
                                            <option value="escrow_release">Escrow Release</option>
                                            <option value="rider_payout">Rider Payout</option>
                                        </select>
                                        <div className="flex bg-slate-50 border border-slate-200 p-0.5 rounded-lg">
                                            {["all", "credit", "debit"].map((t) => (
                                                <button key={t} onClick={() => setTypeFilter(t)}
                                                    className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase ${typeFilter === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}>{t}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <TableCard footer={totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPrev={() => setCurrentPage(p => p - 1)} onNext={() => setCurrentPage(p => p + 1)} label="Page" />}>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr>
                                                <Th>Date</Th>
                                                <Th>Description</Th>
                                                <Th>Order</Th>
                                                <Th>Amount</Th>
                                                <Th right>Balance</Th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {transactions.map((tx) => (
                                                <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-2 text-[10px] font-medium text-slate-500">{new Date(tx.date || tx.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-4 py-2 text-xs font-medium text-slate-700">{tx.description}</td>
                                                    <td className="px-4 py-2 text-[10px] font-bold text-orange-500 uppercase">#{tx.orderId?.slice(-6)}</td>
                                                    <td className={`px-4 py-2 text-xs font-bold ${tx.type === "credit" ? "text-emerald-500" : "text-rose-500"}`}>₦{tx.amount?.toLocaleString()}</td>
                                                    <td className="px-4 py-2 text-right text-[10px] font-bold text-slate-800">₦{tx.runningBalance?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </TableCard>
                            </motion.div>
                        )}

                        {activeTab === "vendors" && (
                            <motion.div key="vendors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <TableCard>
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr>
                                                <Th>Partner</Th>
                                                <Th>Orders</Th>
                                                <Th>Volume</Th>
                                                <Th right>Net Payable</Th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {vendorBreakdown.map((v, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-slate-800">{v.storeName}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-400">{v.orderCount}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-700">₦{v.totalSubtotal?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-900">₦{v.vendorEarnings?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </TableCard>
                            </motion.div>
                        )}

                        {activeTab === "payouts" && (
                            <motion.div key="payouts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vendor Wallets</p>
                                        <p className="text-lg font-bold text-slate-900">₦{walletBreakdown?.vendors?.totalBalance?.toLocaleString() || 0}</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rider Wallets</p>
                                        <p className="text-lg font-bold text-slate-900">₦{walletBreakdown?.riders?.totalBalance?.toLocaleString() || 0}</p>
                                    </div>
                                    <div className="bg-slate-900 rounded-xl p-4 text-white">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">System Liability</p>
                                        <p className="text-lg font-bold">₦{((walletBreakdown?.vendors?.totalBalance || 0) + (walletBreakdown?.riders?.totalBalance || 0)).toLocaleString()}</p>
                                    </div>
                                </div>
                                <TableCard footer={totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPrev={() => setCurrentPage(p => p - 1)} onNext={() => setCurrentPage(p => p + 1)} label="Page" />}>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr>
                                                <Th>Recipient</Th>
                                                <Th>Bank</Th>
                                                <Th>Status</Th>
                                                <Th right>Amount</Th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {payoutHistory.map((p, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-2">
                                                        <p className="text-xs font-bold text-slate-800">{p.accountName}</p>
                                                        <p className="text-[9px] text-slate-400">{p.payoutType}</p>
                                                    </td>
                                                    <td className="px-4 py-2 text-[10px] font-medium text-slate-600">{p.bankName}</td>
                                                    <td className="px-4 py-2">
                                                        <span className="text-[9px] px-2 py-0.5 rounded-full border border-slate-100 bg-slate-50 text-slate-600 font-bold uppercase">{p.status}</span>
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-bold text-slate-900 text-xs">₦{p.amount?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </TableCard>
                            </motion.div>
                        )}

                        {activeTab === "escrow" && (
                            <motion.div key="escrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <TableCard footer={totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPrev={() => setCurrentPage(p => p - 1)} onNext={() => setCurrentPage(p => p + 1)} label="Page" />}>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr>
                                                <Th>Order ID</Th>
                                                <Th>Partner</Th>
                                                <Th right>Escrow Amount</Th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {escrowList.map((e, i) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="px-4 py-2.5 text-[10px] font-bold text-orange-500 uppercase">#{e.parentOrder?.orderId?.slice(-6)}</td>
                                                    <td className="px-4 py-2.5 text-xs font-medium text-slate-700">{e.vendorInfo?.storeName}</td>
                                                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 text-xs">₦{e.escrowAmount?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </TableCard>
                            </motion.div>
                        )}

                        {activeTab === "refunds" && (
                            <motion.div key="refunds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <TableCard footer={totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPrev={() => setCurrentPage(p => p - 1)} onNext={() => setCurrentPage(p => p + 1)} label="Page" />}>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr>
                                                <Th>Order ID</Th>
                                                <Th>Reason</Th>
                                                <Th right>Amount</Th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {refundList.map((r, i) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="px-4 py-2.5 text-[10px] font-bold text-orange-500 uppercase">#{r.orderId?.orderId?.slice(-6)}</td>
                                                    <td className="px-4 py-2.5 text-xs font-medium text-slate-700">{r.reason}</td>
                                                    <td className="px-4 py-2.5 text-right font-bold text-rose-500 text-xs">₦{r.amount?.toLocaleString()}</td>
                                                </tr>
                                            ))}
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
