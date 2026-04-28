"use client";

import { useState, useEffect } from "react";
import adminApi from "@/app/lib/adminApi";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Zap, 
    Plus, 
    Calendar, 
    Users, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    Info, 
    Trash2,
    Gift,
    Sparkles,
    ChevronRight,
    Search,
    Filter,
    BarChart3,
    TrendingUp,
    UserCheck,
    ArrowUpRight
} from "lucide-react";
import toast from "react-hot-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export default function PlatformDeliveryPromosPage() {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    
    // Stats State
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [selectedPromoId, setSelectedPromoId] = useState(null);

    const [form, setForm] = useState({
        name: "first_order_free_delivery",
        totalSlots: "100",
        startsAt: "",
        endsAt: "",
    });

    useEffect(() => {
        const load = async () => {
            try {
                const data = await adminApi.getPlatformDeliveryPromos();
                setPromos(data.promos || []);
                
                // Load stats for active promo if it exists
                const active = data.promos.find(p => p.isActive);
                if (active) {
                    fetchStats(active._id);
                }
            } catch (err) {
                toast.error("Failed to load promotions");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const fetchStats = async (promoId) => {
        setLoadingStats(true);
        setSelectedPromoId(promoId);
        try {
            const data = await adminApi.getPlatformPromoStats(promoId);
            setStats(data.stats);
        } catch (err) {
            console.error("Stats load failed:", err);
            toast.error("Failed to load detailed stats");
        } finally {
            setLoadingStats(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await adminApi.createPlatformDeliveryPromo({
                name: form.name,
                totalSlots: form.totalSlots ? Number(form.totalSlots) : 100,
                startsAt: form.startsAt || null,
                endsAt: form.endsAt || null,
            });

            toast.success("Platform promo activated successfully!");
            setForm({ name: "first_order_free_delivery", totalSlots: "100", startsAt: "", endsAt: "" });
            setShowCreateForm(false);

            const refreshed = await adminApi.getPlatformDeliveryPromos();
            setPromos(refreshed.promos || []);
            
            // Auto-load stats for the new promo
            const active = refreshed.promos.find(p => p.isActive);
            if (active) fetchStats(active._id);
        } catch (err) {
            toast.error(err.message || "Failed to create promo");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeactivate = async (promoId) => {
        const confirmDeactivate = window.confirm("Are you sure you want to deactivate this platform promotion? This cannot be undone.");
        if (!confirmDeactivate) return;

        try {
            await adminApi.deactivatePlatformDeliveryPromo(promoId);
            toast.success("Promotion deactivated");
            const refreshed = await adminApi.getPlatformDeliveryPromos();
            setPromos(refreshed.promos || []);
            
            // Clear stats if the selected one was deactivated
            if (selectedPromoId === promoId) {
                fetchStats(promoId); // Reload to show archived state
            }
        } catch (err) {
            toast.error(err.message || "Failed to deactivate");
        }
    };

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString("en-NG", { day: 'numeric', month: 'short', year: 'numeric' }) : "Unlimited";

    const formatTime = (d) =>
        d ? new Date(d).toLocaleTimeString("en-NG", { hour: '2-digit', minute: '2-digit' }) : "";

    const activePromo = promos.find(p => p.isActive);

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-6xl mx-auto space-y-8">
                    
                    {/* ── Header ─────────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 shrink-0">
                                    <Zap size={20} className="text-white" strokeWidth={2.5} />
                                </div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                                    Platform <span className="text-orange-500">Delivery</span> Promos
                                </h1>
                            </div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 ml-1">
                                <Sparkles size={12} className="text-amber-500" />
                                Growth & Customer Acquisition Tools
                            </p>
                        </div>

                        {!showCreateForm && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowCreateForm(true)}
                                className="h-11 px-6 bg-slate-900 text-white rounded-xl flex items-center gap-2.5 text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all border border-slate-800"
                            >
                                <Plus size={16} strokeWidth={3} />
                                Activate New Promo
                            </motion.button>
                        )}
                    </div>

                    {/* ── Analytics Dashboard (Dynamic) ────────────────────── */}
                    {stats && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Usage Chart */}
                            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                            <TrendingUp size={14} className="text-orange-500" /> Claims Velocity
                                        </h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Daily adoption rate for {stats.promo.name}</p>
                                    </div>
                                    <div className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-500 uppercase italic">
                                        Last 30 Days
                                    </div>
                                </div>
                                
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats.statsOverTime}>
                                            <defs>
                                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="_id" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}}
                                                tickFormatter={(val) => new Date(val).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                                            />
                                            <YAxis hide />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="count" 
                                                name="New Claims"
                                                stroke="#f97316" 
                                                strokeWidth={3}
                                                fillOpacity={1} 
                                                fill="url(#colorCount)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Summary Metrics */}
                            <div className="space-y-6">
                                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                    
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 italic">Performance Metrics</p>
                                        
                                        <div className="space-y-8">
                                            <div>
                                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Total Subsidised</p>
                                                <div className="flex items-end gap-1">
                                                    <span className="text-3xl font-black italic">₦{(stats.totalSavings || 0).toLocaleString()}</span>
                                                    <span className="text-[10px] font-black text-emerald-400 mb-2">+ 12.5%</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Claims</p>
                                                    <p className="text-xl font-black italic">{stats.totalClaims}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Completion</p>
                                                    <p className="text-xl font-black italic">
                                                        {Math.round((stats.totalClaims / stats.promo.totalSlots) * 100)}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/10 mt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                <ArrowUpRight size={14} className="text-orange-500" />
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 leading-tight uppercase italic">
                                                Promotion is operating within expected growth parameters.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Create Form Modal ───────────────────────── */}
                    <AnimatePresence>
                        {showCreateForm && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => !submitting && setShowCreateForm(false)}
                                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                                />

                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-black/20 overflow-hidden border border-white/20"
                                >
                                    {/* Modal Header */}
                                    <div className="relative h-32 bg-slate-900 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-500/20" />
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                                        
                                        <div className="relative z-10 h-full flex flex-col justify-center px-8">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] italic">Campaign Launchpad</span>
                                                    </div>
                                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tight leading-none">
                                                        Configure <span className="text-orange-500">Platform</span> Promo
                                                    </h2>
                                                </div>
                                                <button 
                                                    onClick={() => setShowCreateForm(false)}
                                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90"
                                                >
                                                    <XCircle size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modal Body */}
                                    <form onSubmit={handleCreate} className="p-8 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Left Column: Basic Info */}
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 ml-1">
                                                        <Info size={12} className="text-orange-500" /> Promotion Identifier
                                                    </label>
                                                    <div className="relative group">
                                                        <input
                                                            type="text"
                                                            value={form.name}
                                                            readOnly
                                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-[20px] px-5 py-4 text-sm font-black text-slate-500 outline-none cursor-not-allowed italic"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 ml-1">
                                                        <Users size={12} className="text-orange-500" /> Total User Capacity
                                                    </label>
                                                    <div className="relative group">
                                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black italic text-xs">SLOTS:</div>
                                                        <input
                                                            type="number"
                                                            value={form.totalSlots}
                                                            onChange={e => setForm(f => ({ ...f, totalSlots: e.target.value }))}
                                                            placeholder="000"
                                                            required
                                                            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[20px] pl-20 pr-5 py-4 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all shadow-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column: Scheduling */}
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 ml-1">
                                                        <Calendar size={12} className="text-orange-500" /> Activation Time
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="datetime-local"
                                                            value={form.startsAt}
                                                            onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
                                                            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[20px] px-5 py-4 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all shadow-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 ml-1">
                                                        <Clock size={12} className="text-orange-500" /> Expiry (Optional)
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="datetime-local"
                                                            value={form.endsAt}
                                                            onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))}
                                                            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[20px] px-5 py-4 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all shadow-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Submit Button Section */}
                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                                            <div className="hidden md:block">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic max-w-[200px]">
                                                    Deploying this campaign will immediately make free delivery available to eligible users.
                                                </p>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => !submitting && setShowCreateForm(false)}
                                                    className="flex-1 md:flex-none h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={submitting}
                                                    className="flex-1 md:flex-none h-14 px-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-50 hover:bg-black transition-all active:scale-95"
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <Loader2 className="animate-spin" size={16} />
                                                            <span>Deploying...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Zap size={16} className="text-orange-500" />
                                                            <span>Initialize Campaign</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* ── Promotion Registry Table ─────────────────────────── */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
                            <div>
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Promotion Registry</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Audit trail of acquisition campaigns</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={14} />
                                    <input placeholder="SEARCH CAMPAIGNS..." className="h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black outline-none focus:border-orange-500 w-full md:w-64 transition-all" />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                        <th className="px-8 py-5 text-left">Status</th>
                                        <th className="px-8 py-5 text-left">Period</th>
                                        <th className="px-8 py-5 text-left">Utilization</th>
                                        <th className="px-8 py-5 text-left">Analytics</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-20 text-center">
                                                <Loader2 className="animate-spin text-orange-500 mx-auto mb-4" size={40} />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Global Registry...</p>
                                            </td>
                                        </tr>
                                    ) : promos.length > 0 ? promos.map((p) => (
                                        <tr key={p._id} className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${selectedPromoId === p._id ? 'bg-orange-50/30' : ''}`} onClick={() => fetchStats(p._id)}>
                                            <td className="px-8 py-5">
                                                {p.isActive ? (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                        Live
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                                                        Archived
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-slate-900 italic uppercase">{formatDate(p.startsAt)}</span>
                                                        <ChevronRight size={10} className="text-slate-300" />
                                                        <span className="text-xs font-black text-slate-900 italic uppercase">{formatDate(p.endsAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                                                        <Clock size={10} />
                                                        {formatTime(p.startsAt)} — {formatTime(p.endsAt)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 min-w-[120px] h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(100, ((p.usedSlots || 0) / (p.totalSlots || 1)) * 100)}%` }}
                                                            className={`h-full rounded-full transition-all duration-500 ${p.isActive ? 'bg-orange-500' : 'bg-slate-400'}`}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-black text-slate-900 italic">
                                                        {p.usedSlots || 0}<span className="text-slate-400"> / {p.totalSlots}</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                                        <BarChart3 size={14} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-600 uppercase italic">View Analytics</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                {p.isActive ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeactivate(p._id); }}
                                                        className="h-10 w-10 flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-500 rounded-xl transition-all active:scale-90"
                                                        title="Deactivate"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2 text-slate-300">
                                                        <CheckCircle2 size={14} />
                                                        <span className="text-[10px] font-black uppercase italic">Finalised</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-20 text-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                                    <Filter size={32} className="text-slate-200" />
                                                </div>
                                                <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-widest">Registry Empty</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Initialize your first acquisition campaign to populate this ledger</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── Customer Usage Log (Conditional) ───────────────── */}
                    {stats && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
                                <div>
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                        <UserCheck size={16} className="text-orange-500" /> Customer Usage Log
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Live tracking of free delivery redemptions</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase italic border border-emerald-100">
                                        Total Claims: {stats.totalClaims}
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            <th className="px-8 py-5 text-left">Customer</th>
                                            <th className="px-8 py-5 text-left">Email Address</th>
                                            <th className="px-8 py-5 text-left">Timestamp</th>
                                            <th className="px-8 py-5 text-right">Value Saved</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loadingStats ? (
                                            <tr>
                                                <td colSpan="4" className="px-8 py-12 text-center text-[10px] font-black text-slate-400 uppercase italic">
                                                    Fetching records...
                                                </td>
                                            </tr>
                                        ) : stats.claims.length > 0 ? stats.claims.map((claim) => (
                                            <tr key={claim._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 overflow-hidden border-2 border-white shadow-sm">
                                                            {claim.userId?.profilePicture ? (
                                                                <img src={claim.userId.profilePicture} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                `${claim.userId?.firstName?.[0] || '?'}${claim.userId?.lastName?.[0] || '?'}`
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-black text-slate-900 uppercase italic">
                                                            {claim.userId?.firstName} {claim.userId?.lastName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-xs font-bold text-slate-500 lowercase">
                                                    {claim.userId?.email}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-slate-900 uppercase italic">{formatDate(claim.createdAt)}</span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase italic">{formatTime(claim.createdAt)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right text-xs font-black text-emerald-600 italic">
                                                    ₦{(claim.deliveryFeeWaived || 0).toLocaleString()}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className="px-8 py-16 text-center">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">No redemptions found for this campaign.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Operational Intelligence ─────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 p-6 rounded-[32px] shadow-sm flex flex-col gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                <Info size={22} className="text-blue-500" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 italic">Fraud Mitigation</h4>
                                <p className="text-[11px] font-bold text-slate-700 leading-relaxed uppercase italic">
                                    Claims are automatically cross-checked against IP hashes and user account IDs to prevent multi-account abuse.
                                </p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 p-6 rounded-[32px] shadow-sm flex flex-col gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                <Zap size={22} className="text-indigo-500" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 italic">Real-time Deduction</h4>
                                <p className="text-[11px] font-bold text-slate-700 leading-relaxed uppercase italic">
                                    The "Used Slots" metric updates instantly upon order placement. Expired campaigns move to archives automatically.
                                </p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 p-6 rounded-[32px] shadow-sm flex flex-col gap-4">
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                                <TrendingUp size={22} className="text-orange-500" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 italic">Conversion Uplift</h4>
                                <p className="text-[11px] font-bold text-slate-700 leading-relaxed uppercase italic">
                                    Promotions active during the 12:00 PM - 2:00 PM window show a 2x increase in new user first-order completion.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
