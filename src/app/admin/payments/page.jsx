"use client";

import { useState, useEffect, useCallback } from "react";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Store,
    Calendar,
    ArrowUpRight,
    Search,
    Download,
    BarChart3,
    Activity,
    ShoppingBag,
    Truck,
    X,
    PieChart as PieChartIcon,
    ArrowRight,
    Percent,
} from "lucide-react";
import { motion } from "framer-motion";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";

// ── Shared UI Components ───────────────────────────────────────────────────────

const StatCard = ({ title, value, icon: Icon, iconColor, subtitle, trend }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 transition-all hover:border-slate-300">
        <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-slate-50 border border-slate-100`}>
                <Icon size={18} className={iconColor} />
            </div>
            {trend && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'} bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100`}>
                    {trend > 0 ? "+" : "-"}{Math.abs(trend)}%
                </span>
            )}
        </div>
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{title}</p>
            <h3 className="text-xl font-bold text-slate-900 leading-tight">₦{value?.toLocaleString() ?? 0}</h3>
            {subtitle && <p className="text-[10px] text-slate-500 font-medium mt-1">{subtitle}</p>}
        </div>
    </div>
);

const SectionHeader = ({ title, subtitle, icon: Icon }) => (
    <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
            <Icon size={16} className="text-slate-600" />
        </div>
        <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h2>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{subtitle}</p>
        </div>
    </div>
);

