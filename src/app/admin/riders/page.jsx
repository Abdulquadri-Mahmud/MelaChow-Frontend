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
    EyeOff,
    RefreshCw,
    User,
    ChevronDown
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
    const [modalMode, setModalMode] = useState("create"); 
    const [selectedRider, setSelectedRider] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

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
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const data = await adminApi.getAllVendors();
            setVendors(data.vendors || []);
        } catch (error) {
            console.error("Failed to fetch vendors:", error);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([fetchRiders(), fetchVendors()]);
            toast.success("Rider fleet updated");
        } catch (error) {
            toast.error("Sync failed");
        } finally {
            setIsRefreshing(false);
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
                password: "", 
                vendorId: rider.vendorId?._id || rider.vendorId || ""
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
                await adminApi.createRider(formData.vendorId || null, formData);
                toast.success("Rider added successfully");
            } else {
                await adminApi.updateRider(selectedRider._id, formData);
                toast.success("Rider details updated");
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
        if (!window.confirm("Remove this rider from the platform?")) return;
        try {
            await adminApi.deleteRider(riderId);
            toast.success("Rider removed");
            fetchRiders();
        } catch (error) {
            toast.error(error.message || "Failed to remove rider");
        }
    };

    const filteredRiders = riders.filter(r =>
        r.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.phone?.includes(search)
    );

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Rider Management</h1>
                            <p className="text-sm text-slate-500 mt-0.5">Manage delivery personnel, affiliations, and availability status.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
                                Sync Fleet
                            </button>
                            <button
                                onClick={() => handleOpenModal("create")}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <Plus size={16} />
                                Add Rider
                            </button>
                        </div>
                    </div>

                    {/* Stats & Search Toolbar */}
                    <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input
                                type="text"
                                placeholder="Search by name or phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-md outline-none text-sm focus:ring-1 focus:ring-slate-900 transition-all font-medium"
                            />
                        </div>
                        <div className="flex items-center gap-4 px-3 border-l border-slate-100">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Fleet</p>
                                <p className="text-sm font-bold text-slate-900 leading-none mt-1">{riders.length}</p>
                            </div>
                            <div className="w-[1px] h-6 bg-slate-100" />
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available</p>
                                <p className="text-sm font-bold text-emerald-600 leading-none mt-1">{riders.filter(r => r.status === 'available').length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Directory Table */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Rider Details</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Affiliation</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Status</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="4" className="py-12 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="animate-spin text-slate-400" size={24} />
                                                    <p className="text-xs text-slate-400 font-medium">Loading fleet data...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredRiders.length > 0 ? (
                                        filteredRiders.map((rider) => (
                                            <tr key={rider._id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-colors border border-slate-200">
                                                            <Bike size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-slate-900 leading-tight">{rider.name}</p>
                                                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                                <Phone size={10} className="text-slate-400" /> {rider.phone}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded bg-slate-50 flex items-center justify-center border border-slate-200">
                                                            <Store size={10} className="text-slate-500" />
                                                        </div>
                                                        <span className="text-xs font-semibold text-slate-600">
                                                            {rider.vendorId?.storeName || rider.vendorId?.name || "Independent"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {rider.status === 'available' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-bold uppercase tracking-wide">
                                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                            Available
                                                        </span>
                                                    ) : rider.status === 'on_delivery' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[10px] font-bold uppercase tracking-wide">
                                                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                                            On Delivery
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-wide">
                                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                                                            Offline
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => handleOpenModal("edit", rider)}
                                                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                                                            title="Edit Rider"
                                                        >
                                                            <Edit2 size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(rider._id)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                                            disabled={rider.status === 'on_delivery'}
                                                            title="Delete Rider"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="py-20 text-center">
                                                <div className="flex flex-col items-center opacity-30">
                                                    <Bike size={40} className="text-slate-400 mb-2" />
                                                    <p className="text-sm font-bold text-slate-500">No riders matched your query</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Form Modal */}
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
                                        <h2 className="text-base font-bold text-slate-900">
                                            {modalMode === "create" ? "Add Platform Rider" : "Edit Rider Profile"}
                                        </h2>
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5 tracking-wide">
                                            {modalMode === "create" ? "Register new personnel" : "Update credentials & affiliation"}
                                        </p>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-slate-500 ml-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-md outline-none text-sm font-medium focus:ring-1 focus:ring-slate-900 transition-all"
                                                    placeholder="Samuel Eze"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-slate-500 ml-1">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-md outline-none text-sm font-medium focus:ring-1 focus:ring-slate-900 transition-all"
                                                    placeholder="080XXXXXXXX"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-500 ml-1">Assign Vendor</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.vendorId}
                                                    onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                                                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-md outline-none text-sm font-medium focus:ring-1 focus:ring-slate-900 transition-all appearance-none cursor-pointer pr-9"
                                                >
                                                    <option value="">Independent / Platform Managed</option>
                                                    {vendors.map(v => (
                                                        <option key={v._id} value={v._id}>{v.storeName || v.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-slate-500 ml-1">Account Password {modalMode === 'edit' && '(Optional)'}</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    required={modalMode === 'create'}
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    className="w-full h-9 pl-3 pr-9 bg-slate-50 border border-slate-200 rounded-md outline-none text-sm font-medium focus:ring-1 focus:ring-slate-900 transition-all"
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button type="button" onClick={() => setShowModal(false)}
                                            className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                                        <button type="submit" disabled={isSubmitting}
                                            className="flex-1 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                            {modalMode === "create" ? "Add Rider" : "Save Changes"}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
