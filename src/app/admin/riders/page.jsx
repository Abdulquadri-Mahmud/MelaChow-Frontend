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
    X,
    Loader2,
    Eye,
    EyeOff,
    RefreshCw,
    ChevronDown,
    Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";

// ─── Table Shell ───────────────────────────────────────────────────────────────
const TableCard = ({ children }) => (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="h-0.5 bg-gradient-to-r from-orange-500 to-amber-400" />
        <div className="overflow-x-auto">{children}</div>
    </div>
);

const Th = ({ children, right }) => (
    <th className={`px-4 py-2.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.15em] bg-slate-50 border-b border-slate-100 ${right ? "text-right" : ""}`}>
        {children}
    </th>
);

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
    
    // Bank States
    const [banks, setBanks] = useState([]);
    const [resolvingAccount, setResolvingAccount] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        password: "",
        vendorId: "",
        payoutDetails: {
            bankCode: "",
            bankName: "",
            accountNumber: "",
            accountName: "",
            payoutEnabled: false
        }
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

    const fetchBanks = async () => {
        try {
            const data = await adminApi.getPublicBanks();
            setBanks(data.data || []);
        } catch (error) {
            console.error("Failed to load banks:", error);
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
        fetchBanks();
    }, []);

    const handleOpenModal = (mode, rider = null) => {
        setModalMode(mode);
        setShowPassword(false);
        if (mode === "edit" && rider) {
            setSelectedRider(rider);
            setFormData({
                name: rider.name,
                phone: rider.phone,
                password: "",
                vendorId: rider.vendorId?._id || rider.vendorId || "",
                payoutDetails: {
                    bankCode: rider.payoutDetails?.bankCode || "",
                    bankName: rider.payoutDetails?.bankName || "",
                    accountNumber: rider.payoutDetails?.accountNumber || "",
                    accountName: rider.payoutDetails?.accountName || "",
                    payoutEnabled: rider.payoutDetails?.payoutEnabled || false
                }
            });
        } else {
            setSelectedRider(null);
            setFormData({
                name: "",
                phone: "",
                password: "",
                vendorId: "",
                payoutDetails: {
                    bankCode: "",
                    bankName: "",
                    accountNumber: "",
                    accountName: "",
                    payoutEnabled: false
                }
            });
        }
        setShowModal(true);
    };

    const handleResolveAccount = async (accountNumber, bankCode) => {
        if (accountNumber.length !== 10 || !bankCode) return;
        
        setResolvingAccount(true);
        try {
            const data = await adminApi.resolveAccount(accountNumber, bankCode);
            if (data.success && data.data?.accountName) {
                setFormData(prev => ({
                    ...prev,
                    payoutDetails: {
                        ...prev.payoutDetails,
                        accountName: data.data.accountName,
                        payoutEnabled: true
                    }
                }));
                toast.success("Account verified: " + data.data.accountName);
            }
        } catch (error) {
            setFormData(prev => ({
                ...prev,
                payoutDetails: {
                    ...prev.payoutDetails,
                    accountName: "Verification failed",
                    payoutEnabled: false
                }
            }));
            toast.error("Could not verify account");
        } finally {
            setResolvingAccount(false);
        }
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
                <div className="space-y-5">
                    {/* ── HEADER ────────────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center shadow-md shadow-orange-200 shrink-0">
                                    <Bike size={17} className="text-white" />
                                </div>
                                <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Rider Management</h1>
                                <span className="hidden md:inline text-[9px] font-extrabold px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-200 uppercase tracking-widest">
                                    Fleet Center
                                </span>
                            </div>
                            <div className="flex items-center gap-2 ml-12">
                                <div className="h-0.5 w-8 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" />
                                <p className="text-xs text-slate-500 font-medium leading-snug">
                                    Manage delivery personnel, vendor affiliations, and availability network status.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:border-orange-200 hover:text-orange-600 transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50 shadow-sm"
                            >
                                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                                Sync Fleet
                            </button>
                            <button
                                onClick={() => handleOpenModal("create")}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-400 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl hover:from-orange-600 hover:to-amber-500 transition-all shadow-md shadow-orange-200"
                            >
                                <Plus size={15} />
                                Add Rider
                            </button>
                        </div>
                    </div>

                    {/* ── TOOLBAR (SEARCH & STATS) ─────────────────────────── */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row gap-3 shadow-sm">
                        <div className="flex-1 relative group w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Find rider by name or phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-5 px-4 lg:px-6 py-1 bg-slate-50 rounded-lg border border-slate-100 min-w-max">
                            <div>
                                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Total</p>
                                <p className="text-base font-extrabold text-slate-900 leading-none mt-1 text-center">{riders.length}</p>
                            </div>
                            <div className="w-px h-6 bg-slate-200" />
                            <div>
                                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Available</p>
                                <p className="text-base font-extrabold text-emerald-600 leading-none mt-1 text-center">{riders.filter(r => r.status === 'available').length}</p>
                            </div>
                        </div>
                    </div>

                    {/* ── FLEET DIRECTORY ──────────────────────────────────── */}
                    <TableCard>
                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    <Th>Rider Identity</Th>
                                    <Th>Affiliation</Th>
                                    <Th>Status</Th>
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
                                            <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-md w-24" /></td>
                                            <td className="px-4 py-3 flex justify-end"><div className="h-6 w-16 bg-slate-100 rounded-md" /></td>
                                        </tr>
                                    ))
                                ) : filteredRiders.length > 0 ? (
                                    filteredRiders.map((rider) => (
                                        <tr key={rider._id} className="hover:bg-orange-50/40 transition-colors group">
                                            {/* Name / Phone */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl flex items-center justify-center text-orange-500 border border-orange-200 shrink-0">
                                                        <Bike size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-extrabold text-sm text-slate-900 leading-tight group-hover:text-orange-600 transition-colors">{rider.name}</p>
                                                        <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-1">
                                                            <Phone size={10} className="text-orange-400" /> {rider.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Affiliate Vendor */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shadow-sm">
                                                        <Store size={11} className="text-slate-500" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {rider.vendorId?.storeName || rider.vendorId?.name || "Independent Network"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Network Status */}
                                            <td className="px-4 py-3">
                                                {rider.status === 'available' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-extrabold uppercase tracking-widest">
                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                        Available
                                                    </span>
                                                ) : rider.status === 'on_delivery' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-extrabold uppercase tracking-widest">
                                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                                        On Delivery
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-[9px] font-extrabold uppercase tracking-widest">
                                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                                                        Offline
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenModal("edit", rider)}
                                                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                                        title="Edit Rider"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(rider._id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
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
                                            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                                <Activity size={26} className="text-slate-300" />
                                            </div>
                                            <p className="text-sm font-extrabold text-slate-500">No riders matched your query</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </TableCard>
                </div>

                {/* ── CREATE / EDIT MODAL ──────────────────────────────────────── */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
                            
                            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
                                className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl"
                            >
                                {/* Modal Header */}
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-sm shadow-orange-200">
                                            {modalMode === "create" ? <Plus size={16} /> : <Edit2 size={16} />}
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">
                                                {modalMode === "create" ? "Add Fleet Member" : "Update Network Profile"}
                                            </h2>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all placeholder:text-slate-300"
                                                placeholder="e.g. Samuel Eze"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                required
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all placeholder:text-slate-300"
                                                placeholder="080XXXXXXXX"
                                            />
                                        </div>
                                    </div>

                                    {/* ── PAYOUT DETAILS ─────────────────────────────────── */}
                                    <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 space-y-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1.5 h-3 bg-orange-400 rounded-full" />
                                            <h3 className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Payout & Bank Credentials</h3>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Bank Institution</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.payoutDetails.bankCode}
                                                    onChange={(e) => {
                                                        const selectedBank = banks.find(b => b.code === e.target.value);
                                                        setFormData({
                                                            ...formData,
                                                            payoutDetails: {
                                                                ...formData.payoutDetails,
                                                                bankCode: e.target.value,
                                                                bankName: selectedBank?.name || ""
                                                            }
                                                        });
                                                        handleResolveAccount(formData.payoutDetails.accountNumber, e.target.value);
                                                    }}
                                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all appearance-none cursor-pointer pr-9 text-slate-700 shadow-sm"
                                                >
                                                    <option value="">Select Bank...</option>
                                                    {banks.map(b => (
                                                        <option key={b.code} value={b.code}>{b.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Account Number (NUBAN)</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    maxLength="10"
                                                    value={formData.payoutDetails.accountNumber}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, "");
                                                        setFormData({
                                                            ...formData,
                                                            payoutDetails: { ...formData.payoutDetails, accountNumber: val }
                                                        });
                                                        if (val.length === 10) handleResolveAccount(val, formData.payoutDetails.bankCode);
                                                    }}
                                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all placeholder:text-slate-300 shadow-sm"
                                                    placeholder="0123456789"
                                                />
                                                {resolvingAccount && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <Loader2 className="animate-spin text-orange-500" size={14} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {formData.payoutDetails.accountName && (
                                            <div className={`p-2 rounded-lg border flex items-center gap-2 ${formData.payoutDetails.payoutEnabled ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${formData.payoutDetails.payoutEnabled ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                <p className={`text-[10px] font-bold ${formData.payoutDetails.payoutEnabled ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                    {formData.payoutDetails.accountName}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Vendor Affiliation</label>
                                        <div className="relative">
                                            <select
                                                value={formData.vendorId}
                                                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all appearance-none cursor-pointer pr-9 text-slate-700"
                                            >
                                                <option value="">Independent (Platform Managed)</option>
                                                {vendors.map(v => (
                                                    <option key={v._id} value={v._id}>{v.storeName || v.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">
                                            Access Credential {modalMode === 'edit' && <span className="text-slate-300">(Optional)</span>}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required={modalMode === 'create'}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full h-10 pl-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all placeholder:text-slate-300"
                                                placeholder={modalMode === 'create' ? "••••••••" : "Leave blank to keep current"}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-orange-500 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                        {modalMode === 'create' && <p className="text-[10px] font-medium text-slate-400 px-1 mt-1">Rider will use this to sign into the MelaChow Rider Portal</p>}
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button type="button" onClick={() => setShowModal(false)}
                                            className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs uppercase tracking-widest font-extrabold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={isSubmitting}
                                            className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-400 text-white text-xs uppercase tracking-widest font-extrabold rounded-xl hover:from-orange-600 hover:to-amber-500 transition-colors flex items-center justify-center gap-2 shadow-md shadow-orange-200 disabled:opacity-60">
                                            {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                                            {modalMode === "create" ? "Provision" : "Save Changes"}
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
