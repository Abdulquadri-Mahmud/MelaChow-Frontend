"use client";

import { useState, useEffect } from "react";
import adminApi from "@/app/lib/adminApi";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
    Gift,
    Plus,
    Store,
    Calendar,
    Users,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Info,
    Trash2,
    Sparkles,
    ChevronRight,
    Search,
    Filter,
    Building2,
    Banknote,
    Activity,
    CreditCard,
    Target
} from "lucide-react";
import toast from "react-hot-toast";

export default function VendorDeliveryPromosPage() {
    const [promos, setPromos] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [vendorSearch, setVendorSearch] = useState("");
    const [showVendorResults, setShowVendorResults] = useState(false);

    const [form, setForm] = useState({
        vendorId: "",
        startsAt: "",
        endsAt: "",
        maxOrders: "",
        adminNote: "",
    });

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Fetch separately to avoid one failure blocking everything
                const promoRes = await adminApi.getVendorDeliveryPromos().catch(e => {
                    console.error("Promo fetch error:", e);
                    return { promos: [] };
                });
                
                const vendorRes = await adminApi.getAllVendors({ limit: 1000 }).catch(e => {
                    console.error("Vendor fetch error:", e);
                    return { vendors: [] };
                });

                setPromos(promoRes.promos || []);
                setVendors(vendorRes.vendors || []);
                
                console.log("Loaded Vendors Count:", (vendorRes.vendors || []).length);
            } catch (err) {
                toast.error("Critical synchronization failure");
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
            await adminApi.createVendorDeliveryPromo({
                vendorId: form.vendorId,
                startsAt: form.startsAt,
                endsAt: form.endsAt,
                maxOrders: form.maxOrders ? Number(form.maxOrders) : null,
                adminNote: form.adminNote,
            });

            toast.success("Vendor sponsorship activated!");
            setForm({ vendorId: "", startsAt: "", endsAt: "", maxOrders: "", adminNote: "" });
            setVendorSearch("");
            setShowCreateForm(false);

            const refreshed = await adminApi.getVendorDeliveryPromos();
            setPromos(refreshed.promos || []);
        } catch (err) {
            toast.error(err.message || "Failed to activate sponsorship");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeactivate = async (promoId) => {
        const confirmDeactivate = window.confirm("Terminate this sponsorship agreement? Active orders will no longer receive free delivery.");
        if (!confirmDeactivate) return;

        try {
            await adminApi.deactivateVendorDeliveryPromo(promoId);
            toast.success("Sponsorship terminated");
            const refreshed = await adminApi.getVendorDeliveryPromos();
            setPromos(refreshed.promos || []);
        } catch (err) {
            toast.error(err.message || "Termination failed");
        }
    };

    const formatDate = (d) =>
        d ? new Date(d).toLocaleDateString("en-NG", { day: 'numeric', month: 'short', year: 'numeric' }) : "—";

    const formatTime = (d) =>
        d ? new Date(d).toLocaleTimeString("en-NG", { hour: '2-digit', minute: '2-digit' }) : "";

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-7xl mx-auto space-y-8 pb-12">

                    {/* ── Header ─────────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100 shrink-0">
                                    <Gift size={24} className="text-white" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                                        Vendor <span className="text-blue-600">Sponsored</span> Delivery
                                    </h1>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                        <Building2 size={12} className="text-blue-500" />
                                        Marketing Infrastructure / B2B Logistics
                                    </p>
                                </div>
                            </div>
                        </div>

                        {!showCreateForm && (
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowCreateForm(true)}
                                className="h-12 px-8 bg-slate-900 text-white rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all border-b-4 border-slate-700 active:border-b-0 active:translate-y-1"
                            >
                                <Plus size={18} strokeWidth={3} />
                                New Sponsorship
                            </motion.button>
                        )}
                    </div>

                    {/* ── Metric Grid ────────────────────────────────────── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Active Partnerships", value: promos.filter(p => p.isActive).length, icon: Activity, color: "blue" },
                            { label: "Fulfillment Claims", value: promos.reduce((acc, curr) => acc + (curr.usedOrders || 0), 0), icon: CheckCircle2, color: "emerald" },
                            { label: "Partner Contribution", value: `₦${(promos.reduce((acc, curr) => acc + (curr.usedOrders || 0), 0) * 500).toLocaleString()}`, icon: Banknote, color: "amber" },
                            { label: "Influence Reach", value: `${vendors.length} Stores`, icon: Target, color: "indigo" }
                        ].map((m, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                                <div className={`w-10 h-10 rounded-xl bg-${m.color}-50 flex items-center justify-center mb-4 transition-colors group-hover:bg-${m.color}-100`}>
                                    <m.icon size={20} className={`text-${m.color}-600`} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
                                <p className="text-2xl font-black text-slate-900">{m.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Create Form (Glassmorphism) ───────────────────── */}
                    <AnimatePresence>
                        {showCreateForm && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: 20 }}
                                className="bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden"
                            >
                                <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                            <Sparkles className="text-blue-400" size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Sponsorship Builder</h2>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Configure campaign parameters</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowCreateForm(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
                                        <XCircle size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleCreate} className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-1">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Partner</label>
                                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                                    {vendors.length} Partners Synchronized
                                                </span>
                                            </div>
                                            <div className="relative">
                                                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Search restaurants..."
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"
                                                    value={vendorSearch}
                                                    onChange={(e) => {
                                                        setVendorSearch(e.target.value);
                                                        setShowVendorResults(true);
                                                    }}
                                                    onFocus={() => setShowVendorResults(true)}
                                                />
                                                <AnimatePresence>
                                                    {showVendorResults && (
                                                        <>
                                                            <div 
                                                                className="fixed inset-0 z-40" 
                                                                onClick={() => setShowVendorResults(false)}
                                                            />
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: 10 }}
                                                                className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto scrollbar-hide"
                                                            >
                                                                {vendors
                                                                    .filter(v => v.storeName.toLowerCase().includes(vendorSearch.toLowerCase()))
                                                                    .map(v => (
                                                                        <button
                                                                            key={v._id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setForm(f => ({ ...f, vendorId: v._id }));
                                                                                setVendorSearch(v.storeName);
                                                                                setShowVendorResults(false);
                                                                            }}
                                                                            className="w-full px-5 py-3 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0"
                                                                        >
                                                                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                                                                                <Store size={14} className="text-orange-500" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-bold text-slate-900">{v.storeName}</p>
                                                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{v.address?.city || 'Partner'}</p>
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                {vendors.filter(v => v.storeName.toLowerCase().includes(vendorSearch.toLowerCase())).length === 0 && (
                                                                    <div className="px-5 py-8 text-center">
                                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching partners</p>
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            {form.vendorId && (
                                                <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                                                    <CheckCircle2 size={12} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Partner Selected</span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Activation Start</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="datetime-local"
                                                    value={form.startsAt}
                                                    onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Campaign Expiry</label>
                                            <div className="relative">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="datetime-local"
                                                    value={form.endsAt}
                                                    onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))}
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Order Capacity (Claims)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={form.maxOrders}
                                                onChange={e => setForm(f => ({ ...f, maxOrders: e.target.value }))}
                                                placeholder="Unlimited if empty"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Operational Note (Internal)</label>
                                            <div className="relative">
                                                <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="text"
                                                    value={form.adminNote}
                                                    onChange={e => setForm(f => ({ ...f, adminNote: e.target.value }))}
                                                    placeholder="Payment ref, agreement terms, etc."
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>

                                        <div className="md:col-span-3 pt-4">
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:shadow-2xl transition-all disabled:opacity-50"
                                            >
                                                {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                                {submitting ? "Processing Transaction..." : "Initialize Sponsorship"}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Data Table ────────────────────────────────────── */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Sponsorship Ledger</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Active & historic partner campaigns</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                                    <input placeholder="Search vendors..." className="h-10 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all w-64" />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                                        <th className="px-8 py-5 text-left">Partner Entity</th>
                                        <th className="px-8 py-5 text-left">Time Window</th>
                                        <th className="px-8 py-5 text-left">Burn Rate</th>
                                        <th className="px-8 py-5 text-left">Status</th>
                                        <th className="px-8 py-5 text-right">Registry</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-24 text-center">
                                                <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={40} />
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Syncing with blockchain ledger...</p>
                                            </td>
                                        </tr>
                                    ) : promos.length > 0 ? promos.map((p) => {
                                        const progress = p.maxOrders ? Math.min(100, (p.usedOrders / p.maxOrders) * 100) : 0;

                                        return (
                                            <tr key={p._id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm group-hover:bg-white transition-colors">
                                                            <Store size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-black text-slate-900 tracking-tight truncate">{p.vendorId?.storeName || "System Entity"}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[200px] mt-0.5">{p.adminNote || "Direct Partnership"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                            <span className="text-[11px] font-black text-slate-700">{formatDate(p.startsAt)}</span>
                                                            <ChevronRight size={10} className="text-slate-300" />
                                                            <span className="text-[11px] font-black text-slate-700">{formatDate(p.endsAt)}</span>
                                                        </div>
                                                        <div className="text-[9px] font-bold text-slate-400 uppercase ml-3.5">
                                                            {formatTime(p.startsAt)} — {formatTime(p.endsAt)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-2 min-w-[140px]">
                                                        <div className="flex justify-between items-end px-0.5">
                                                            <span className="text-[11px] font-black text-slate-900">{p.usedOrders || 0} <span className="text-slate-400 font-bold">/ {p.maxOrders || '∞'}</span></span>
                                                            {p.maxOrders && <span className={`text-[9px] font-black ${progress > 80 ? 'text-rose-500' : 'text-blue-600'}`}>{Math.round(progress)}%</span>}
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                            <div 
                                                                className={`h-full rounded-full transition-all duration-1000 ${p.isActive ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]' : 'bg-slate-300'}`}
                                                                style={{ width: `${p.maxOrders ? progress : 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {p.isActive ? (
                                                        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                            On Air
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                                            <div className="w-2 h-2 rounded-full bg-slate-400" />
                                                            Offline
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    {p.isActive ? (
                                                        <button
                                                            onClick={() => handleDeactivate(p._id)}
                                                            className="w-10 h-10 flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-500 rounded-xl transition-all shadow-sm hover:shadow-rose-200"
                                                            title="Force Termination"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Archived</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-32 text-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                                                    <Gift size={32} className="text-slate-200" />
                                                </div>
                                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">No Active Partnerships</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Growth begins with strategic partner marketing</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
