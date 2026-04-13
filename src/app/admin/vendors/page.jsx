"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Store,
    Search,
    Edit2,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    X,
    Loader2,
    ShieldCheck,
    TrendingUp,
    Utensils,
    Truck,
    Wallet,
    Percent,
    Ban,
    RefreshCcw,
    Eye,
    ChevronDown,
    XCircle,
    Building2,
    Clock
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";

const Badge = ({ children, variant = "default" }) => {
    const variants = {
        default: "bg-slate-50 text-slate-600 border-slate-200",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        danger: "bg-rose-50 text-rose-700 border-rose-200",
        info: "bg-blue-50 text-blue-700 border-blue-200",
        inactive: "bg-slate-50 text-slate-400 border-slate-200"
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold border uppercase tracking-widest ${variants[variant] || variants.default}`}>
            {children}
        </span>
    );
};

// ─── Table Shell ───────────────────────────────────────────────────────────────
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

export default function AdminVendorsPage() {
    const router = useRouter();

    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [systemMetrics, setSystemMetrics] = useState(null);
    const [filter, setFilter] = useState({
        verified: "",
        suspended: "",
        active: ""
    });

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("create"); 
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Action Modal State
    const [actionMenu, setActionMenu] = useState({ show: false, vendor: null });

    // Custom Confirm/Prompt Modal State
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: "",
        message: "",
        type: "confirm",
        confirmText: "Confirm",
        cancelText: "Cancel",
        onConfirm: null,
        inputValue: "",
        placeholder: "",
        isLoading: false
    });

    // Form State for Edit
    const [formData, setFormData] = useState({
        storeName: "",
        email: "",
        phone: "",
        deliveryManagedBy: "vendor"
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Performance & Commission State
    const [metrics, setMetrics] = useState(null);
    const [commissionRate, setCommissionRate] = useState(0.1);

    const fetchVendors = useCallback(async () => {
        setLoading(true);
        try {
            const cleanFilter = Object.entries(filter).reduce((acc, [key, value]) => {
                if (value !== "") acc[key] = value;
                return acc;
            }, {});

            const data = await adminApi.getAllVendors({ ...cleanFilter, search });
            setVendors(data.vendors || []);
        } catch (error) {
            console.error("Failed to fetch vendors:", error);
            toast.error("Could not load vendors");
        } finally {
            setLoading(false);
        }
    }, [filter, search]);

    useEffect(() => {
        const fetchSystemMetrics = async () => {
            try {
                const res = await adminApi.getVendorMetrics();
                if (res.success) setSystemMetrics(res.data);
            } catch (err) {
                console.error("Failed to load metrics:", err);
            }
        };
        fetchSystemMetrics();
    }, []);

    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    const handleOpenModal = (mode, vendor = null) => {
        setModalMode(mode);
        setSelectedVendor(vendor);
        if (mode === "edit" && vendor) {
            setFormData({
                storeName: vendor.storeName || "",
                email: vendor.email || "",
                phone: vendor.phone || "",
                deliveryManagedBy: vendor.deliveryManagedBy || "vendor"
            });
        }
        setShowModal(true);
    };

    const handleApprove = async (vendorId) => {
        setConfirmModal({
            show: true,
            title: "Approve Vendor",
            message: "Verify this partner for active operations on the platform?",
            type: "confirm",
            confirmText: "Approve Vendor",
            onConfirm: async () => {
                try {
                    setConfirmModal(prev => ({ ...prev, isLoading: true }));
                    await adminApi.approveVendor(vendorId);
                    toast.success("Vendor approved");
                    fetchVendors();
                    setConfirmModal({ show: false });
                } catch (error) {
                    toast.error(error.message);
                } finally {
                    setConfirmModal(prev => ({ ...prev, isLoading: false }));
                }
            }
        });
    };

    const handleReject = async (vendorId) => {
        setConfirmModal({
            show: true,
            title: "Reject Store Application",
            message: "Provide a reason for rejection. This will be sent to the applicant.",
            type: "prompt",
            confirmText: "Reject Application",
            placeholder: "Reason (e.g. Missing documentation)",
            inputValue: "",
            onConfirm: async (reason) => {
                if (!reason?.trim()) {
                    toast.error("Reason is required");
                    return;
                }
                try {
                    setConfirmModal(prev => ({ ...prev, isLoading: true }));
                    await adminApi.rejectVendor(vendorId, reason);
                    toast.success("Application rejected");
                    fetchVendors();
                    setConfirmModal({ show: false });
                } catch (error) {
                    toast.error(error.message);
                } finally {
                    setConfirmModal(prev => ({ ...prev, isLoading: false }));
                }
            }
        });
    };

    const handleSuspend = async (vendorId) => {
        setConfirmModal({
            show: true,
            title: "Suspend Partner Access",
            message: "State the violation or reason for suspension. Store will be hidden from users.",
            type: "prompt",
            confirmText: "Suspend Account",
            placeholder: "Reason (e.g. Policy violation)",
            inputValue: "",
            onConfirm: async (reason) => {
                if (!reason?.trim()) {
                    toast.error("Reason is required");
                    return;
                }
                try {
                    setConfirmModal(prev => ({ ...prev, isLoading: true }));
                    await adminApi.suspendVendor(vendorId, reason);
                    toast.success("Vendor suspended");
                    fetchVendors();
                    setConfirmModal({ show: false });
                } catch (error) {
                    toast.error(error.message);
                } finally {
                    setConfirmModal(prev => ({ ...prev, isLoading: false }));
                }
            }
        });
    };

    const handleReactivate = async (vendorId) => {
        setConfirmModal({
            show: true,
            title: "Restore Partner Access",
            message: "Restore full operational status for this vendor?",
            type: "confirm",
            confirmText: "Reactivate Store",
            onConfirm: async () => {
                try {
                    setConfirmModal(prev => ({ ...prev, isLoading: true }));
                    await adminApi.reactivateVendor(vendorId);
                    toast.success("Vendor reactivated");
                    fetchVendors();
                    setConfirmModal({ show: false });
                } catch (error) {
                    toast.error(error.message);
                } finally {
                    setConfirmModal(prev => ({ ...prev, isLoading: false }));
                }
            }
        });
    };

    const handleUpdateCommission = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await adminApi.updateCommission(commissionRate);
            toast.success("Commission rate updated globally");
            setShowModal(false);
            fetchVendors();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (modalMode === "edit") {
                await adminApi.updateVendorDeliveryMode(selectedVendor._id, formData.deliveryManagedBy);
                toast.success("Settings updated");
            }
            fetchVendors();
            setShowModal(false);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const viewPerformance = async (vendor) => {
        setSelectedVendor(vendor);
        setModalMode("performance");
        setShowModal(true);
        try {
            const data = await adminApi.getVendorPerformance(vendor._id);
            setMetrics(data.metrics);
        } catch (error) {
            toast.error("Failed to load metrics");
        }
    };

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-5">
                    {/* ── HEADER ────────────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-md shadow-orange-200 shrink-0">
                                    <Building2 size={17} className="text-white" />
                                </div>
                                <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                                    Vendor Directory
                                </h1>
                                <span className="hidden md:inline text-[9px] font-extrabold px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-200 uppercase tracking-widest">
                                    {vendors.length} Partners
                                </span>
                            </div>
                            <div className="flex items-center gap-2 ml-12">
                                <div className="h-0.5 w-8 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" />
                                <p className="text-xs text-slate-500 font-medium leading-snug">
                                    Manage partner accounts, commission rates, and logistics modes.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={fetchVendors}
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:border-orange-200 hover:text-orange-600 transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50 shadow-sm"
                            >
                                <RefreshCcw size={14} className={loading ? "animate-spin text-orange-500" : ""} />
                                Update Registry
                            </button>
                            <button
                                onClick={() => {
                                    setModalMode("commission");
                                    setShowModal(true);
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-400 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl hover:from-orange-600 hover:to-amber-500 transition-all shadow-md shadow-orange-200"
                            >
                                <Percent size={14} />
                                Global Commission
                            </button>
                        </div>
                    </div>

                    {/* ── SYSTEM METRICS TRENDS ────────────────────────────── */}
                    {systemMetrics && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <Wallet size={15} className="text-emerald-500" /> Platform Sales Velocity
                                    </h3>
                                    <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                                        Last 7 Days
                                    </span>
                                </div>
                                <div className="p-4 h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={systemMetrics.sales.trend7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} tickFormatter={(val) => `₦${(val/1000)}k`} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} labelStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }} />
                                            <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <Building2 size={15} className="text-blue-500" /> Vendor Onboarding Trend
                                    </h3>
                                    <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-blue-100">
                                        Last 7 Days
                                    </span>
                                </div>
                                <div className="p-4 h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={systemMetrics.registrations.trend7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorVendors" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} allowDecimals={false} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} labelStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }} />
                                            <Area type="monotone" dataKey="count" name="New Stores" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVendors)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STAT TILES ────────────────────────────────────────── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: "Active Stores", val: vendors.filter(v => v.active && !v.suspended).length, icon: CheckCircle2, bg: "bg-emerald-100", text: "text-emerald-600" },
                            { label: "Pending Review", val: vendors.filter(v => !v.verified).length, icon: Clock, bg: "bg-orange-100", text: "text-orange-600" },
                            { label: "Suspended", val: vendors.filter(v => v.suspended).length, icon: Ban, bg: "bg-rose-100", text: "text-rose-600" },
                            { label: "Avg Commission", val: vendors.length ? `${(vendors.reduce((acc, v) => acc + (v.commissionRate || 0), 0) / vendors.length * 100).toFixed(1)}%` : "0%", icon: Percent, bg: "bg-blue-100", text: "text-blue-600" },
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

                    {/* ── TOOLBAR (Search & Filters) ───────────────────────── */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col lg:flex-row gap-3 shadow-sm">
                        <div className="flex-1 relative group w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Search by Store, UID, or Email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all text-slate-800"
                            />
                        </div>
                        <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                            <div className="relative flex-1 md:flex-none">
                                <select
                                    value={filter.active}
                                    onChange={(e) => setFilter({ ...filter, active: e.target.value })}
                                    className="w-full h-10 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-extrabold uppercase tracking-wider outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 appearance-none cursor-pointer text-slate-600 min-w-[140px]"
                                >
                                    <option value="">Status: All</option>
                                    <option value="true">Active Only</option>
                                    <option value="false">Inactive Only</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            <div className="relative flex-1 md:flex-none">
                                <select
                                    value={filter.verified}
                                    onChange={(e) => setFilter({ ...filter, verified: e.target.value })}
                                    className="w-full h-10 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-extrabold uppercase tracking-wider outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 appearance-none cursor-pointer text-slate-600 min-w-[140px]"
                                >
                                    <option value="">Verification: All</option>
                                    <option value="true">Verified Only</option>
                                    <option value="false">Unverified Only</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            
                            <AnimatePresence>
                                {(search || filter.verified || filter.active) && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onClick={() => {
                                            setSearch("");
                                            setFilter({ verified: "", suspended: "", active: "" });
                                        }}
                                        className="h-10 px-4 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-extrabold tracking-widest text-[10px] uppercase transition-colors border border-rose-200 flex items-center gap-1.5"
                                    >
                                        <X size={14} /> Clear Filter
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* ── TABLE AREA ────────────────────────────────────────── */}
                    <TableCard>
                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    <Th>Store Identifier</Th>
                                    <Th>Logistics</Th>
                                    <Th>Commission</Th>
                                    <Th>Operational Status</Th>
                                    <Th right>Actions</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    /* Skeleton rows */
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-md w-3/4" /></td>
                                            <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-md w-1/2" /></td>
                                            <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-md w-12" /></td>
                                            <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-md w-24" /></td>
                                            <td className="px-4 py-3 flex justify-end"><div className="h-6 w-16 bg-slate-100 rounded-md" /></td>
                                        </tr>
                                    ))
                                ) : vendors.length > 0 ? (
                                    vendors.map((vendor) => (
                                        <tr key={vendor._id} className="hover:bg-orange-50/40 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 bg-slate-100 rounded-xl border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden group-hover:border-orange-300 transition-colors">
                                                        {vendor.logo ? <img src={vendor.logo} alt="" className="w-full h-full object-cover" /> : <Store size={18} className="text-slate-300 group-hover:text-orange-400" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-extrabold text-sm text-slate-900 leading-tight truncate group-hover:text-orange-600 transition-colors">{vendor.storeName}</p>
                                                            {vendor.verified && <ShieldCheck size={14} className="text-emerald-500 shrink-0" />}
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">{vendor.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-sm">
                                                    {vendor.deliveryManagedBy === "admin" ? (
                                                        <>
                                                            <Truck size={12} className="text-indigo-500" />
                                                            <span className="text-[9px] font-extrabold text-slate-600 uppercase tracking-widest">Platform Map</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Utensils size={12} className="text-emerald-500" />
                                                            <span className="text-[9px] font-extrabold text-slate-600 uppercase tracking-widest">Self Delivery</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 text-xs font-extrabold text-slate-900 border border-slate-200">
                                                    <Percent size={10} className="text-slate-400" />
                                                    {(vendor.commissionRate * 100).toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1.5 items-start">
                                                    {vendor.suspended ? (
                                                        <Badge variant="danger">Suspended</Badge>
                                                    ) : vendor.active ? (
                                                        <Badge variant="success">Active Online</Badge>
                                                    ) : (
                                                        <Badge variant="inactive">Inactive / Offline</Badge>
                                                    )}
                                                    {vendor.verified && !vendor.isApproved && (
                                                        <span className="text-[9px] font-bold text-amber-500 uppercase flex items-center gap-1 px-1 tracking-wider">
                                                            <AlertCircle size={10} /> Pending Approval
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => router.push(`/admin/vendors/${vendor._id}`)}
                                                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                                        title="Review Case"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setActionMenu({ show: true, vendor })}
                                                        className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                                                    >
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-24 text-center">
                                            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <XCircle size={32} className="text-slate-300" />
                                            </div>
                                            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide mb-1">No Vendors Found</h3>
                                            <p className="text-xs text-slate-500 font-medium tracking-tight">Try adjusting your search criteria or clearing filters.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </TableCard>
                </div>

                {/* ── SETTINGS / CONFIG MODAL ────────────────────────────── */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl"
                            >
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-sm shadow-orange-200 shrink-0">
                                            {modalMode === "performance" ? <TrendingUp size={16} /> : 
                                             modalMode === "commission" ? <Percent size={16} /> : <Edit2 size={16} />}
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                                                {modalMode === "performance" ? "Performance Metrics" : 
                                                 modalMode === "commission" ? "Global Commission Rate" : "Vendor Configuration"}
                                            </h2>
                                            <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5 tracking-wider">
                                                {selectedVendor?.storeName || "Core Platform Settings"}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="p-5">
                                    {modalMode === "performance" && (
                                        <div className="space-y-5">
                                            {metrics ? (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                        <Wallet className="text-blue-500 mb-2.5" size={20} />
                                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Revenue</p>
                                                        <p className="text-xl font-extrabold text-slate-900 leading-none">₦{metrics.totalSales?.toLocaleString()}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                        <Truck className="text-amber-500 mb-2.5" size={20} />
                                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
                                                        <p className="text-xl font-extrabold text-slate-900 leading-none">{metrics.totalOrders}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                        <CheckCircle2 className="text-emerald-500 mb-2.5" size={20} />
                                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Store Rating</p>
                                                        <p className="text-xl font-extrabold text-slate-900 leading-none">{metrics.rating || 0} / 5</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                        <Utensils className="text-rose-500 mb-2.5" size={20} />
                                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Menu Size</p>
                                                        <p className="text-xl font-extrabold text-slate-900 leading-none">{metrics.foodCount} Items</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="py-12 flex flex-col items-center gap-2">
                                                    <Loader2 className="animate-spin text-orange-500" size={24} />
                                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Updating data…</p>
                                                </div>
                                            )}
                                            <button onClick={() => setShowModal(false)} className="w-full py-3 bg-white border border-slate-200 text-slate-700 text-xs font-extrabold uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors">Close Hub</button>
                                        </div>
                                    )}

                                    {modalMode === "commission" && (
                                        <form onSubmit={handleUpdateCommission} className="space-y-5">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Platform-Wide Rate <span className="text-slate-300">(e.g. 0.1 for 10%)</span></label>
                                                <input
                                                    type="number" step="0.01" min="0" max="1"
                                                    required
                                                    value={commissionRate}
                                                    onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                                                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 text-slate-800 transition-all font-mono"
                                                    placeholder="0.10"
                                                />
                                            </div>
                                            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-xl font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:from-orange-600 hover:to-amber-500 transition-colors shadow-md shadow-orange-200 disabled:opacity-50">
                                                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                                                Synchronize All Vendors
                                            </button>
                                        </form>
                                    )}

                                    {modalMode === "edit" && (
                                        <form onSubmit={handleFormSubmit} className="space-y-5">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Delivery Fulfillment Mode</label>
                                                <div className="relative">
                                                    <select
                                                        name="deliveryManagedBy"
                                                        value={formData.deliveryManagedBy}
                                                        onChange={handleChange}
                                                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold appearance-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 cursor-pointer pr-9 text-slate-700 transition-all"
                                                    >
                                                        <option value="vendor">Store Managed Logistics</option>
                                                        <option value="admin">Platform Managed Logistics</option>
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-400 text-white rounded-xl font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:from-orange-600 hover:to-amber-500 transition-colors shadow-md shadow-orange-200 disabled:opacity-50">
                                                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                                Apply Configuration
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── QUICK ACTIONS DRAWER ────────────────────────────────── */}
                <AnimatePresence>
                    {actionMenu.show && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setActionMenu({ show: false, vendor: null })}
                                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
                                className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl"
                            >
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                    <div className="min-w-0 pr-4">
                                        <h3 className="text-sm font-extrabold text-slate-900 truncate uppercase mt-0.5">{actionMenu.vendor?.storeName}</h3>
                                        <p className="text-[10px] font-bold text-orange-500 tracking-wider">Operational Menu</p>
                                    </div>
                                    <button onClick={() => setActionMenu({ show: false, vendor: null })} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200 bg-white">
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="p-3 grid grid-cols-1 gap-1.5">
                                    <button onClick={() => { viewPerformance(actionMenu.vendor); setActionMenu({ show: false, vendor: null }); }}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 text-slate-700 transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-100 border border-blue-100"><TrendingUp size={14} /></div>
                                        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Metrics Overview</span>
                                    </button>
                                    <button onClick={() => { handleOpenModal("edit", actionMenu.vendor); setActionMenu({ show: false, vendor: null }); }}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 text-slate-700 transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center group-hover:bg-orange-100 border border-orange-100"><Edit2 size={14} /></div>
                                        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Config Settings</span>
                                    </button>
                                    
                                    <div className="h-px bg-slate-100 my-2 mx-3" />
                                    
                                    {!actionMenu.vendor?.verified ? (
                                        <div className="grid grid-cols-2 gap-2 p-1">
                                            <button onClick={() => { handleApprove(actionMenu.vendor._id); setActionMenu({ show: false, vendor: null }); }}
                                                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm">
                                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm"><CheckCircle2 size={16} /></div>
                                                <span className="text-[10px] font-extrabold uppercase tracking-widest">Approve</span>
                                            </button>
                                            <button onClick={() => { handleReject(actionMenu.vendor._id); setActionMenu({ show: false, vendor: null }); }}
                                                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all border border-rose-100 shadow-sm">
                                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm"><XCircle size={16} /></div>
                                                <span className="text-[10px] font-extrabold uppercase tracking-widest">Reject</span>
                                            </button>
                                        </div>
                                    ) : actionMenu.vendor?.suspended ? (
                                        <button onClick={() => { handleReactivate(actionMenu.vendor._id); setActionMenu({ show: false, vendor: null }); }}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all border border-emerald-100 mx-1">
                                            <div className="w-8 h-8 rounded-lg bg-white text-emerald-600 flex items-center justify-center shadow-sm"><RefreshCcw size={16} /></div>
                                            <span className="text-xs font-extrabold uppercase tracking-widest">Restore Operations</span>
                                        </button>
                                    ) : (
                                        <button onClick={() => { handleSuspend(actionMenu.vendor._id); setActionMenu({ show: false, vendor: null }); }}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all border border-rose-100 mx-1">
                                            <div className="w-8 h-8 rounded-lg bg-white text-rose-600 flex items-center justify-center shadow-sm"><Ban size={16} /></div>
                                            <span className="text-xs font-extrabold uppercase tracking-widest">Restrict Access</span>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── COMPACT CONFIRM MODAL ───────────────────────────────── */}
                <AnimatePresence>
                    {confirmModal.show && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => !confirmModal.isLoading && setConfirmModal({ show: false })}
                                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
                                className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl"
                            >
                                <div className="p-6 text-center">
                                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
                                        <AlertCircle className="text-amber-500" size={24} />
                                    </div>
                                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest mb-1.5">{confirmModal.title}</h3>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 px-2">{confirmModal.message}</p>

                                    {confirmModal.type === "prompt" && (
                                        <div className="mb-6">
                                            <textarea
                                                autoFocus
                                                value={confirmModal.inputValue}
                                                onChange={(e) => setConfirmModal(prev => ({ ...prev, inputValue: e.target.value }))}
                                                placeholder={confirmModal.placeholder}
                                                className="w-full min-h-[100px] p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all resize-none text-xs"
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button disabled={confirmModal.isLoading} onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                                            className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors">
                                            {confirmModal.cancelText || "Cancel"}
                                        </button>
                                        <button disabled={confirmModal.isLoading} onClick={() => confirmModal.onConfirm(confirmModal.inputValue)}
                                            className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-md">
                                            {confirmModal.isLoading ? <Loader2 className="animate-spin" size={14} /> : confirmModal.confirmText}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
