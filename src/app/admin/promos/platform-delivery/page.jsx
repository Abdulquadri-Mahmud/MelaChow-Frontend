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
    ArrowUpRight,
    X,
    Activity,
    ShieldCheck,
    CreditCard,
    LayoutDashboard
} from "lucide-react";
import toast from "react-hot-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function PlatformDeliveryPromosPage() {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showCreatePanel, setShowCreatePanel] = useState(false);
    const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
    
    // Edit panel state
    const [showEditPanel, setShowEditPanel] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [editForm, setEditForm] = useState({
        totalSlots: "",
        endsAt: "",
        startsAt: "",
        name: "",
    });
    const [editSubmitting, setEditSubmitting] = useState(false);
    
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

            toast.success("Platform promo activated!");
            setForm({ name: "first_order_free_delivery", totalSlots: "100", startsAt: "", endsAt: "" });
            setShowCreatePanel(false);

            const refreshed = await adminApi.getPlatformDeliveryPromos();
            setPromos(refreshed.promos || []);
            
            const active = refreshed.promos.find(p => p.isActive);
            if (active) fetchStats(active._id);
        } catch (err) {
            toast.error(err.message || "Failed to create promo");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeactivate = async (promoId) => {
        const confirmDeactivate = window.confirm("Deactivate this promotion? This action is permanent.");
        if (!confirmDeactivate) return;

        try {
            await adminApi.deactivatePlatformDeliveryPromo(promoId);
            toast.success("Promotion deactivated");
            const refreshed = await adminApi.getPlatformDeliveryPromos();
            setPromos(refreshed.promos || []);
            
            if (selectedPromoId === promoId) {
                fetchStats(promoId);
            }
        } catch (err) {
            toast.error(err.message || "Failed to deactivate");
        }
    };

    const handleOpenEdit = (promo) => {
        setEditingPromo(promo);
        setEditForm({
            totalSlots: String(promo.totalSlots),
            endsAt: promo.endsAt
                ? new Date(promo.endsAt).toISOString().slice(0, 10)
                : "",
            startsAt: promo.startsAt
                ? new Date(promo.startsAt).toISOString().slice(0, 10)
                : "",
            name: promo.name || "",
        });
        setShowEditPanel(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingPromo) return;
        setEditSubmitting(true);

        try {
            const payload = {};
            if (editForm.totalSlots) payload.totalSlots = Number(editForm.totalSlots);
            if (editForm.endsAt)     payload.endsAt     = editForm.endsAt;
            if (editForm.startsAt)   payload.startsAt   = editForm.startsAt;
            if (editForm.name)       payload.name       = editForm.name;

            await adminApi.updatePlatformDeliveryPromo(editingPromo._id, payload);
            toast.success("Promo updated successfully");

            setShowEditPanel(false);
            setEditingPromo(null);

            const refreshed = await adminApi.getPlatformDeliveryPromos();
            setPromos(refreshed.promos || []);

            const active = refreshed.promos.find(p => p.isActive);
            if (active) fetchStats(active._id);
        } catch (err) {
            toast.error(err.message || "Failed to update promo");
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleReactivate = async (promoId) => {
        const confirmReactivate = window.confirm(
            "Reactivate this promotion? A new active promo cannot exist if another is already running."
        );
        if (!confirmReactivate) return;

        try {
            await adminApi.reactivatePlatformDeliveryPromo(promoId);
            toast.success("Promotion reactivated");

            const refreshed = await adminApi.getPlatformDeliveryPromos();
            setPromos(refreshed.promos || []);

            const active = refreshed.promos.find(p => p.isActive);
            if (active) fetchStats(active._id);
        } catch (err) {
            toast.error(err.message || "Failed to reactivate");
        }
    };

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString("en-NG", { day: 'numeric', month: 'short' }) : "Unlimited";

    const formatFullDate = (d) =>
        d ? new Date(d).toLocaleDateString("en-NG", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Unlimited";

    const activePromo = promos.find(p => p.isActive);

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-6xl mx-auto space-y-4 pb-10 font-sans selection:bg-orange-500/30">
                    
                    {/* ── Minimalist HUD Header ─────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <LayoutDashboard size={14} className="text-orange-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Promotion Control Center</span>
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
                                Platform <span className="text-orange-500">Delivery</span>
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setShowCreatePanel(true)}
                                className="h-10 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 dark:hover:bg-orange-500 dark:hover:text-white transition-all shadow-lg active:scale-95"
                            >
                                <Plus size={14} strokeWidth={3} />
                                New Campaign
                            </button>
                        </div>
                    </div>

                    {/* ── Top Level KPIs (Compact) ────────────────────── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { 
                                label: "Active Campaign", 
                                value: activePromo ? "LIVE" : "NONE", 
                                icon: Activity, 
                                color: "text-emerald-500", 
                                bg: "bg-emerald-500/10",
                                custom: activePromo && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeactivate(activePromo._id);
                                        }}
                                        className="relative w-7 h-3.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                    >
                                        <motion.div 
                                            animate={{ x: 14 }}
                                            className="absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white rounded-full"
                                        />
                                    </button>
                                )
                            },
                            { label: "Total Claims", value: stats?.totalClaims || 0, icon: UserCheck, color: "text-orange-500", bg: "bg-orange-500/10" },
                            { label: "Revenue Saved", value: `₦${(stats?.totalSavings || 0).toLocaleString()}`, icon: CreditCard, color: "text-blue-500", bg: "bg-blue-500/10" },
                            { label: "Slots Rem.", value: activePromo ? (activePromo.totalSlots - activePromo.usedSlots) : 0, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
                        ].map((kpi, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center shrink-0`}>
                                        <kpi.icon size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{kpi.label}</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{kpi.value}</p>
                                    </div>
                                </div>
                                {kpi.custom}
                            </div>
                        ))}
                    </div>

                    {/* ── Main Dashboard Layout ────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        
                        {/* Left: Telemetry & Log */}
                        <div className="lg:col-span-8 space-y-4">
                            
                            {/* Deployment Chart */}
                            <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-white/5 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                        <TrendingUp size={14} className="text-orange-500" />
                                        Redemption Velocity
                                    </h3>
                                </div>
                                <div className="h-[220px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats?.statsOverTime || []}>
                                            <defs>
                                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="_id" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{fontSize: 8, fontWeight: 900, fill: '#94a3b8'}}
                                                tickFormatter={(val) => new Date(val).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                                            />
                                            <YAxis hide />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px', fontSize: '10px', fontWeight: 'bold' }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="count" 
                                                stroke="#f97316" 
                                                strokeWidth={3}
                                                fillOpacity={1} 
                                                fill="url(#chartGradient)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Live Terminal Log */}
                            <div className="bg-slate-950 rounded-[28px] border border-white/5 overflow-hidden flex flex-col shadow-2xl">
                                <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Live Stream</h3>
                                    </div>
                                    <span className="text-[8px] font-black text-slate-500 uppercase">Secure Feed</span>
                                </div>
                                <div className="h-[280px] overflow-y-auto scrollbar-hide p-2 divide-y divide-white/5">
                                    {loadingStats ? (
                                        <div className="h-full flex items-center justify-center text-[10px] font-black text-slate-700 uppercase italic animate-pulse">Syncing encrypted data...</div>
                                    ) : stats?.claims.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                                            <Info size={20} />
                                            <p className="text-[9px] font-black uppercase tracking-widest">No redemptions detected</p>
                                        </div>
                                    ) : (
                                        stats?.claims.map((claim) => (
                                            <div key={claim._id} className="p-3 flex items-center justify-between hover:bg-white/5 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                                                        {claim.userId?.profilePicture ? 
                                                            <img src={claim.userId.profilePicture} alt="" className="w-full h-full object-cover rounded-xl" /> : 
                                                            <Users size={16} className="text-slate-500" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <h5 className="text-[10px] font-black text-white uppercase italic truncate max-w-[120px]">{claim.userId?.firstName || "Anonymous"}</h5>
                                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">
                                                            {new Date(claim.createdAt).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[11px] font-black text-emerald-400 italic">₦{claim.deliveryFeeWaived.toLocaleString()}</p>
                                                    <div className="flex items-center gap-1 justify-end text-[7px] font-black text-slate-600 uppercase">
                                                        <CheckCircle2 size={8} /> Verified
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: History & Insights */}
                        <div className="lg:col-span-4 space-y-4">
                            
                            {/* Campaign Registry */}
                            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
                                <div className="px-6 py-4 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">History</h3>
                                    <Filter size={14} className="text-slate-400" />
                                </div>
                                <div className="divide-y divide-slate-50 dark:divide-white/5 max-h-[480px] overflow-y-auto scrollbar-hide">
                                    {loading ? (
                                        <div className="p-10 text-center text-[10px] font-black text-slate-300 uppercase italic">Syncing...</div>
                                    ) : promos.map((p) => (
                                        <div 
                                            key={p._id} 
                                            onClick={() => fetchStats(p._id)} 
                                            className={`p-4 cursor-pointer transition-all border-l-4 ${selectedPromoId === p._id ? 'bg-orange-50/50 dark:bg-orange-500/5 border-orange-500' : 'hover:bg-slate-50/50 dark:hover:bg-white/5 border-transparent'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="space-y-1">
                                                    <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase italic truncate max-w-[140px]">{p.name.replace(/_/g, ' ')}</h4>
                                                    <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${p.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        {p.isActive ? 'ACTIVE' : 'EXPIRED'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenEdit(p);
                                                        }}
                                                        className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-orange-500 transition-all"
                                                        title="Edit promo"
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                                            stroke="currentColor" strokeWidth="2.5"
                                                            strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                        </svg>
                                                    </button>

                                                    {/* Unified Toggle Switch */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            p.isActive ? handleDeactivate(p._id) : handleReactivate(p._id);
                                                        }}
                                                        className={`relative w-8 h-4 rounded-full transition-all duration-300 ${p.isActive ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-slate-200 dark:bg-zinc-800'}`}
                                                        title={p.isActive ? "Deactivate" : "Activate"}
                                                    >
                                                        <motion.div 
                                                            animate={{ x: p.isActive ? 18 : 2 }}
                                                            className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"
                                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                <span>{formatDate(p.startsAt)}</span>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                    {p.usedSlots} / {p.totalSlots} USES
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Operational Insights Card */}
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[28px] p-6 text-white shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[60px] group-hover:scale-150 transition-transform duration-700" />
                                <div className="relative z-10 space-y-4">
                                    <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                                        <ShieldCheck size={20} className="text-orange-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black uppercase italic tracking-[0.15em] mb-1">System Guard Active</h4>
                                        <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                                            Platform integrity verified. Anti-fraud monitoring for first-order claims is currently patrolling all redemptions.
                                        </p>
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest mb-1.5">
                                            <span>Security Status</span>
                                            <span className="text-emerald-400">OPTIMAL</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-400 w-[94%]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Create Campaign Slide-Over ─────────────────────── */}
                    <AnimatePresence>
                        {showCreatePanel && (
                            <>
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowCreatePanel(false)}
                                    className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100]"
                                />
                                <motion.div 
                                    initial={{ x: "100%" }}
                                    animate={{ x: 0 }}
                                    exit={{ x: "100%" }}
                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[101] flex flex-col border-l border-slate-100 dark:border-white/5"
                                >
                                    <div className="p-6 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Deploy Campaign</h2>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Platform Delivery Promo</p>
                                        </div>
                                        <button 
                                            onClick={() => setShowCreatePanel(false)}
                                            className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2 relative">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Campaign Template</label>
                                                <div className="relative">
                                                    <Gift className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                    <input 
                                                        value={form.name}
                                                        onFocus={() => setShowTemplateDropdown(true)}
                                                        onBlur={() => setTimeout(() => setShowTemplateDropdown(false), 200)}
                                                        onChange={(e) => setForm({...form, name: e.target.value})}
                                                        placeholder="e.g. holiday_special"
                                                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-12 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-orange-500/20"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                        <ChevronRight className={`rotate-90 transition-transform ${showTemplateDropdown ? 'rotate-[270deg]' : ''}`} size={14} />
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {showTemplateDropdown && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden z-[110] p-1"
                                                        >
                                                            {[
                                                                "first_order_free_delivery",
                                                                "weekend_delivery_perk",
                                                                "seasonal_delivery_promo",
                                                                "loyalty_delivery_reward"
                                                            ].map((temp) => (
                                                                <button
                                                                    key={temp}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setForm({...form, name: temp});
                                                                        setShowTemplateDropdown(false);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest transition-colors flex items-center justify-between group"
                                                                >
                                                                    {temp.replace(/_/g, ' ')}
                                                                    <Plus size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Allocation (Slots)</label>
                                                <div className="relative">
                                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                    <input 
                                                        type="number"
                                                        value={form.totalSlots}
                                                        onChange={(e) => setForm({...form, totalSlots: e.target.value})}
                                                        placeholder="e.g. 500"
                                                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-orange-500/20"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Start Date</label>
                                                    <input 
                                                        type="date"
                                                        value={form.startsAt}
                                                        onChange={(e) => setForm({...form, startsAt: e.target.value})}
                                                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-orange-500/20"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">End Date</label>
                                                    <input 
                                                        type="date"
                                                        value={form.endsAt}
                                                        onChange={(e) => setForm({...form, endsAt: e.target.value})}
                                                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-orange-500/20"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-[20px] bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 space-y-2">
                                            <div className="flex items-center gap-2 text-orange-600">
                                                <Zap size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Logic Preview</span>
                                            </div>
                                            <p className="text-[9px] text-orange-600/80 font-medium leading-relaxed italic">
                                                This campaign will automatically waive delivery fees for users who have never placed a paid order. 
                                                System checks for unique phone, email, and IP address.
                                            </p>
                                        </div>
                                    </form>

                                    <div className="p-6 border-t border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50">
                                        <button 
                                            onClick={handleCreate}
                                            disabled={submitting}
                                            className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 hover:bg-orange-600 dark:hover:bg-orange-500 dark:hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50"
                                        >
                                            {submitting ? <Loader2 className="animate-spin" size={18} /> : "Initiate Deployment"}
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {showEditPanel && editingPromo && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowEditPanel(false)}
                                    className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100]"
                                />
                                <motion.div
                                    initial={{ x: "100%" }}
                                    animate={{ x: 0 }}
                                    exit={{ x: "100%" }}
                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[101] flex flex-col border-l border-slate-100 dark:border-white/5"
                                >
                                    <div className="p-6 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                                                Edit Campaign
                                            </h2>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {editingPromo.name.replace(/_/g, " ")}
                                                {" · "}
                                                {editingPromo.usedSlots} of {editingPromo.totalSlots} slots used
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowEditPanel(false)}
                                            className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-6 space-y-5">

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                                Campaign Name
                                            </label>
                                            <input
                                                value={editForm.name}
                                                onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                                                placeholder="e.g. first_order_free_delivery"
                                                className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-orange-500/20"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    Total Slots
                                                </label>
                                                <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">
                                                    Min: {editingPromo.usedSlots} (already claimed)
                                                </span>
                                            </div>
                                            <div className="relative">
                                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="number"
                                                    min={editingPromo.usedSlots}
                                                    value={editForm.totalSlots}
                                                    onChange={(e) => setEditForm(f => ({ ...f, totalSlots: e.target.value }))}
                                                    className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-orange-500/20"
                                                />
                                            </div>
                                            {editForm.totalSlots && Number(editForm.totalSlots) > editingPromo.totalSlots && (
                                                <p className="text-[10px] font-bold text-emerald-500 px-1">
                                                    +{Number(editForm.totalSlots) - editingPromo.totalSlots} additional slots
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                                    Start Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={editForm.startsAt}
                                                    onChange={(e) => setEditForm(f => ({ ...f, startsAt: e.target.value }))}
                                                    className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-orange-500/20"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                                    End Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={editForm.endsAt}
                                                    onChange={(e) => setEditForm(f => ({ ...f, endsAt: e.target.value }))}
                                                    className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-orange-500/20"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        Campaign Status
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase italic">
                                                        {editingPromo.isActive ? "Live & Accepting Claims" : "Inactive / On Hold"}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        editingPromo.isActive ? handleDeactivate(editingPromo._id) : handleReactivate(editingPromo._id);
                                                    }}
                                                    className={`relative w-10 h-5 rounded-full transition-all duration-300 ${editingPromo.isActive ? 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]' : 'bg-slate-200 dark:bg-zinc-700'}`}
                                                >
                                                    <motion.div 
                                                        animate={{ x: editingPromo.isActive ? 22 : 2 }}
                                                        className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                    />
                                                </button>
                                            </div>

                                            <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                                    Slot Consumption
                                                </p>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">Total Utilized</span>
                                                    <span className="text-[11px] font-black text-orange-500">
                                                        {editingPromo.usedSlots} / {editForm.totalSlots || editingPromo.totalSlots}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-orange-500 rounded-full transition-all"
                                                        style={{
                                                            width: `${Math.min(
                                                                100,
                                                                (editingPromo.usedSlots /
                                                                    (Number(editForm.totalSlots) || editingPromo.totalSlots)) * 100
                                                            )}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <p className="text-[9px] text-slate-400 italic font-medium leading-relaxed">
                                                Toggling the status above will immediately update the campaign's availability on the storefront.
                                            </p>
                                        </div>
                                    </form>

                                    <div className="p-6 border-t border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50">
                                        <button
                                            onClick={handleUpdate}
                                            disabled={editSubmitting}
                                            className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 hover:bg-orange-600 dark:hover:bg-orange-500 dark:hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50"
                                        >
                                            {editSubmitting
                                                ? <Loader2 className="animate-spin" size={18} />
                                                : "Save Changes"
                                            }
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
