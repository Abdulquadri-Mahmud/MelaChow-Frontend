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
    CheckCircle2, ChevronRight, User, FileText, RefreshCw, ClipboardList
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

// ─── Shared Components ─────────────────────────────────────────────────────────
const Badge = ({ children, variant = "default" }) => {
    const variants = {
        default: "bg-slate-50 text-slate-600 border-slate-200",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        danger: "bg-rose-50 text-rose-700 border-rose-200",
        info: "bg-blue-50 text-blue-700 border-blue-200",
        orange: "bg-orange-50 text-orange-700 border-orange-200",
        dark: "bg-slate-900 text-white border-slate-800"
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${variants[variant]}`}>
            {children}
        </span>
    );
};

const TableCard = ({ children }) => (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="h-0.5 bg-gradient-to-r from-orange-500 to-amber-400" />
        <div className="overflow-x-auto">{children}</div>
    </div>
);

const Th = ({ children, right, center }) => (
    <th className={`px-4 py-2.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.15em] bg-slate-50 border-b border-slate-100 ${right ? "text-right" : ""} ${center ? "text-center" : ""}`}>
        {children}
    </th>
);

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
            toast.error("Failed to load queue");
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
                <div className="space-y-5">
                    {/* ── HEADER ────────────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-md shadow-orange-200 shrink-0">
                                    <ClipboardList size={17} className="text-white" />
                                </div>
                                <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Vendor Onboarding Queue</h1>
                                <span className="hidden md:inline text-[9px] font-extrabold px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-200 uppercase tracking-widest">
                                    Activation Review
                                </span>
                            </div>
                            <div className="flex items-center gap-2 ml-12">
                                <div className="h-0.5 w-8 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" />
                                <p className="text-xs text-slate-500 font-medium leading-snug">
                                    Review and approve new store applications awaiting activation.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => fetchPending(true)}
                                disabled={refreshing || loading}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:border-orange-200 hover:text-orange-600 transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50 shadow-sm"
                            >
                                <RefreshCw size={14} className={refreshing ? "animate-spin text-orange-500" : ""} />
                                {refreshing ? "Updating…" : "Refresh Queue"}
                            </button>
                            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800">
                                <Clock size={14} className="text-orange-400" />
                                <span className="text-xs font-extrabold uppercase tracking-widest">{vendors.length} Pending Review</span>
                            </div>
                        </div>
                    </div>

                    {/* ── STAT TILES ────────────────────────────────────────── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: "New Applications", val: vendors.length, icon: FileText, bg: "bg-blue-100", text: "text-blue-600" },
                            { label: "Oldest Request", val: vendors.length ? getTimeAgo(vendors[0].createdAt) : "None", icon: Clock, bg: "bg-amber-100", text: "text-amber-600" },
                            { label: "Geographical Review", val: vendors.filter(v => v.locationStatus === 'pending_review').length, icon: MapPin, bg: "bg-rose-100", text: "text-rose-600" },
                            { label: "Status Level", val: "Critical", icon: AlertCircle, bg: "bg-emerald-100", text: "text-emerald-600" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:border-orange-200 hover:shadow-sm transition-all group">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.text} bg-opacity-30 group-hover:bg-opacity-50 transition-colors`}>
                                    <stat.icon size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1 truncate">{stat.label}</p>
                                    <p className="text-lg font-extrabold text-slate-900 leading-none">{stat.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── TABLE AREA ────────────────────────────────────────── */}
                    <TableCard>
                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    <Th>Store / Brand</Th>
                                    <Th>Vendor Profile</Th>
                                    <Th center>Submitted</Th>
                                    <Th right>Verification Status</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    /* Skeleton rows */
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-md w-3/4" /></td>
                                            <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-md w-1/2" /></td>
                                            <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-md w-24 mx-auto" /></td>
                                            <td className="px-4 py-3 flex justify-end"><div className="h-6 w-24 bg-slate-100 rounded-md" /></td>
                                        </tr>
                                    ))
                                ) : vendors.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-24 text-center">
                                            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle2 size={32} className="text-emerald-400" />
                                            </div>
                                            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide mb-1">Queue Clear</h3>
                                            <p className="text-xs text-slate-500 font-medium">No store applications are currently awaiting review.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    vendors.map((vendor) => (
                                        <tr 
                                            key={vendor._id} 
                                            onClick={() => router.push(`/admin/vendors/pending/${vendor._id}`)}
                                            className="group hover:bg-orange-50/40 cursor-pointer transition-colors"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 bg-slate-100 rounded-xl border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden group-hover:border-orange-300 transition-colors">
                                                        {vendor.logo ? <img src={vendor.logo} alt="" className="w-full h-full object-cover" /> : <Store size={18} className="text-slate-300" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-extrabold text-sm text-slate-900 leading-tight group-hover:text-orange-600 transition-colors truncate">{vendor.storeName || "Unnamed Store"}</p>
                                                        <div className="flex items-center gap-1.5 mt-1 text-slate-400 truncate">
                                                            <MapPin size={10} className="text-orange-400" />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">{vendor.address?.city || vendor.requestedCity || "Location TBD"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100 text-orange-400 group-hover:bg-orange-100 group-hover:text-orange-500 transition-colors">
                                                        <User size={14} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-extrabold text-slate-700 leading-none truncate">{vendor.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium mt-1.5 truncate">{vendor.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-sm font-bold text-slate-700 leading-none">{formatDate(vendor.createdAt)}</span>
                                                    <span className="text-[9px] font-extrabold text-slate-400 mt-1 uppercase tracking-widest">{getTimeAgo(vendor.createdAt)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    {vendor.locationStatus === "pending_review" ? (
                                                        <Badge variant="warning">Review Geo-Location</Badge>
                                                    ) : (
                                                        <Badge variant="success">Geo Verified</Badge>
                                                    )}
                                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md shadow-orange-200 -translate-x-2 group-hover:translate-x-0">
                                                        <ChevronRight size={14} className="stroke-[3px]" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </TableCard>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
