"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import adminApi from "@/app/lib/adminApi";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
    Store, Clock, MapPin, Loader2, AlertCircle,
    CheckCircle2, Calendar, ChevronRight, User, Phone, Mail, ArrowRight, XCircle,
    RefreshCw, Filter, Search, FileText, Smartphone,
    Hash
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────
const formatDate = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    return isNaN(date.getTime())
        ? "—"
        : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const getTimeAgo = (d) => {
    if (!d) return "";
    const seconds = Math.floor((new Date() - new Date(d)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
};

function StatusBadge({ type, label, icon: Icon }) {
    const variants = {
        warning: "bg-amber-50 text-amber-700 border-amber-200/50",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
        info: "bg-blue-50 text-blue-700 border-blue-200/50",
        neutral: "bg-slate-50 text-slate-600 border-slate-200/50",
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${variants[type] || variants.neutral}`}>
            {Icon && <Icon size={12} />}
            {label}
        </span>
    );
}

export default function PendingVendorsPage() {
    const router = useRouter();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPending = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await adminApi.getAllVendors({ isApproved: "false" });
            const sorted = (data.vendors || []).sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
            setVendors(sorted);
            if (isRefresh) toast.success("Queue updated");
        } catch (err) {
            toast.error("Failed to load queue: " + err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-[1600px] mx-auto p-4 space-y-6">
                    {/* Breadcrumbs & Actions */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                                <Store size={12} />
                                <span>Vendor Management</span>
                                <ChevronRight size={10} />
                                <span className="text-orange-600">Approval Queue</span>
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pending Applications</h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchPending(true)}
                                disabled={refreshing || loading}
                                className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center gap-2 text-xs font-bold active:scale-95 disabled:opacity-50 shadow-sm"
                            >
                                <RefreshCw size={14} className={refreshing ? "animate-spin text-orange-500" : ""} />
                                {refreshing ? "Syncing..." : "Refresh Queue"}
                            </button>
                            <div className="h-10 px-4 bg-slate-900 text-white rounded-xl flex items-center gap-3 text-xs font-bold shadow-lg shadow-slate-900/20">
                                <Clock size={14} className="text-orange-400" />
                                <span>{vendors.length} Pending Review</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total Pending", val: vendors.length, icon: FileText, color: "blue" },
                            { label: "Oldest Submission", val: vendors.length ? getTimeAgo(vendors[0].createdAt) : "None", icon: Clock, color: "orange" },
                            { label: "Location Checks", val: vendors.filter(v => v.locationStatus === 'pending_review').length, icon: MapPin, color: "rose" },
                            { label: "Processing Level", val: "High Priority", icon: AlertCircle, color: "emerald" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600`}>
                                    <stat.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-lg font-black text-slate-900">{stat.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Content Table Area */}
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                        {loading ? (
                            <div className="py-24 flex flex-col items-center justify-center space-y-4">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-slate-100 rounded-full" />
                                    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
                                </div>
                                <p className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400">Fetching Applications...</p>
                            </div>
                        ) : vendors.length === 0 ? (
                            <div className="py-24 flex flex-col items-center justify-center text-center px-6">
                                <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6">
                                    <CheckCircle2 size={40} className="text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">Queue Clear</h3>
                                <p className="text-slate-500 text-sm font-medium max-w-xs">No vendor applications are currently awaiting administrative review.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Store / Brand</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Applicant Profile</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Operations</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Verification</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        <AnimatePresence>
                                            {vendors.map((vendor, idx) => (
                                                <motion.tr
                                                    key={vendor._id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    onClick={() => router.push(`/admin/vendors/pending/${vendor._id}`)}
                                                    className="group hover:bg-slate-50/50 cursor-pointer transition-colors"
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                                                                {vendor.logo ? (
                                                                    <img src={vendor.logo} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                        <Store size={20} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                                                                        {vendor.storeName || "Unnamed Store"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <MapPin size={12} className="text-slate-400" />
                                                                    <span className="text-[11px] font-medium text-slate-500 truncate max-w-[150px]">
                                                                        {vendor.address?.city || vendor.requestedCity || "No Location"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <User size={12} className="text-slate-400" />
                                                                <span className="text-xs font-bold text-slate-700">{vendor.name || "—"}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Mail size={12} className="text-slate-400" />
                                                                <span className="text-[11px] font-medium text-slate-500">{vendor.email || "—"}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Smartphone size={12} className="text-slate-400" />
                                                                <span className="text-[11px] font-medium text-slate-500">{vendor.phone || "—"}</span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar size={12} className="text-slate-400" />
                                                                <span className="text-[11px] font-bold text-slate-600">{formatDate(vendor.createdAt)}</span>
                                                                <span className="text-[10px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">
                                                                    {getTimeAgo(vendor.createdAt)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Hash size={12} className="text-slate-400" />
                                                                <code className="text-[10px] font-mono text-slate-400 truncate max-w-[80px]">
                                                                    {vendor._id}
                                                                </code>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-5 text-right">
                                                        <div className="flex flex-col items-end gap-2">
                                                            <div className="flex items-center gap-2">
                                                                {vendor.locationStatus === "pending_review" ? (
                                                                    <StatusBadge type="warning" label="Review Location" icon={AlertCircle} />
                                                                ) : (
                                                                    <StatusBadge type="success" label="Location OK" icon={CheckCircle2} />
                                                                )}
                                                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                                    <ArrowRight size={14} />
                                                                </div>
                                                            </div>
                                                            <span className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] group-hover:text-orange-500 transition-colors">
                                                                Click to Open Case
                                                            </span>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {/* Footer Info */}
                        <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Processing sorting: <span className="text-slate-900 font-black">FIFO (First-In-First-Out)</span>
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Total Items: <span className="text-slate-900 font-black">{vendors.length}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
