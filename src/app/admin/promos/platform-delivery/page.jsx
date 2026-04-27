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
    Filter
} from "lucide-react";
import toast from "react-hot-toast";

export default function PlatformDeliveryPromosPage() {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

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
            } catch (err) {
                toast.error("Failed to load promotions");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

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

                    {/* ── Active Status Banner ────────────────────────────── */}
                    {activePromo ? (
                        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 text-white shadow-xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                                        <CheckCircle2 size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight uppercase">Platform Promo Live</h2>
                                        <p className="text-emerald-100 text-sm font-medium">Free delivery is currently active for all first-time customers.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8 px-8 border-x border-white/20">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200/80 mb-1">Slots Left</p>
                                        <p className="text-2xl font-black">{activePromo.remainingSlots ?? activePromo.totalSlots}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200/80 mb-1">Used</p>
                                        <p className="text-2xl font-black">{activePromo.usedSlots || 0}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeactivate(activePromo._id)}
                                    className="px-6 py-2.5 bg-white text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-50 transition-colors shadow-lg"
                                >
                                    End Campaign
                                </button>
                            </div>
                        </div>
                    ) : !loading && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center gap-4 text-amber-800">
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                                <Info size={24} className="text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm uppercase tracking-tight">No active growth campaign</h3>
                                <p className="text-xs font-medium opacity-80">First-time customers are currently paying standard delivery fees.</p>
                            </div>
                        </div>
                    )}

                    {/* ── Create Form (Collapsible) ───────────────────────── */}
                    <AnimatePresence>
                        {showCreateForm && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
                            >
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                        <Gift size={14} className="text-orange-500" /> Campaign Configuration
                                    </h2>
                                    <button onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-600">
                                        <XCircle size={18} />
                                    </button>
                                </div>

                                <form onSubmit={handleCreate} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Promotion Name</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            readOnly
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 outline-none"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Slots (First Orders)</label>
                                        <input
                                            type="number"
                                            value={form.totalSlots}
                                            onChange={e => setForm(f => ({ ...f, totalSlots: e.target.value }))}
                                            placeholder="e.g. 100"
                                            required
                                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-orange-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Activation Window (Start)</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                type="datetime-local"
                                                value={form.startsAt}
                                                onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
                                                className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-orange-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deactivation Window (End)</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                type="datetime-local"
                                                value={form.endsAt}
                                                onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))}
                                                className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-orange-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 lg:col-span-2 flex items-end">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-100 disabled:opacity-50 hover:from-orange-600 hover:to-amber-600 transition-all"
                                        >
                                            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                                            {submitting ? "Processing..." : "Deploy Campaign"}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Promotion History Table ─────────────────────────── */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Promotion Registry</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Historical and active campaigns</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                    <input placeholder="Search..." className="h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none" />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                        <th className="px-6 py-4 text-left">Status</th>
                                        <th className="px-6 py-4 text-left">Period</th>
                                        <th className="px-6 py-4 text-left">Slots Used</th>
                                        <th className="px-6 py-4 text-left">Activation</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-20 text-center">
                                                <Loader2 className="animate-spin text-orange-500 mx-auto mb-2" size={32} />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syncing Intel...</p>
                                            </td>
                                        </tr>
                                    ) : promos.length > 0 ? promos.map((p) => (
                                        <tr key={p._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                {p.isActive ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-wider border border-slate-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                        Archived
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={12} className="text-slate-300" />
                                                        <span className="text-xs font-bold text-slate-700">{formatDate(p.startsAt)}</span>
                                                        <ChevronRight size={10} className="text-slate-300" />
                                                        <span className="text-xs font-bold text-slate-700">{formatDate(p.endsAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase ml-5">
                                                        {formatTime(p.startsAt)} — {formatTime(p.endsAt)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 max-w-[100px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-500 ${p.isActive ? 'bg-orange-500' : 'bg-slate-300'}`}
                                                            style={{ width: `${Math.min(100, ((p.usedSlots || 0) / (p.totalSlots || 1)) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-black text-slate-900">
                                                        {p.usedSlots || 0} <span className="text-slate-400 font-bold">/ {p.totalSlots}</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Users size={14} className="text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-600">
                                                        {p.usedSlots || 0} Claims
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {p.isActive ? (
                                                    <button
                                                        onClick={() => handleDeactivate(p._id)}
                                                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Deactivate"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Completed</span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-20 text-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                    <Filter size={24} className="text-slate-200" />
                                                </div>
                                                <h3 className="text-xs font-black text-slate-900 uppercase">No Campaign Data</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Start your first acquisition campaign today</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── Operational Tips ────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                <Info size={18} className="text-blue-600" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Growth Tip</h4>
                                <p className="text-[11px] font-bold text-blue-700/70 leading-relaxed uppercase">First-order free delivery increases conversion rates by up to 45% during peak hours.</p>
                            </div>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex gap-4">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                                <Zap size={18} className="text-indigo-600" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Live Slots</h4>
                                <p className="text-[11px] font-bold text-indigo-700/70 leading-relaxed uppercase">Slots are deducted in real-time as soon as a customer places a successful order.</p>
                            </div>
                        </div>
                        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex gap-4">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                <Gift size={18} className="text-orange-600" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-orange-900 uppercase tracking-widest mb-1">Smart Deactivation</h4>
                                <p className="text-[11px] font-bold text-orange-700/70 leading-relaxed uppercase">Expired campaigns move to history automatically once time window or slots hit zero.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