export default function PlatformRevenuePage() {
    const [summary, setSummary] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [vendorBreakdown, setVendorBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartPeriod, setChartPeriod] = useState("30days");
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
            toast.error("Failed to load revenue data");
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
                gmv: item.globalGMV || item.totalRevenue || 0,
                revenue: (item.commission || 0) + (item.deliveryRevenue || 0),
            })));
        } catch (err) { console.error(err); }
    }, [chartPeriod]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { fetchChartData(); }, [fetchChartData]);

    const COLORS = ['#f97316', '#3b82f6'];

    const pieData = summary ? [
        { name: 'Commissions', value: summary.totalCommissionEarned || 1 },
        { name: 'Logistics', value: summary.totalDeliverySpreadEarned || 1 },
    ] : [];

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-[1200px] mx-auto space-y-6 pb-12">

                    {/* ── Page Header ─────────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Platform Revenue</h1>
                            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-1 flex items-center gap-1.5">
                                <Activity size={12} /> Financial performance & trend analysis
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                                <div className="flex items-center px-3 gap-2">
                                    <Calendar className="text-slate-400" size={12} />
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="h-8 text-[11px] font-bold bg-transparent outline-none w-28 text-slate-600"
                                    />
                                    <ArrowRight size={10} className="text-slate-300" />
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="h-8 text-[11px] font-bold bg-transparent outline-none w-28 text-slate-600"
                                    />
                                </div>
                                {(filters.startDate || filters.endDate) && (
                                    <button
                                        onClick={() => setFilters({ startDate: "", endDate: "" })}
                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 border-l border-slate-100"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                            <button className="h-9 px-4 bg-slate-900 text-white rounded-lg flex items-center gap-2 font-bold text-[11px] uppercase transition-all">
                                <Download size={12} /> Export CSV
                            </button>
                        </div>
                    </div>

                    {/* ── Key Metrics ─────────────────────────────────────────── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Gross GMV"
                            value={summary?.totalOrderRevenue}
                            icon={ShoppingBag}
                            iconColor="text-blue-500"
                            subtitle="Total marketplace volume"
                            trend={12}
                        />
                        <StatCard
                            title="Net Revenue"
                            value={(summary?.totalCommissionEarned || 0) + (summary?.totalDeliverySpreadEarned || 0)}
                            icon={DollarSign}
                            iconColor="text-orange-500"
                            subtitle="Commissions + logistics"
                            trend={8}
                        />
                        <StatCard
                            title="Logistics Spread"
                            value={summary?.totalDeliverySpreadEarned}
                            icon={Truck}
                            iconColor="text-emerald-500"
                            subtitle="Fulfillment margin"
                            trend={15}
                        />
                        <StatCard
                            title="Commissions"
                            value={summary?.totalCommissionEarned}
                            icon={Percent}
                            iconColor="text-amber-500"
                            subtitle="Partner marketplace fees"
                            trend={5}
                        />
                    </div>

                    {/* ── Performance Charts ──────────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Area Chart: Revenue Trend */}
                        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                                <SectionHeader 
                                    title="Revenue Trend" 
                                    subtitle="Daily volume vs platform yield" 
                                    icon={BarChart3} 
                                />
                                <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200 gap-1">
                                    {["7days", "30days", "90days"].map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setChartPeriod(p)}
                                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                                                chartPeriod === p
                                                    ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                                                    : "text-slate-400 hover:text-slate-600"
                                            }`}
                                        >
                                            {p.replace("days", "D")}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorGMV" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.05} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.10} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }} 
                                            dy={10} 
                                            tickFormatter={(val) => {
                                                const d = new Date(val);
                                                return isNaN(d) ? val : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                            }}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff", fontSize: "10px" }}
                                            itemStyle={{ fontWeight: 600, padding: "2px 0" }}
                                        />
                                        <Area type="monotone" dataKey="gmv" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorGMV)" name="GMV" />
                                        <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart: Revenue Mix */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
                            <SectionHeader 
                                title="Revenue Mix" 
                                subtitle="Yield contribution breakdown" 
                                icon={PieChartIcon} 
                            />
                            
                            <div className="flex-1 flex flex-col items-center justify-center py-4">
                                <div className="h-[180px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={75}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: "8px", border: "none" }}
                                                itemStyle={{ fontWeight: 600, fontSize: "10px" }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="w-full grid grid-cols-2 gap-2 mt-4">
                                    {pieData.map((item, idx) => (
                                        <div key={item.name} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex flex-col">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{item.name}</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-900">
                                                {summary ? Math.round((item.value / ((summary?.totalCommissionEarned || 0) + (summary?.totalDeliverySpreadEarned || 0) || 1)) * 100) : 0}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Secondary Analysis ──────────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Top Revenue Partners */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <SectionHeader 
                                title="Yield Leaders" 
                                subtitle="Top performing marketplace partners" 
                                icon={Store} 
                            />
                            
                            <div className="space-y-2">
                                {vendorBreakdown.slice(0, 5).map((vendor, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg group hover:border-slate-300 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                                                {vendor.storeName?.[0]}
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-bold text-slate-800 uppercase">{vendor.storeName}</h4>
                                                <p className="text-[9px] text-slate-400 font-medium uppercase mt-0.5">{vendor.orderCount} Orders</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] font-bold text-slate-900">₦{vendor.vendorEarnings?.toLocaleString()}</p>
                                            <p className="text-[9px] text-orange-500 font-bold uppercase mt-0.5">₦{(vendor.totalSubtotal - vendor.vendorEarnings)?.toLocaleString()} yield</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Fulfillment Summary */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <SectionHeader 
                                title="Fulfillment Capture" 
                                subtitle="Logistics spread by store" 
                                icon={Truck} 
                            />
                            
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={vendorBreakdown.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis 
                                            dataKey="storeName" 
                                            type="category" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 9, fill: "#64748b", fontWeight: 600, textTransform: "uppercase" }} 
                                            width={80}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: "8px", border: "none" }}
                                            itemStyle={{ fontWeight: 600, fontSize: "10px" }}
                                        />
                                        <Bar dataKey="deliveryShareGenerated" name="Spread" radius={[0, 4, 4, 0]} fill="#3b82f6" fillOpacity={0.8} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Total Delivery Fees</p>
                                    <p className="text-sm font-bold text-slate-800">₦{summary?.totalDeliveryFeesCollected?.toLocaleString()}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Platform Share</p>
                                    <p className="text-sm font-bold text-emerald-600">₦{summary?.totalDeliverySpreadEarned?.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
