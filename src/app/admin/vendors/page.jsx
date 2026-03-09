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
    MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";

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
    const [modalMode, setModalMode] = useState("create"); // "create", "edit", "performance", "foods", "commission"
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
            // Clean up filter - remove empty strings to ensure 'All' option works correctly
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
        } else if (mode === "create") {
            setFormData({
                storeName: "",
                email: "",
                phone: "",
                deliveryManagedBy: "vendor"
            });
        }
        setShowModal(true);
    };

    const handleToggleDeliveryMode = async (vendorId, currentMode) => {
        const newMode = currentMode === "admin" ? "vendor" : "admin";
        const label = newMode === "admin" ? "GrubDash Riders" : "Vendor Riders";

        setConfirmModal({
            show: true,
            title: "Switch Delivery Mode",
            message: `Are you sure you want to switch this vendor to ${label}?`,
            type: "confirm",
            confirmText: "Switch Mode",
            onConfirm: async () => {
                try {
                    setConfirmModal(prev => ({ ...prev, isLoading: true }));
                    const data = await adminApi.updateVendorDeliveryMode(vendorId, newMode);
                    if (!data.success) throw new Error(data.message);
                    fetchVendors();
                    toast.success(`Delivery mode updated to ${label}`);
                    setConfirmModal({ show: false });
                } catch (err) {
                    toast.error(`Failed to update: ${err.message}`);
                } finally {
                    setConfirmModal(prev => ({ ...prev, isLoading: false }));
                }
            }
        });
    };

    const handleApprove = async (vendorId) => {
        setConfirmModal({
            show: true,
            title: "Approve Vendor",
            message: "Are you sure you want to approve this vendor and allow them to start selling on the platform?",
            type: "confirm",
            confirmText: "Yes, Approve",
            onConfirm: async () => {
                try {
                    setConfirmModal(prev => ({ ...prev, isLoading: true }));
                    await adminApi.approveVendor(vendorId);
                    toast.success("Vendor approved successfully");
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
            title: "Reject Vendor",
            message: "Please state the reason why this vendor's application is being rejected.",
            type: "prompt",
            confirmText: "Confirm Reject",
            placeholder: "Reason (e.g. Invalid documents, poor quality images)",
            inputValue: "",
            onConfirm: async (reason) => {
                if (!reason?.trim()) {
                    toast.error("Please provide a reason");
                    return;
                }
                try {
                    setConfirmModal(prev => ({ ...prev, isLoading: true }));
                    await adminApi.rejectVendor(vendorId, reason);
                    toast.success("Vendor rejected");
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
            title: "Suspend Vendor",
            message: "Explain the reason for suspending this vendor. They will not be able to receive orders while suspended.",
            type: "prompt",
            confirmText: "Suspend Account",
            placeholder: "Reason (e.g. Multiple customer complaints)",
            inputValue: "",
            onConfirm: async (reason) => {
                if (!reason?.trim()) {
                    toast.error("Please provide a reason");
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
            title: "Reactivate Vendor",
            message: "Are you sure you want to reactivate this vendor? They will be able to receive orders immediately.",
            type: "confirm",
            confirmText: "Reactivate",
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
            toast.success("Global commission rate updated");
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
                toast.success("Vendor updated successfully");
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



    // We now pass search to the API for better server-side filtering
    const filteredVendors = vendors;

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 mb-2">Vendor Management</h1>
                            <p className="text-gray-500 font-medium">Manage restaurant partners, commissions, and delivery modes</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setModalMode("commission");
                                    setShowModal(true);
                                }}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-3 rounded-2xl flex items-center gap-2 transition-all active:scale-95"
                            >
                                <Percent size={20} />
                                Global Commission
                            </button>
                        </div>
                    </div>

                    {/* Stats & Search */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search vendors by store name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-14 pl-14 pr-6 bg-white border border-gray-200 rounded-2xl focus:border-orange-500 outline-none font-medium transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filter.active}
                                onChange={(e) => setFilter({ ...filter, active: e.target.value })}
                                className="h-14 px-6 bg-white border border-gray-200 rounded-2xl focus:border-orange-500 outline-none font-semibold cursor-pointer hover:border-orange-200 transition-colors"
                            >
                                <option value="">Status: All</option>
                                <option value="true">Active Only</option>
                                <option value="false">Inactive Only</option>
                            </select>
                            <select
                                value={filter.verified}
                                onChange={(e) => setFilter({ ...filter, verified: e.target.value })}
                                className="h-14 px-6 bg-white border border-gray-200 rounded-2xl focus:border-orange-500 outline-none font-semibold cursor-pointer hover:border-orange-200 transition-colors"
                            >
                                <option value="">Verify: All</option>
                                <option value="true">Verified Only</option>
                                <option value="false">Unverified Only</option>
                            </select>
                        </div>
                        {(search || filter.verified || filter.active || filter.suspended) && (
                            <button
                                onClick={() => {
                                    setSearch("");
                                    setFilter({ verified: "", suspended: "", active: "" });
                                }}
                                className="h-14 px-8 bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-gray-100 flex items-center gap-2"
                            >
                                <X size={14} /> Clear
                            </button>
                        )}
                    </div>

                    {/* Vendor Table */}
                    <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-4 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Store Information</th>
                                        <th className="px-4 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Delivery Mode</th>
                                        <th className="px-4 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Commission</th>
                                        <th className="px-4 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Status</th>
                                        <th className="px-4 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr><td colSpan="5" className="p-6 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" size={32} /></td></tr>
                                    ) : filteredVendors.length > 0 ? (
                                        filteredVendors.map((vendor) => (
                                            <tr key={vendor._id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 overflow-hidden">
                                                            {vendor.logo ? <img src={vendor.logo} alt="" className="w-full h-full object-cover" /> : <Store size={24} />}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 flex items-center gap-1">
                                                                {vendor.storeName}
                                                                {vendor.verified && <CheckCircle2 size={14} className="text-blue-500" />}
                                                            </div>
                                                            <div className="text-xs text-gray-500">{vendor.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <button
                                                        onClick={() => handleToggleDeliveryMode(vendor._id, vendor.deliveryManagedBy)}
                                                        className={`group/toggle flex items-center gap-3 p-1.5 pr-4 rounded-2xl border transition-all active:scale-95 ${vendor.deliveryManagedBy === "admin"
                                                            ? "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100"
                                                            : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                                            }`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover/toggle:scale-110 ${vendor.deliveryManagedBy === "admin" ? "bg-blue-500 text-white" : "bg-emerald-500 text-white"}`}>
                                                            {vendor.deliveryManagedBy === "admin" ? <Truck size={16} /> : <Utensils size={16} />}
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                                                                {vendor.deliveryManagedBy === "admin" ? "Platform" : "Vendor"}
                                                            </div>
                                                            <div className="text-[9px] font-bold opacity-60">Click to switch</div>
                                                        </div>
                                                    </button>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="font-black text-gray-900">{(vendor.commissionRate * 100).toFixed(0)}%</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1">
                                                        {vendor.suspended ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-wider w-fit">
                                                                Suspended
                                                            </span>
                                                        ) : vendor.active ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider w-fit">
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-wider w-fit">
                                                                Inactive
                                                            </span>
                                                        )}
                                                        {!vendor.verified && (
                                                            <span className="text-[10px] font-bold text-orange-500 uppercase">Pending Review</span>
                                                        )}
                                                        {vendor.locationStatus === "pending_review" && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 uppercase">
                                                                <MapPin size={10} /> Location ⚠
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {!vendor.verified && (
                                                            <button
                                                                onClick={() => router.push(`/admin/vendors/${vendor._id}`)}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95"
                                                            >
                                                                <ExternalLink size={13} /> Review
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setActionMenu({ show: true, vendor })}
                                                            className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-gray-900 hover:text-white rounded-xl transition-all"
                                                        >
                                                            <MoreVertical size={20} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="p-20 text-center text-gray-500 font-medium whitespace-nowrap">No vendors found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowModal(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-lg bg-white rounded-[40px] overflow-hidden"
                            >
                                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 uppercase">
                                            {modalMode === "performance" && "Business Metrics"}

                                            {modalMode === "commission" && "Global Commission"}
                                            {modalMode === "edit" && "Edit Vendor"}
                                        </h2>
                                        <p className="text-xs font-bold text-gray-500 uppercase mt-1">
                                            {selectedVendor?.storeName || "Platform Settings"}
                                        </p>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-8 max-h-[70vh] overflow-y-auto">
                                    {modalMode === "performance" && metrics && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-6 bg-orange-50 rounded-[32px] border border-orange-100">
                                                <Wallet className="text-orange-600 mb-2" size={24} />
                                                <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Revenue</div>
                                                <div className="text-2xl font-black text-orange-950">₦{metrics.totalSales?.toLocaleString()}</div>
                                            </div>
                                            <div className="p-6 bg-blue-50 rounded-[32px] border border-blue-100">
                                                <Truck className="text-blue-600 mb-2" size={24} />
                                                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Orders</div>
                                                <div className="text-2xl font-black text-blue-950">{metrics.totalOrders}</div>
                                            </div>
                                            <div className="p-6 bg-green-50 rounded-[32px] border border-green-100">
                                                <CheckCircle2 className="text-green-600 mb-2" size={24} />
                                                <div className="text-[10px] font-black text-green-400 uppercase tracking-widest">Rating</div>
                                                <div className="text-2xl font-black text-green-950">{metrics.rating || 0} / 5</div>
                                            </div>
                                            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                                <Utensils className="text-slate-600 mb-2" size={24} />
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Food Items</div>
                                                <div className="text-2xl font-black text-slate-950">{metrics.foodCount}</div>
                                            </div>
                                        </div>
                                    )}


                                    {modalMode === "commission" && (
                                        <form onSubmit={handleUpdateCommission} className="space-y-6">
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4 mb-2 block">Commission Rate (e.g. 0.15 for 15%)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="1"
                                                    required
                                                    value={commissionRate}
                                                    onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                                                    className="w-full h-14 px-6 bg-gray-50 border border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none transition-all font-semibold"
                                                    placeholder="0.10"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full h-16 bg-orange-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-orange-700 transition-all active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <ShieldCheck size={24} />}
                                                Apply to All Vendors
                                            </button>
                                        </form>
                                    )}

                                    {modalMode === "edit" && (
                                        <form onSubmit={handleFormSubmit} className="space-y-6">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4 mb-2 block">Store Name</label>
                                                    <input
                                                        type="text"
                                                        name="storeName"
                                                        value={formData.storeName}
                                                        onChange={handleChange}
                                                        className="w-full h-14 px-6 bg-gray-50 border border-transparent focus:border-orange-500 rounded-2xl outline-none font-semibold"
                                                        placeholder="Store Name"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4 mb-2 block">Delivery Managed By</label>
                                                    <select
                                                        id="deliveryManagedBy"
                                                        name="deliveryManagedBy"
                                                        value={formData.deliveryManagedBy}
                                                        onChange={handleChange}
                                                        className="w-full h-14 px-6 bg-gray-50 border border-transparent focus:border-orange-500 rounded-2xl outline-none font-semibold appearance-none"
                                                    >
                                                        <option value="vendor">Vendor Riders</option>
                                                        <option value="admin">GrubDash Riders</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <ShieldCheck size={24} />}
                                                Save Changes
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Action Menu Modal */}
                <AnimatePresence>
                    {actionMenu.show && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setActionMenu({ show: false, vendor: null })}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-sm bg-white rounded-[32px] overflow-hidden p-6"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 uppercase">Vendor Options</h3>
                                        <p className="text-xs font-bold text-gray-400">{actionMenu.vendor?.storeName}</p>
                                    </div>
                                    <button
                                        onClick={() => setActionMenu({ show: false, vendor: null })}
                                        className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={() => {
                                            router.push(`/admin/vendors/${actionMenu.vendor._id}`);
                                            setActionMenu({ show: false, vendor: null });
                                        }}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-white transition-all text-gray-400 group-hover:text-emerald-500">
                                            <Eye size={20} />
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">View Full Details</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            viewPerformance(actionMenu.vendor);
                                            setActionMenu({ show: false, vendor: null });
                                        }}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-orange-50 text-gray-600 hover:text-orange-600 transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-white transition-all text-gray-400 group-hover:text-orange-500">
                                            <TrendingUp size={20} />
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">Business Intelligence</span>
                                    </button>



                                    <button
                                        onClick={() => {
                                            handleOpenModal("edit", actionMenu.vendor);
                                            setActionMenu({ show: false, vendor: null });
                                        }}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 text-gray-600 hover:text-slate-900 transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-white transition-all text-gray-400 group-hover:text-slate-600">
                                            <Edit2 size={20} />
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">Identity Settings</span>
                                    </button>

                                    <div className="h-px bg-gray-100 my-2" />

                                    {!actionMenu.vendor?.verified ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => {
                                                    handleApprove(actionMenu.vendor._id);
                                                    setActionMenu({ show: false, vendor: null });
                                                }}
                                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all group"
                                            >
                                                <CheckCircle2 size={24} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Approve</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleReject(actionMenu.vendor._id);
                                                    setActionMenu({ show: false, vendor: null });
                                                }}
                                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all group"
                                            >
                                                <Trash2 size={24} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Reject</span>
                                            </button>
                                        </div>
                                    ) : actionMenu.vendor?.suspended ? (
                                        <button
                                            onClick={() => {
                                                handleReactivate(actionMenu.vendor._id);
                                                setActionMenu({ show: false, vendor: null });
                                            }}
                                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 group-hover:text-emerald-500">
                                                <RefreshCcw size={20} />
                                            </div>
                                            <span className="font-black text-xs uppercase tracking-widest">Reactivate Account</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                handleSuspend(actionMenu.vendor._id);
                                                setActionMenu({ show: false, vendor: null });
                                            }}
                                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-500 group-hover:text-rose-500">
                                                <Ban size={20} />
                                            </div>
                                            <span className="font-black text-xs uppercase tracking-widest">Suspend Access</span>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Confirm/Prompt Modal */}
                <AnimatePresence>
                    {confirmModal.show && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => !confirmModal.isLoading && setConfirmModal({ show: false })}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-md bg-white rounded-[40px] overflow-hidden"
                            >
                                <div className="p-10 text-center">
                                    <div className="w-20 h-20 bg-orange-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                                        <AlertCircle className="text-orange-500" size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase mb-4 tracking-tight">{confirmModal.title}</h3>
                                    <p className="text-gray-500 font-medium leading-relaxed mb-8">{confirmModal.message}</p>

                                    {confirmModal.type === "prompt" && (
                                        <div className="mb-8">
                                            <textarea
                                                autoFocus
                                                value={confirmModal.inputValue}
                                                onChange={(e) => setConfirmModal(prev => ({ ...prev, inputValue: e.target.value }))}
                                                placeholder={confirmModal.placeholder}
                                                className="w-full min-h-[120px] p-6 bg-gray-50 border border-transparent focus:border-orange-500 focus:bg-white rounded-3xl outline-none font-semibold transition-all resize-none text-sm"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            disabled={confirmModal.isLoading}
                                            onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                                            className="h-16 rounded-3xl bg-gray-100 text-gray-500 font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {confirmModal.cancelText || "Cancel"}
                                        </button>
                                        <button
                                            disabled={confirmModal.isLoading}
                                            onClick={() => confirmModal.onConfirm(confirmModal.inputValue)}
                                            className="h-16 rounded-3xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {confirmModal.isLoading ? (
                                                <Loader2 className="animate-spin" size={20} />
                                            ) : (
                                                confirmModal.confirmText
                                            )}
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
