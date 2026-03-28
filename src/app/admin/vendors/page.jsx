"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import {
    Store,
    Search,
    Plus,
    Edit2,
    Trash2,
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
    ExternalLink,
    MapPin,
    ChevronRight,
    Clock,
    XCircle,
    ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";

const Badge = ({ children, variant = "default" }) => {
    const variants = {
        default: "bg-slate-100 text-slate-600 border-slate-200",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        danger: "bg-rose-50 text-rose-700 border-rose-200",
        info: "bg-blue-50 text-blue-700 border-blue-200",
        inactive: "bg-slate-50 text-slate-400 border-slate-100"
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${variants[variant] || variants.default}`}>
            {children}
        </span>
    );
};

export default function AdminVendorsPage() {
    const router = useRouter();

    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState({
        verified: "",
        suspended: "",
        active: ""
    });

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // "create", "edit", "performance", "commission"
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Action Modal State
    const [actionMenu, setActionMenu] = useState({
        show: false,
        vendor: null
    });

    // Custom Confirm/Prompt Modal State
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: "",
        message: "",
        type: "confirm", // 'confirm', 'prompt'
        confirmText: "Confirm",
        cancelText: "Cancel",
        onConfirm: null,
        inputValue: "",
        placeholder: "",
        isLoading: false
    });

    // Form State for Create/Edit
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

    // Performance & Foods State
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
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                                Vendor Directory
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 italic tracking-widest uppercase">{vendors.length} Partners</span>
                            </h1>
                            <div className="h-0.5 w-6 bg-orange-500 rounded-full mt-1" />
                            <p className="text-sm text-slate-500 mt-1.5 font-medium">Manage partner accounts, commission rates, and logistics modes.</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchVendors}
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                <RefreshCcw size={15} className={loading ? "animate-spin text-slate-400" : ""} />
                                Update Registry
                            </button>
                            <button
                                onClick={() => {
                                    setModalMode("commission");
                                    setShowModal(true);
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-700 transition-colors shadow-sm shadow-orange-500/20"
                            >
                                <Percent size={14} />
                                Global Commission
                            </button>
                        </div>
                    </div>

                    {/* Stats Tiles */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: "Active Stores", val: vendors.filter(v => v.active && !v.suspended).length, icon: CheckCircle2, color: "emerald" },
                            { label: "Pending Review", val: vendors.filter(v => !v.verified).length, icon: Clock, color: "orange" },
                            { label: "Suspended", val: vendors.filter(v => v.suspended).length, icon: Ban, color: "rose" },
                            { label: "Avg Commission", val: vendors.length ? `${(vendors.reduce((acc, v) => acc + (v.commissionRate || 0), 0) / vendors.length * 100).toFixed(1)}%` : "0%", icon: Percent, color: "blue" },
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

                    {/* Toolbar */}
                    <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col lg:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input
                                type="text"
                                placeholder="Search by Store, UID, or Email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-md outline-none text-sm focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <select
                                    value={filter.active}
                                    onChange={(e) => setFilter({ ...filter, active: e.target.value })}
                                    className="h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-md text-xs font-bold uppercase tracking-tight outline-none focus:ring-1 focus:ring-slate-900 appearance-none min-w-[140px]"
                                >
                                    <option value="">Status: All</option>
                                    <option value="true">Active Only</option>
                                    <option value="false">Inactive Only</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select
                                    value={filter.verified}
                                    onChange={(e) => setFilter({ ...filter, verified: e.target.value })}
                                    className="h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-md text-xs font-bold uppercase tracking-tight outline-none focus:ring-1 focus:ring-slate-900 appearance-none min-w-[140px]"
                                >
                                    <option value="">Verification: All</option>
                                    <option value="true">Verified Only</option>
                                    <option value="false">Unverified Only</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            {(search || filter.verified || filter.active) && (
                                <button
                                    onClick={() => {
                                        setSearch("");
                                        setFilter({ verified: "", suspended: "", active: "" });
                                    }}
                                    className="h-9 px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md font-bold text-xs transition-colors border border-rose-100 flex items-center gap-1.5"
                                >
                                    <X size={14} /> Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Store Identifier</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Logistics</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Commission</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Operational Status</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="animate-spin text-slate-400" size={24} />
                                                    <p className="text-xs text-slate-400 font-medium">Syncing vendor registry...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : vendors.length > 0 ? (
                                        vendors.map((vendor) => (
                                            <tr key={vendor._id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-100 rounded border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden transition-all">
                                                            {vendor.logo ? <img src={vendor.logo} alt="" className="w-full h-full object-cover" /> : <Store size={18} className="text-slate-300" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="font-bold text-sm text-slate-900 leading-tight truncate">{vendor.storeName}</p>
                                                                {vendor.verified && <ShieldCheck size={14} className="text-emerald-500 shrink-0" />}
                                                            </div>
                                                            <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">{vendor.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-slate-50 border border-slate-100">
                                                        {vendor.deliveryManagedBy === "admin" ? (
                                                            <>
                                                                <Truck size={12} className="text-blue-500" />
                                                                <span className="text-[10px] font-bold text-slate-600 uppercase">Platform Managed</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Utensils size={12} className="text-emerald-500" />
                                                                <span className="text-[10px] font-bold text-slate-600 uppercase">Self Delivery</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-xs font-bold text-slate-900">{(vendor.commissionRate * 100).toFixed(1)}%</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-1">
                                                        {vendor.suspended ? (
                                                            <Badge variant="danger">Suspended</Badge>
                                                        ) : vendor.active ? (
                                                            <Badge variant="success">Active Online</Badge>
                                                        ) : (
                                                            <Badge variant="inactive">Inactive / Offline</Badge>
                                                        )}
                                                        {vendor.verified && !vendor.isApproved && (
                                                            <span className="text-[9px] font-bold text-amber-500 uppercase flex items-center gap-1 px-1">
                                                                <AlertCircle size={10} /> Pending Approval
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => router.push(`/admin/vendors/${vendor._id}`)}
                                                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                                                            title="Review Case"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setActionMenu({ show: true, vendor })}
                                                            className="p-1.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
                                                        >
                                                            <MoreVertical size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-20 text-center">
                                                <div className="flex flex-col items-center mb-2">
                                                    <XCircle size={40} className="text-slate-300" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-500 tracking-tight">No vendors found matching your filters</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Performance Modal */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                className="relative w-full max-w-md bg-white rounded-xl overflow-hidden border border-slate-200"
                            >
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                                            {modalMode === "performance" ? "Performance Metrics" : 
                                             modalMode === "commission" ? "Global Commission Rate" : "Vendor Configuration"}
                                        </h2>
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">
                                            {selectedVendor?.storeName || "Core Platform Settings"}
                                        </p>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="p-5">
                                    {modalMode === "performance" && (
                                        <div className="space-y-4">
                                            {metrics ? (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                        <Wallet className="text-blue-600 mb-2" size={18} />
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue</p>
                                                        <p className="text-lg font-bold text-slate-900">₦{metrics.totalSales?.toLocaleString()}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                        <Truck className="text-amber-600 mb-2" size={18} />
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Orders</p>
                                                        <p className="text-lg font-bold text-slate-900">{metrics.totalOrders}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                        <CheckCircle2 className="text-emerald-600 mb-2" size={18} />
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Store Rating</p>
                                                        <p className="text-lg font-bold text-slate-900">{metrics.rating || 0} / 5</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                        <Utensils className="text-rose-600 mb-2" size={18} />
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menu Size</p>
                                                        <p className="text-lg font-bold text-slate-900">{metrics.foodCount} Items</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="py-12 flex flex-col items-center gap-2">
                                                    <Loader2 className="animate-spin text-slate-400" size={24} />
                                                    <p className="text-xs text-slate-400 font-medium">Updating data...</p>
                                                </div>
                                            )}
                                            <button onClick={() => setShowModal(false)} className="w-full py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors mt-2">Close Performance Hub</button>
                                        </div>
                                    )}

                                    {modalMode === "commission" && (
                                        <form onSubmit={handleUpdateCommission} className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-slate-500 ml-1">Platform-Wide Rate (e.g. 0.1 for 10%)</label>
                                                <input
                                                    type="number" step="0.01" min="0" max="1"
                                                    required
                                                    value={commissionRate}
                                                    onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                                                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md outline-none text-sm font-medium focus:ring-1 focus:ring-slate-900"
                                                    placeholder="0.10"
                                                />
                                            </div>
                                            <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50">
                                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                                                Synchronize All Vendors
                                            </button>
                                        </form>
                                    )}

                                    {modalMode === "edit" && (
                                        <form onSubmit={handleFormSubmit} className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-slate-500 ml-1">Delivery Fulfillment Mode</label>
                                                <div className="relative">
                                                    <select
                                                        name="deliveryManagedBy"
                                                        value={formData.deliveryManagedBy}
                                                        onChange={handleChange}
                                                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md outline-none text-sm font-medium appearance-none focus:ring-1 focus:ring-slate-900 cursor-pointer pr-9"
                                                    >
                                                        <option value="vendor">Handled by Vendor</option>
                                                        <option value="admin">Managed by Platform</option>
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                            <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50">
                                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                                Apply Configuration
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Quick Actions Drawer */}
                <AnimatePresence>
                    {actionMenu.show && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setActionMenu({ show: false, vendor: null })}
                                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                className="relative w-full max-w-sm bg-white rounded-xl overflow-hidden border border-slate-200"
                            >
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-slate-900 truncate">{actionMenu.vendor?.storeName}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Quick Actions Hub</p>
                                    </div>
                                    <button onClick={() => setActionMenu({ show: false, vendor: null })} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="p-3 grid grid-cols-1 gap-1">
                                    <button onClick={() => { viewPerformance(actionMenu.vendor); setActionMenu({ show: false, vendor: null }); }}
                                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-slate-700 transition-all group">
                                        <div className="w-8 h-8 rounded bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-100"><TrendingUp size={16} /></div>
                                        <span className="text-sm font-semibold">Metrics Overview</span>
                                    </button>
                                    <button onClick={() => { handleOpenModal("edit", actionMenu.vendor); setActionMenu({ show: false, vendor: null }); }}
                                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-slate-700 transition-all group">
                                        <div className="w-8 h-8 rounded bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-slate-100"><Edit2 size={16} /></div>
                                        <span className="text-sm font-semibold">Config Settings</span>
                                    </button>
                                    <div className="h-px bg-slate-100 my-1 mx-2" />
                                    {!actionMenu.vendor?.verified ? (
                                        <div className="grid grid-cols-2 gap-2 p-1">
                                            <button onClick={() => { handleApprove(actionMenu.vendor._id); setActionMenu({ show: false, vendor: null }); }}
                                                className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all border border-emerald-100">
                                                <CheckCircle2 size={18} /><span className="text-[10px] font-bold uppercase">Approve</span>
                                            </button>
                                            <button onClick={() => { handleReject(actionMenu.vendor._id); setActionMenu({ show: false, vendor: null }); }}
                                                className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all border border-rose-100">
                                                <XCircle size={18} /><span className="text-[10px] font-bold uppercase">Reject</span>
                                            </button>
                                        </div>
                                    ) : actionMenu.vendor?.suspended ? (
                                        <button onClick={() => { handleReactivate(actionMenu.vendor._id); setActionMenu({ show: false, vendor: null }); }}
                                            className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all border border-emerald-100">
                                            <div className="w-8 h-8 rounded bg-white text-emerald-600 flex items-center justify-center"><RefreshCcw size={16} /></div>
                                            <span className="text-sm font-bold uppercase tracking-wider">Restore Operations</span>
                                        </button>
                                    ) : (
                                        <button onClick={() => { handleSuspend(actionMenu.vendor._id); setActionMenu({ show: false, vendor: null }); }}
                                            className="flex items-center gap-3 p-2.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all border border-rose-100">
                                            <div className="w-8 h-8 rounded bg-white text-rose-600 flex items-center justify-center"><Ban size={16} /></div>
                                            <span className="text-sm font-bold uppercase tracking-wider">Restrict Access</span>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Compact Confirm Modal */}
                <AnimatePresence>
                    {confirmModal.show && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => !confirmModal.isLoading && setConfirmModal({ show: false })}
                                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                className="relative w-full max-w-sm bg-white rounded-xl overflow-hidden border border-slate-200"
                            >
                                <div className="p-6 text-center">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                        <AlertCircle className="text-slate-400" size={24} />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight mb-2">{confirmModal.title}</h3>
                                    <p className="text-sm text-slate-500 font-medium leading-normal mb-6">{confirmModal.message}</p>

                                    {confirmModal.type === "prompt" && (
                                        <div className="mb-6">
                                            <textarea
                                                autoFocus
                                                value={confirmModal.inputValue}
                                                onChange={(e) => setConfirmModal(prev => ({ ...prev, inputValue: e.target.value }))}
                                                placeholder={confirmModal.placeholder}
                                                className="w-full min-h-[100px] p-4 bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold transition-all resize-none text-xs"
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <button disabled={confirmModal.isLoading} onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                                            className="flex-1 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors">
                                            {confirmModal.cancelText || "Cancel"}
                                        </button>
                                        <button disabled={confirmModal.isLoading} onClick={() => confirmModal.onConfirm(confirmModal.inputValue)}
                                            className="flex-1 py-2 rounded-lg bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                                            {confirmModal.isLoading ? <Loader2 className="animate-spin" size={16} /> : confirmModal.confirmText}
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
