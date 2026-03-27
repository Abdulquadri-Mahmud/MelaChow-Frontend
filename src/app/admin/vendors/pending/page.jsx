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

const Badge = ({ children, variant = "default" }) => {
    const variants = {
        default: "bg-slate-100 text-slate-600 border-slate-200",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        danger: "bg-rose-50 text-rose-700 border-rose-200",
        info: "bg-blue-50 text-blue-700 border-blue-200",
        dark: "bg-slate-900 text-white border-slate-800"
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${variants[variant]}`}>
            {children}
        </span>
    );
};

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
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Vendor Onboarding Queue</h1>
                            <p className="text-sm text-slate-500 mt-0.5">Review and approve new store applications awaiting activation.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchPending(true)}
                                disabled={refreshing || loading}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                <RefreshCw size={14} className={refreshing ? "animate-spin text-slate-400" : ""} />
                                {refreshing ? "Updating..." : "Refresh Queue"}
                            </button>
                            <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg pr-4">
                                <Clock size={14} className="text-slate-400" />
                                <span>{vendors.length} Pending Review</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Tiles */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: "New Applications", val: vendors.length, icon: FileText, color: "blue" },
                            { label: "Oldest Request", val: vendors.length ? getTimeAgo(vendors[0].createdAt) : "None", icon: Clock, color: "orange" },
                            { label: "Geographical Review", val: vendors.filter(v => v.locationStatus === 'pending_review').length, icon: MapPin, color: "rose" },
                            { label: "Status Level", val: "Critical", icon: AlertCircle, color: "emerald" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3">
                                <div className={`w-9 h-9 rounded flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600 border border-${stat.color}-100`}>
                                    <stat.icon size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{stat.label}</p>
                                    <p className="text-base font-bold text-slate-900 leading-none">{stat.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Table Area */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Store / Brand</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Vendor Profile</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider text-center">Submitted</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider text-right">Verification Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="4" className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="animate-spin text-slate-400" size={24} />
                                                    <p className="text-xs text-slate-400 font-medium">Syncing applications...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : vendors.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="py-24 text-center">
                                                <div className="flex flex-col items-center opacity-30 grayscale mb-4">
                                                    <CheckCircle2 size={48} className="text-slate-300" />
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-900 leading-none mb-1">Queue Clear</h3>
                                                <p className="text-xs text-slate-500 font-medium tracking-tight">No store applications are currently awaiting review.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        vendors.map((vendor) => (
                                            <tr 
                                                key={vendor._id} 
                                                onClick={() => router.push(`/admin/vendors/pending/${vendor._id}`)}
                                                className="group hover:bg-slate-50/50 cursor-pointer transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-100 rounded border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                            {vendor.logo ? <img src={vendor.logo} alt="" className="w-full h-full object-cover" /> : <Store size={18} className="text-slate-300" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-sm text-slate-900 leading-tight group-hover:text-blue-600 transition-colors truncate">{vendor.storeName || "Unnamed Store"}</p>
                                                            <div className="flex items-center gap-1.5 mt-0.5 text-slate-400 truncate">
                                                                <MapPin size={10} />
                                                                <span className="text-[11px] font-medium">{vendor.address?.city || vendor.requestedCity || "Location TBD"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 group-hover:bg-slate-200 transition-colors">
                                                            <User size={14} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-700 leading-none truncate">{vendor.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">{vendor.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className="text-xs font-bold text-slate-700 leading-none">{formatDate(vendor.createdAt)}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">({getTimeAgo(vendor.createdAt)})</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {vendor.locationStatus === "pending_review" ? (
                                                            <Badge variant="warning">Review Geo-Location</Badge>
                                                        ) : (
                                                            <Badge variant="success">Geo Verified</Badge>
                                                        )}
                                                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                                            <ChevronRight size={14} />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
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
