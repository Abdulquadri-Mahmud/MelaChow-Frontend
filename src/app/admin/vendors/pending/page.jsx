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
    CheckCircle2, Calendar, ChevronRight, User, Phone, Mail, ArrowRight, XCircle
} from "lucide-react";

const formatDate = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    return isNaN(date.getTime())
        ? "—"
        : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

function LocationBadge({ status }) {
    if (status === "approved") return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm">
            <CheckCircle2 size={12} /> Confirmed
        </span>
    );
    if (status === "pending_review") return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20 shadow-sm">
            <AlertCircle size={12} /> Review Needed
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-500/10 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-500/20 shadow-sm">
            <XCircle size={12} /> Unknown
        </span>
    );
}

export default function PendingVendorsPage() {
    const router = useRouter();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPending = async () => {
            try {
                setLoading(true);
                const data = await adminApi.getAllVendors({ isApproved: "false" });
                console.log(data);
                const sorted = (data.vendors || []).sort(
                    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                );
                setVendors(sorted);
            } catch (err) {
                toast.error("Failed to load queue: " + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPending();
    }, []);

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-[40px] p-10 md:p-12 border border-gray-800 shadow-2xl"
                    >
                        {/* Abstract shapes for background */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                                    <Clock className="text-orange-400" size={16} />
                                    <span className="text-xs font-black uppercase tracking-widest text-orange-400">Action Required</span>
                                </div>
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">Pending Vendors</h1>
                                    <p className="text-gray-400 font-medium text-lg max-w-xl leading-relaxed">
                                        You have applications waiting to be reviewed. Applications are sorted oldest first to ensure fair processing times.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center p-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl shrink-0 min-w-[200px]">
                                <span className="text-6xl font-black text-white leading-none mb-2">{vendors.length}</span>
                                <span className="text-xs font-black uppercase tracking-widest text-gray-400">In Queue</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Content Section */}
                    <div>
                        {loading ? (
                            <div className="py-32 flex flex-col items-center justify-center space-y-6">
                                <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center">
                                    <Loader2 size={40} className="animate-spin text-orange-500" />
                                </div>
                                <p className="font-black text-[11px] uppercase tracking-widest text-gray-400">Syncing Applications...</p>
                            </div>
                        ) : vendors.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-24 flex flex-col items-center justify-center text-center bg-white border border-gray-100 rounded-[40px] shadow-sm"
                            >
                                <div className="w-32 h-32 bg-emerald-50 rounded-[40px] flex items-center justify-center mb-8 rotate-3 transition-transform hover:rotate-0">
                                    <CheckCircle2 size={64} className="text-emerald-500 drop-shadow-sm" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">You're all caught up!</h3>
                                <p className="text-gray-500 font-medium max-w-sm leading-relaxed text-lg">
                                    There are no pending vendor applications waiting in your queue right now.
                                </p>
                            </motion.div>
                        ) : (
                            <div className="space-y-4">
                                {/* Table headers */}
                                <div className="hidden md:grid grid-cols-12 gap-6 px-8 py-4 bg-white/50 border border-gray-100 rounded-3xl items-center backdrop-blur-sm">
                                    <div className="col-span-3 text-[10px] font-black uppercase text-gray-400 tracking-widest pl-2">Store Details</div>
                                    <div className="col-span-3 text-[10px] font-black uppercase text-gray-400 tracking-widest">Applicant Info</div>
                                    <div className="col-span-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">Registration</div>
                                    <div className="col-span-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">Location Status</div>
                                    <div className="col-span-2 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right pr-2">Action</div>
                                </div>

                                {/* List rows */}
                                <AnimatePresence>
                                    {vendors.map((vendor, idx) => (
                                        <motion.div
                                            key={vendor._id}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05, duration: 0.4, ease: "easeOut" }}
                                            className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 md:p-5 bg-white hover:bg-orange-50/20 border border-gray-100 hover:border-orange-200 rounded-[28px] items-center transition-all duration-300 shadow-sm hover:shadow-md group cursor-pointer"
                                            onClick={() => router.push(`/admin/vendors/pending/${vendor._id}`)}
                                        >
                                            {/* Store Logo & Name */}
                                            <div className="col-span-1 md:col-span-3 flex items-center gap-4">
                                                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-50 rounded-[20px] flex items-center justify-center text-gray-300 overflow-hidden shrink-0 border-2 border-white shadow-sm group-hover:border-orange-100 group-hover:shadow-orange-100/50 transition-all duration-300">
                                                    {vendor.logo
                                                        ? <img src={vendor.logo} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        : <Store size={24} />
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-black text-gray-900 text-lg md:text-xl truncate group-hover:text-orange-600 transition-colors">
                                                        {vendor.storeName || <span className="text-gray-400 italic">Unnamed Store</span>}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <MapPin size={12} className="text-gray-400" />
                                                        <span className="text-xs font-bold text-gray-500 truncate">
                                                            {vendor.address?.city || vendor.requestedCity || "No city provided"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Owner Details */}
                                            <div className="col-span-1 md:col-span-3">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <User size={14} className="text-gray-400" />
                                                        <span className="text-sm font-bold text-gray-700 truncate">{vendor.name || "—"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5">
                                                        <Mail size={14} className="text-gray-400" />
                                                        <span className="text-xs font-semibold text-gray-500 truncate">{vendor.email || "—"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5">
                                                        <Phone size={14} className="text-gray-400" />
                                                        <span className="text-xs font-semibold text-gray-500">{vendor.phone || "—"}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Date */}
                                            <div className="col-span-1 md:col-span-2">
                                                <div className="inline-flex items-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <Calendar size={12} className="text-gray-400 shrink-0" />
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest leading-none">Submitted</span>
                                                        <span className="text-xs font-bold text-gray-700 leading-none">
                                                            {formatDate(vendor.createdAt || vendor.updatedAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Location Status */}
                                            <div className="col-span-1 md:col-span-2">
                                                <LocationBadge status={vendor.locationStatus} />
                                            </div>

                                            {/* Action Button */}
                                            <div className="col-span-1 md:col-span-2 flex justify-start md:justify-end">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/admin/vendors/pending/${vendor._id}`);
                                                    }}
                                                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 md:px-6 md:py-3.5 bg-gray-900 group-hover:bg-orange-500 text-white rounded-[20px] text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-md group-hover:shadow-orange-500/30 active:scale-95"
                                                >
                                                    Review
                                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
