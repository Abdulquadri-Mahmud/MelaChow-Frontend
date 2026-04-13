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
    CreditCard,
    ShoppingBag,
    Truck,
    Hash,
    Lock,
    Settings,
    ChevronDown,
    ArrowUp,
    ArrowDown
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
    Legend
} from 'recharts';
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";
import Link from "next/link";

const CompactStat = ({ title, value, icon: Icon, colorClass, subtitle }) => (
    <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between mb-2">
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{title}</p>
                <h3 className="text-lg font-bold text-slate-900 leading-none">₦{value?.toLocaleString()}</h3>
            </div>
            <div className={`w-8 h-8 rounded flex items-center justify-center ${colorClass} bg-opacity-10 shrink-0`}>
                <Icon size={16} className={colorClass.split(' ')[1]} />
            </div>
        </div>
        {subtitle && <p className="text-[10px] text-slate-500 font-medium leading-tight">{subtitle}</p>}
    </div>
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
    const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
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

            // Backend now sorts by orderCount — preserve that order
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

            const formattedData = rawData.map(item => ({
                ...item,
                date: item.date || item.label || item._id,
                revenue: item.globalGMV || item.totalRevenue || 0,
                deliveryRevenue: item.deliveryRevenue || 0,
                commission: item.commission || 0
            }));

            setChartData(formattedData);
        } catch (err) {
            console.error(err);
        }
    }, [chartPeriod]);

    const fetchTransactions = useCallback(async () => {
        try {
            const queryParams = {
                page: currentPage,
                type: typeFilter !== "all" ? typeFilter : "",
                search: searchQuery
            };
            if (transactionTypeFilter !== "all") queryParams.transactionType = transactionTypeFilter;

            const res = await adminApi.getTransactions(queryParams);
            setTransactions(res.data.transactions);
            setTotalPages(res.data.pagination.totalPages);
        } catch (err) {
            console.error(err);
        }
    }, [currentPage, typeFilter, transactionTypeFilter, searchQuery]);

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
        if (activeTab === "transactions") fetchTransactions();
        if (activeTab === "escrow") fetchEscrowList();
        if (activeTab === "refunds") fetchRefundList();
    }, [activeTab, fetchTransactions, fetchEscrowList, fetchRefundList]);

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                                Finance Hub
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 italic tracking-widest uppercase">Finance Center</span>
                            </h1>
                            <div className="h-0.5 w-6 bg-orange-500 rounded-full mt-1" />
                            <p className="text-sm text-slate-500 mt-1.5 font-medium">Global commission tracking, settlements, and platform accounting.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex bg-white border border-slate-200 rounded-md p-0.5 overflow-hidden">
                                <div className="relative flex items-center px-2">
                                    <Calendar className="text-slate-400" size={12} />
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="h-8 pl-1.5 text-[10px] font-bold bg-transparent outline-none w-24 text-slate-600 uppercase"
                                    />
                                </div>
                                <div className="w-[1px] bg-slate-200 h-5 my-auto" />
                                <div className="relative flex items-center px-2">
                                    <Calendar className="text-slate-400" size={12} />
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="h-8 pl-1.5 text-[10px] font-bold bg-transparent outline-none w-24 text-slate-600 uppercase"
                                    />
                                </div>
                            </div>
                            <button className="h-9 px-3 bg-slate-900 text-white rounded-md flex items-center gap-2 font-bold text-xs uppercase hover:bg-slate-800 transition-colors">
                                <Download size={14} /> Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex scroll overflow-x-auto no-scrollbar gap-1 border-b border-slate-200 bg-slate-50 p-1 rounded-t-lg">
                        {[
                            { id: "overview", label: "Financial Pulse", icon: BarChart3 },
                            { id: "transactions", label: "Event Ledger", icon: Activity },
                            { id: "vendors", label: "Partner Settlements", icon: Store },
                            { id: "escrow", label: "Escrow Vault", icon: Lock },
                            { id: "refunds", label: "Refund Audits", icon: FileText },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`h-8 px-4 flex items-center gap-2 text-[10px] font-bold uppercase transition-all rounded-md whitespace-nowrap ${activeTab === tab.id
                                    ? "bg-white text-slate-900 border-b-2 border-b-orange-500 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                                    }`}
                            >
                                <tab.icon size={13} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === "overview" && (
                            <motion.div key="overview" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
                                {/* Primary Stats */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <CompactStat title="Gross Balance" value={summary?.currentPlatformBalance || 0} icon={Wallet} colorClass="bg-blue-100 text-blue-600" subtitle="Platform-wide holdings" />
                                    <CompactStat title="Escrow Hold" value={summary?.totalEscrowHeld || 0} icon={Lock} colorClass="bg-amber-100 text-amber-600" subtitle="Vendor food reserve" />
                                    <CompactStat title="Available Funds" value={summary?.availableBalance || 0} icon={DollarSign} colorClass="bg-emerald-100 text-emerald-600" subtitle="Cleared and ready" />
                                    <CompactStat title="Delivery Spread Earned" value={summary?.totalDeliverySpreadEarned || 0} icon={TrendingUp} colorClass="bg-orange-100 text-orange-600" subtitle="₦400 per platform delivery" />
                                </div>

                                {/* Flow Chart & Volume */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                    <div className="lg:col-span-1 space-y-3">
                                        <div className="bg-white border border-slate-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gross Marketplace Volume</p>
                                                <ShoppingBag size={14} className="text-slate-300" />
                                            </div>
                                            <h4 className="text-xl font-bold text-slate-900">₦{summary?.totalOrderRevenue?.toLocaleString() || 0}</h4>
                                            <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded border border-slate-100">
                                                <Activity size={10} className="text-slate-400" />
                                                <p className="text-[9px] font-bold text-slate-500 uppercase">Tracked Settlement Pool</p>
                                            </div>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logistics Fees Generated</p>
                                                <Truck size={14} className="text-slate-300" />
                                            </div>
                                            <h4 className="text-xl font-bold text-slate-900">₦{summary?.totalDeliveryFeesCollected?.toLocaleString() || 0}</h4>
                                            <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded border border-blue-100">
                                                <ArrowUpRight size={10} className="text-blue-500" />
                                                <p className="text-[9px] font-bold text-blue-600 uppercase">Internal Logistics Yield</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-3 flex flex-col">
                                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                                            <div>
                                                <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Revenue Trajectory</h3>
                                                <p className="text-[9px] text-slate-500 font-medium">Comparison of Marketplace vs. Commission Yield</p>
                                            </div>
                                            <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 space-x-0.5">
                                                {["7days", "30days", "3months", "12months"].map((p) => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setChartPeriod(p)}
                                                        className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${chartPeriod === p ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                                                    >
                                                        {p.replace('days', 'D').replace('months', 'M')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#0f172a" stopOpacity={0.05} />
                                                            <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.05} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '10px' }} itemStyle={{ fontWeight: 700 }} />
                                                    <Legend iconType="rect" wrapperStyle={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', paddingTop: '10px' }} />
                                                    <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Global GMV" />
                                                    <Area type="monotone" dataKey="deliveryRevenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCommission)" name="Delivery Spread" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "transactions" && (
                            <motion.div key="transactions" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-3">
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col md:flex-row gap-2 items-center">
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Audit Reference, Order ID, Payout Target..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-md outline-none text-xs font-medium placeholder:text-slate-400 focus:ring-1 focus:ring-orange-500 transition-all"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            value={transactionTypeFilter}
                                            onChange={(e) => setTransactionTypeFilter(e.target.value)}
                                            className="h-9 px-3 bg-white border border-slate-200 rounded-md outline-none text-[10px] font-bold uppercase tracking-tight appearance-none cursor-pointer"
                                        >
                                            <option value="all">All Event Types</option>
                                            <option value="delivery_fee">Delivery Fee Collected</option>
                                            <option value="delivery_spread">Delivery Spread Retained</option>
                                            <option value="escrow_hold">Escrow Hold</option>
                                            <option value="escrow_release">Escrow Release</option>
                                            <option value="rider_payout">Rider Payout</option>
                                            <option value="refund">Customer Refund</option>
                                            <option value="withdrawal">Vendor/Rider Withdrawal</option>
                                            <option value="top_up">Wallet Top-Up</option>
                                            <option value="manual_credit">Manual Credit</option>
                                            <option value="manual_debit">Manual Debit</option>
                                        </select>
                                        <div className="flex bg-white border border-slate-200 p-1 rounded-md">
                                            {["all", "credit", "debit"].map((t) => (
                                                <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${typeFilter === t ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}>{t}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temporal Mark</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction Abstract</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Linkage</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Balance</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right px-6">Event</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {transactions.length > 0 ? (
                                                    transactions.map((tx) => (
                                                        <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-2.5">
                                                                <p className="text-[10px] font-bold text-slate-900 leading-none mb-0.5">{new Date(tx.date || tx.createdAt).toLocaleDateString()}</p>
                                                                <p className="text-[9px] text-slate-400 font-medium">{new Date(tx.date || tx.createdAt).toLocaleTimeString()}</p>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <p className="text-xs font-bold text-slate-700 max-w-xs truncate">{tx.description}</p>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                {(tx.orderId || tx.order?.orderId) ? (
                                                                    <Link href={`/admin/orders/${tx.order?.orderId || tx.orderId}`} className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-slate-900 uppercase underline decoration-slate-200">
                                                                        <Hash size={10} /> {tx.order?.orderId || tx.orderId}
                                                                    </Link>
                                                                ) : <span className="text-slate-300 font-bold">―</span>}
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className={`text-xs font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                    {tx.type === 'credit' ? '+' : '-'}₦{tx.amount?.toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-xs font-bold text-slate-900">₦{tx.runningBalance?.toLocaleString()}</td>
                                                            <td className="px-4 py-2.5 text-right px-6">
                                                                <span className={`px-1.5 py-0.5 rounded-[2px] text-[8px] font-bold uppercase tracking-wider ${tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                                    {tx.type}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="px-4 py-16 text-center bg-slate-50/30">
                                                            <Activity size={24} className="mx-auto text-slate-200 mb-2" />
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Empty Ledger Pool</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Marker {currentPage} of {totalPages}</p>
                                            <div className="flex gap-1.5">
                                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="h-7 w-7 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-400 hover:text-slate-900 disabled:opacity-30"><ChevronLeft size={14} /></button>
                                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="h-7 w-7 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-400 hover:text-slate-900 disabled:opacity-30"><ChevronRight size={14} /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "vendors" && (
                            <motion.div key="vendors" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-3">
                                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partner Identity</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Volume</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Food Subtotal</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Payable</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Delivery Share</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {vendorBreakdown.length > 0 ? (
                                                    vendorBreakdown.map((vendor, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">{vendor.storeName?.[0]}</div>
                                                                    <div>
                                                                        <p className="text-xs font-bold text-slate-900 leading-none">{vendor.storeName}</p>
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{vendor.category || "General Store"}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="text-[10px] font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{vendor.orderCount}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-xs font-bold text-slate-700">₦{vendor.totalSubtotal?.toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-xs font-bold text-slate-900">₦{vendor.vendorEarnings?.toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <p className="text-xs font-bold text-blue-600">₦{vendor.deliveryShareGenerated?.toLocaleString() || 0}</p>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-4 py-16 text-center">
                                                            <Store size={24} className="mx-auto text-slate-200 mb-2" />
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Synchronization</p>
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
                            <motion.div key="escrow" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-3">
                                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order ID</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Counterparty</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">State</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Reserved Value</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {escrowList.length > 0 ? (
                                                    escrowList.map((escrow, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-2.5">
                                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded tracking-tighter">#{escrow.parentOrder?.orderId}</span>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-xs font-bold text-slate-900">{escrow.vendorInfo?.storeName}</td>
                                                            <td className="px-4 py-2.5 text-[10px] font-medium text-slate-400">{new Date(escrow.createdAt).toLocaleDateString()}</td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="px-2 py-0.5 rounded-[2px] text-[8px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
                                                                    {escrow.orderStatus.replace(/_/g, " ")}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-right font-bold text-slate-900 text-xs">₦{escrow.escrowAmount?.toLocaleString()}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-4 py-16 text-center">
                                                            <Lock size={24} className="mx-auto text-slate-200 mb-2" />
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Active Escrow Holds</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {totalPages > 1 && (
                                        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vault Page {currentPage} / {totalPages}</p>
                                            <div className="flex gap-1.5">
                                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="h-7 w-7 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-400 hover:text-slate-900 disabled:opacity-30"><ChevronLeft size={14} /></button>
                                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="h-7 w-7 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-400 hover:text-slate-900 disabled:opacity-30"><ChevronRight size={14} /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "refunds" && (
                            <motion.div key="refunds" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-3">
                                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event ID</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reasoning</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temporal</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comm. Retained</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                                    <th className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Refund Outlay</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {refundList.length > 0 ? (
                                                    refundList.map((refund, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded tracking-tighter">#{refund.orderId?.orderId}</span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <p className="text-xs font-bold text-slate-700">{refund.reason}</p>
                                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5 max-w-[180px] truncate">{refund.notes}</p>
                                                            </td>
                                                            <td className="px-4 py-3 text-[10px] font-medium text-slate-400">{new Date(refund.createdAt).toLocaleDateString()}</td>
                                                            <td className="px-4 py-3 text-xs font-bold text-slate-500">₦{refund.commissionRetained?.toLocaleString()}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                                                                    refund.status === 'completed'
                                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                        : refund.status === 'pending_wallet'
                                                                            ? 'bg-rose-50 text-rose-600 border-rose-100'
                                                                            : 'bg-slate-50 text-slate-500 border-slate-200'
                                                                }`}>
                                                                    {refund.status === 'pending_wallet' ? '⚠ Wallet Pending' : refund.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-xs font-bold text-rose-600">₦{refund.amount?.toLocaleString()}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-4 py-16 text-center text-slate-400">
                                                            <FileText size={24} className="mx-auto mb-2 text-slate-200" />
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Perfect Fulfillment Trace</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {totalPages > 1 && (
                                        <div className="px-4 py-2 border-t border-slate-200 flex items-center justify-between">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Audit Phase {currentPage} of {totalPages}</p>
                                            <div className="flex gap-1.5">
                                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="h-7 w-7 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-400 hover:text-slate-900 disabled:opacity-30"><ChevronLeft size={14} /></button>
                                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="h-7 w-7 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-400 hover:text-slate-900 disabled:opacity-30"><ChevronRight size={14} /></button>
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
