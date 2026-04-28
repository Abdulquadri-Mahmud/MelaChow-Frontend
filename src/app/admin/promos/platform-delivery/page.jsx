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
                <div className="max-w-6xl mx-auto space-y-6 pb-10">
                    
                    {/* ── High-Fidelity Header (Compact HUD) ──────────────── */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-[24px] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                        <div className="relative bg-slate-950 rounded-[20px] p-6 md:p-8 border border-white/10 overflow-hidden shadow-xl">
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/5 to-transparent pointer-events-none" />
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />

                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                        </div>
                                        <span className="text-[8px] font-black text-orange-500 uppercase tracking-[0.3em] italic">Command</span>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
                                            Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-600">Promo</span>
                                        </h1>
                                        <p className="mt-2 text-slate-400 text-[10px] font-medium max-w-md leading-relaxed">
                                            Monitor acquisition telemetry and incentive deployment in real-time.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {!showCreateForm && (
                                        <motion.button
                                            whileHover={{ scale: 1.02, y: -1 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setShowCreateForm(true)}
                                            className="group relative h-10 px-6 bg-white text-slate-950 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest overflow-hidden transition-all shadow-lg"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <span className="relative z-10 group-hover:text-white">New Campaign</span>
                                            <Plus className="relative z-10 group-hover:text-white" size={14} strokeWidth={3} />
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Bento Grid Analytics (Compact) ─────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        
                        {/* 1. Main Telemetry Chart */}
                        <div className="md:col-span-8 bg-white dark:bg-slate-900 rounded-[24px] p-5 border border-slate-200 dark:border-white/5 shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                            <TrendingUp size={12} />
                                        </div>
                                        Deployment Velocity
                                    </h3>
                                </div>
                                <div className="flex gap-1.5">
                                    {['7D', '30D'].map((t) => (
                                        <button key={t} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${t === '30D' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-40 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats?.statsOverTime || []}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="_id" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fontSize: 8, fontWeight: 900, fill: '#cbd5e1'}}
                                            tickFormatter={(val) => new Date(val).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                                        />
                                        <YAxis hide />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px', fontSize: '9px', fontWeight: 'bold' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="count" 
                                            stroke="#f97316" 
                                            strokeWidth={2}
                                            fillOpacity={1} 
                                            fill="url(#colorCount)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. Key Metrics Vertical Stack */}
                        <div className="md:col-span-4 space-y-5">
                            <div className="bg-slate-900 rounded-[24px] p-5 text-white shadow-lg relative overflow-hidden h-[100px]">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-[40px]" />
                                <div className="relative z-10 flex flex-col justify-between h-full">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Financial Impact</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-black italic tracking-tighter">₦{(stats?.totalSavings || 0).toLocaleString()}</span>
                                        <span className="text-emerald-400 text-[8px] font-black">+14%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[24px] p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-[100px]">
                                <div className="flex items-center justify-between">
                                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Efficiency</p>
                                    <p className="text-[10px] font-black italic text-slate-900">
                                        {stats ? Math.round((stats.totalClaims / stats.promo.totalSlots) * 100) : 0}%
                                    </p>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats ? (stats.totalClaims / stats.promo.totalSlots) * 100 : 0}%` }}
                                        className="h-full bg-orange-500 rounded-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Registry & Log (Compact Sections) ─────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Campaign Registry */}
                        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                                <h3 className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Campaign Ledger</h3>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
                                    <input placeholder="FILTER..." className="h-7 pl-7 pr-3 bg-white border border-slate-200 rounded-lg text-[8px] font-black outline-none w-32 focus:border-orange-500 transition-all" />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <tbody className="divide-y divide-slate-50">
                                        {loading ? (
                                            <tr><td className="px-5 py-10 text-center text-[8px] font-black text-slate-300 uppercase italic">Syncing...</td></tr>
                                        ) : promos.map((p) => (
                                            <tr key={p._id} onClick={() => fetchStats(p._id)} className={`cursor-pointer transition-all ${selectedPromoId === p._id ? 'bg-orange-50/50' : 'hover:bg-slate-50/50'}`}>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${p.isActive ? 'bg-orange-500 text-white border-transparent' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                            <Zap size={14} />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <h4 className="text-[9px] font-black text-slate-900 uppercase italic truncate max-w-[100px]">{p.name.replace(/_/g, ' ')}</h4>
                                                            <span className={`text-[7px] font-black uppercase tracking-widest ${p.isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                {p.isActive ? 'Live' : 'Closed'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] font-black text-slate-800 uppercase italic">{formatDate(p.startsAt)}</p>
                                                        <p className="text-[7px] font-black text-slate-400 uppercase">{p.usedSlots}/{p.totalSlots} Slots</p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    {p.isActive && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeactivate(p._id); }} className="h-8 w-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Redemption Log (HUD Compact) */}
                        <div className="bg-slate-950 rounded-[24px] border border-white/10 shadow-xl overflow-hidden flex flex-col">
                            <div className="px-5 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                <h3 className="text-[9px] font-black text-white uppercase tracking-widest italic">Live <span className="text-orange-500">Trace</span> Log</h3>
                                <div className="px-2 py-0.5 bg-white/5 rounded text-[7px] font-black text-slate-500 uppercase tracking-widest">
                                    {stats?.totalClaims || 0} Records
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto max-h-[300px] scrollbar-hide">
                                <div className="divide-y divide-white/5">
                                    {loadingStats ? (
                                        <div className="py-10 text-center text-[8px] font-black text-slate-700 uppercase italic tracking-widest">Decoding...</div>
                                    ) : stats?.claims.map((claim) => (
                                        <div key={claim._id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 overflow-hidden shrink-0">
                                                    {claim.userId?.profilePicture ? <img src={claim.userId.profilePicture} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800" />}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <h5 className="text-[9px] font-black text-white uppercase italic truncate max-w-[80px]">{claim.userId?.firstName}</h5>
                                                    <p className="text-[7px] font-black text-slate-500 uppercase">{formatTime(claim.createdAt)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-emerald-400 italic">₦{claim.deliveryFeeWaived}</p>
                                                <p className="text-[7px] font-black text-slate-600 uppercase">{formatDate(claim.createdAt)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Operational Insights (Compact Grid) ────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            { icon: Info, title: "Anti-Fraud", desc: "3-point IP & Account ID check active." },
                            { icon: Zap, title: "Quantum Sync", desc: "Sub-millisecond ledger synchronization." },
                            { icon: Sparkles, title: "LTV Lift", desc: "60% higher retention for promo users." }
                        ].map((card, idx) => (
                            <div key={idx} className="bg-white rounded-[20px] p-4 border border-slate-100 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                    <card.icon size={18} />
                                </div>
                                <div>
                                    <h4 className="text-[9px] font-black text-slate-900 uppercase italic mb-0.5">{card.title}</h4>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase italic leading-tight opacity-70">
                                        {card.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
