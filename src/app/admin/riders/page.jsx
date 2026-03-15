"use client";

import { useState, useEffect } from "react";
import {
    Bike,
    Search,
    Plus,
    Edit2,
    Trash2,
    Store,
    Phone,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    X,
    Loader2,
    ShieldCheck,
    Eye,
    EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";

export default function AdminRidersPage() {
    const [riders, setRiders] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
    const [selectedRider, setSelectedRider] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        password: "",
        vendorId: ""
    });

    const fetchRiders = async () => {
        try {
            const data = await adminApi.getAllRiders();
            const ridersArray = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.riders) ? data.riders : (Array.isArray(data) ? data : []));
            setRiders(ridersArray);
        } catch (error) {
            console.error("Failed to fetch riders:", error);
            // toast.error("Could not load riders");
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const data = await adminApi.getAllVendors();
            // Expected data format { success: true, vendors: [...] }
            setVendors(data.vendors || []);
        } catch (error) {
            console.error("Failed to fetch vendors:", error);
        }
    };

    useEffect(() => {
        fetchRiders();
        fetchVendors();
    }, []);

    const handleOpenModal = (mode, rider = null) => {
        setModalMode(mode);
        if (mode === "edit" && rider) {
            setSelectedRider(rider);
            setFormData({
                name: rider.name,
                phone: rider.phone,
                password: "", // Don't show password for edit
                vendorId: rider.vendorId?._id || rider.vendorId
            });
        } else {
            setSelectedRider(null);
            setFormData({
                name: "",
                phone: "",
                password: "",
                vendorId: ""
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (modalMode === "create") {
                if (!formData.vendorId) {
                    toast.error("Please select a vendor");
                    setIsSubmitting(false);
                    return;
                }
                await adminApi.createRider(formData.vendorId, formData);
                toast.success("Rider created successfully");
            } else {
                await adminApi.updateRider(selectedRider._id, formData);
                toast.success("Rider updated successfully");
            }
            fetchRiders();
            setShowModal(false);
        } catch (error) {
            toast.error(error.message || "Operation failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (riderId) => {
        if (!window.confirm("Are you sure you want to remove this rider?")) return;
        try {
            await adminApi.deleteRider(riderId);
            toast.success("Rider removed");
            fetchRiders();
        } catch (error) {
            toast.error(error.message || "Failed to remove rider. They may have active orders.");
        }
    };

    const filteredRiders = riders.filter(r =>
        r.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.phone?.includes(search)
    );

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 mb-2">Fleet Management</h1>
                            <p className="text-gray-500 font-medium">Global directory and controls for all GrubDash riders</p>
                        </div>
                        <button
                            onClick={() => handleOpenModal("create")}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-black px-8 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-orange-600/20 transition-all active:scale-95"
                        >
                            <Plus size={20} />
                            Add Global Rider
                        </button>
                    </div>

                    {/* Stats & Search */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name or phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-14 pl-14 pr-6 bg-white border border-gray-200 rounded-2xl focus:border-orange-500 outline-none font-medium transition-all shadow-sm"
                            />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 flex items-center gap-6 shadow-sm">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Fleet</span>
                                <span className="text-xl font-black text-gray-900">{riders.length}</span>
                            </div>
                            <div className="w-[1px] h-8 bg-gray-100" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Available</span>
                                <span className="text-xl font-black text-green-500">{riders.filter(r => r.status === 'available').length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Rider Directory Table */}
                    <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden shadow-xl shadow-gray-200/50">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-8 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Rider Information</th>
                                        <th className="px-8 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Affiliation</th>
                                        <th className="px-8 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest">Status</th>
                                        <th className="px-8 py-5 text-[11px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr><td colSpan="4" className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" size={32} /></td></tr>
                                    ) : filteredRiders.length > 0 ? (
                                        filteredRiders.map((rider) => (
                                            <tr key={rider._id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                                                            <Bike size={24} />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900">{rider.name}</div>
                                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                                <Phone size={10} /> {rider.phone}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <Store size={14} className="text-gray-400" />
                                                        <span className="font-semibold text-sm text-gray-700">
                                                            {rider.vendorId?.storeName || rider.vendorId?.name || "Independent"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {rider.status === 'available' ? (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                            Available
                                                        </div>
                                                    ) : rider.status === 'on_delivery' ? (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                                            On Delivery
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                                            Offline
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleOpenModal("edit", rider)}
                                                            className="p-2.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(rider._id)}
                                                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                            disabled={rider.status === 'on_delivery'}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="4" className="p-20 text-center text-gray-500 font-medium whitespace-nowrap">No riders found matching your search.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Create/Edit Modal */}
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
                                className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
                            >
                                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900">
                                            {modalMode === "create" ? "Add Global Rider" : "Edit Rider Profile"}
                                        </h2>
                                        <p className="text-xs font-bold text-gray-500 uppercase mt-1">
                                            {modalMode === "create" ? "Assign new pilot to any vendor" : "Update credentials and affiliation"}
                                        </p>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shadow-sm">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4 mb-2 block">Full Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full h-14 px-6 bg-gray-50 border border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none transition-all font-semibold"
                                                    placeholder="e.g. Samuel Eze"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4 mb-2 block">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full h-14 px-6 bg-gray-50 border border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none transition-all font-semibold"
                                                    placeholder="080XXXXXXXX"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4 mb-2 block">Restaurant / Vendor</label>
                                            <select
                                                required
                                                value={formData.vendorId}
                                                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                                                className="w-full h-14 px-6 bg-gray-50 border border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none transition-all font-semibold appearance-none"
                                            >
                                                <option value="">Select Vendor</option>
                                                {vendors.map(v => (
                                                    <option key={v._id} value={v._id}>{v.storeName || v.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4 mb-2 block">Password {modalMode === 'edit' && '(Leave blank to keep current)'}</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    required={modalMode === 'create'}
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    className="w-full h-14 pl-6 pr-14 bg-gray-50 border border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none transition-all font-semibold"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-16 bg-orange-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-600/20 flex items-center justify-center gap-2 hover:bg-orange-700 transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <ShieldCheck size={24} />}
                                        {modalMode === "create" ? "Create Global Rider" : "Update Rider Affiliation"}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
