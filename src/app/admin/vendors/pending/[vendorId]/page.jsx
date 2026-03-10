"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import adminApi from "@/app/lib/adminApi";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
    ArrowLeft, Store, User, Mail, Phone, MapPin,
    CheckCircle2, AlertCircle, XCircle, Clock, Loader2,
    ShieldCheck, Truck, Utensils, ChevronDown, ChevronUp,
    TriangleAlert, CircleCheck, Info, Flag, Banknote, Globe,
    RefreshCw, Calendar, Smartphone, Building2, Map, CreditCard,
    ExternalLink
} from "lucide-react";

// ─── Shared Components ──────────────────────────────────────────────────
const formatDate = (d) => d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

function DetailRow({ label, value, icon: Icon, required, warning }) {
    const isEmpty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 px-2 -mx-2 rounded-lg transition-colors">
            <div className="flex items-center gap-2.5 mb-1 sm:mb-0">
                <div className={`p-1.5 rounded-lg ${isEmpty ? "bg-slate-100 text-slate-400" : warning ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-500"}`}>
                    {Icon ? <Icon size={14} /> : <div className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
                {required && <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-tighter">Required</span>}
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-black tracking-tight ${isEmpty ? "text-slate-300 italic" : warning ? "text-amber-700" : "text-slate-900"}`}>
                    {isEmpty ? "MISSING" : typeof value === "boolean" ? (value ? "ENABLED" : "DISABLED") : Array.isArray(value) ? value.join(", ") : String(value)}
                </span>
                {!isEmpty && !warning && <CheckCircle2 size={12} className="text-emerald-500" />}
                {warning && <TriangleAlert size={12} className="text-amber-500" />}
            </div>
        </div>
    );
}

function SectionCard({ title, icon: Icon, children, badge, action }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 shadow-sm">
                        <Icon size={16} />
                    </div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.15em]">{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    {badge}
                    {action}
                </div>
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

export default function VendorReviewPage() {
    const { vendorId } = useParams();
    const router = useRouter();

    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isActioning, setIsActioning] = useState(false);

    const [locState, setLocState] = useState("");
    const [locCity, setLocCity] = useState("");
    const [createLocation, setCreateLocation] = useState(false);
    const [locationHint, setLocationHint] = useState("");
    const [rejectModal, setRejectModal] = useState({ show: false, reason: "" });
    const [foodsExpanded, setFoodsExpanded] = useState(false);

    const loadVendor = useCallback(async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            else setRefreshing(true);

            const data = await adminApi.getVendorById(vendorId);
            const v = data.vendor || data;
            setVendor(v);

            if (v.locationStatus === "pending_review") {
                setLocState(prev => prev || v.requestedState || "");
                setLocCity(prev => prev || v.requestedCity || "");
            }
            if (isSilent) toast.success("Refreshed");
        } catch (err) {
            toast.error("Failed to load vendor: " + err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [vendorId]);

    useEffect(() => {
        if (vendorId) loadVendor();
    }, [vendorId, loadVendor]);

    const blockingIssues = vendor ? [
        !vendor.name && "Legal name missing",
        !vendor.email && "Email contact missing",
        !vendor.phone && "Mobile number missing",
        !vendor.storeName && "Commercial name missing",
        !vendor.address?.street && "Primary address missing",
        vendor.suspended && "Account under suspension",
        vendor.deletedAt && "Account marked for deletion",
        (vendor.locationStatus === "pending_review" && (!locState.trim() || !locCity.trim())) && "Geography unmapped — Resolution required",
    ].filter(Boolean) : [];

    const canApprove = blockingIssues.length === 0;

    const handleApprove = async () => {
        if (!canApprove) return;
        setIsActioning(true);
        setLocationHint("");
        try {
            const body = vendor.locationStatus === "pending_review"
                ? { state: locState.trim(), city: locCity.trim(), createLocation }
                : {};
            await adminApi.approveVendor(vendorId, body);
            toast.success("Application approved successfully.");
            router.push("/admin/vendors/pending");
        } catch (err) {
            const raw = err.message || "";
            if (raw.toLowerCase().includes("location")) {
                setLocationHint("GIS Error: Location not mapped. Confirm spelling or enable 'Auto-Create'.");
            } else {
                toast.error(raw || "Approval failed");
            }
        } finally {
            setIsActioning(false);
        }
    };

    const handleReject = async () => {
        if (!rejectModal.reason.trim()) return toast.error("Reason required for rejection reporting.");
        setIsActioning(true);
        try {
            await adminApi.rejectVendor(vendorId, rejectModal.reason);
            toast.success("Application rejected. Vendor notified.");
            router.push("/admin/vendors/pending");
        } catch (err) {
            toast.error(err.message || "Rejection failed");
        } finally {
            setIsActioning(false);
            setRejectModal({ show: false, reason: "" });
        }
    };

    if (loading) return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-slate-100 rounded-full" />
                        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
                    </div>
                    <p className="font-black text-[10px] uppercase tracking-widest text-slate-400">Initializing Terminal...</p>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-[1600px] mx-auto space-y-6">
                    {/* Integrated Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Case ID:</span>
                                    <code className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono uppercase">{vendorId}</code>
                                </div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    {vendor.storeName || "Vendor Detail Review"}
                                    {vendor.verified && <CheckCircle2 size={20} className="text-emerald-500" />}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => loadVendor(true)}
                                disabled={refreshing || isActioning}
                                className="h-11 px-4 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center gap-2 text-xs font-bold active:scale-95 disabled:opacity-50 shadow-sm"
                            >
                                <RefreshCw size={14} className={refreshing ? "animate-spin text-orange-500" : ""} />
                                {refreshing ? "Syncing..." : "Refresh Case"}
                            </button>
                            <span className="h-11 px-5 flex items-center gap-2 bg-amber-50 text-amber-700 font-black text-[10px] uppercase tracking-widest rounded-xl border border-amber-200/50 shadow-sm shadow-amber-500/5">
                                <Clock size={14} className="animate-pulse" /> Pending Review
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Main Info Stream */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* Blocking Notifications */}
                            {blockingIssues.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4 flex gap-4"
                                >
                                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
                                        <TriangleAlert size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-xs text-rose-800 uppercase tracking-wider mb-2">Compliance Check Failed</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                                            {blockingIssues.map((issue, i) => (
                                                <div key={i} className="text-[11px] font-bold text-rose-700 flex items-center gap-2">
                                                    <div className="w-1 h-1 bg-rose-400 rounded-full" /> {issue}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Identity */}
                                <SectionCard title="Vendor Identity" icon={User}>
                                    <DetailRow label="Legal Name" value={vendor.name} icon={User} required />
                                    <DetailRow label="Primary Email" value={vendor.email} icon={Mail} required />
                                    <DetailRow label="Mobile Line" value={vendor.phone} icon={Smartphone} required />
                                    <DetailRow label="Brand Name" value={vendor.storeName} icon={Store} required />
                                </SectionCard>

                                {/* Location */}
                                <SectionCard title="Geographic Data" icon={MapPin}>
                                    <DetailRow label="Street Address" value={vendor.address?.street} icon={Building2} required />
                                    <DetailRow label="Post Code" value={vendor.address?.postalCode} icon={Map} />
                                    <DetailRow label="Lat / Lng" value={vendor.address?.coordinates?.coordinates?.join(", ")} icon={Globe} />
                                    <DetailRow label="Current Status" value={vendor.locationStatus?.replace("_", " ")} icon={Flag} warning={vendor.locationStatus === "pending_review"} />
                                </SectionCard>
                            </div>

                            {/* Location Resolution Module */}
                            {vendor.locationStatus === "pending_review" && (
                                <SectionCard
                                    title="Geography Mapping Resolution"
                                    icon={MapPin}
                                    badge={<span className="text-[9px] font-black bg-rose-500 text-white px-2 py-0.5 rounded animate-pulse">GIS ACTION REQUIRED</span>}
                                >
                                    <div className="space-y-4">
                                        <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-wide border-l-2 border-orange-500 pl-3">
                                            The automated mapping system failed to resolve requested location:
                                            <span className="text-slate-900 block mt-1 font-black">"{vendor.requestedState} / {vendor.requestedCity}"</span>
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Administrative State</label>
                                                <input
                                                    value={locState}
                                                    onChange={e => setLocState(e.target.value)}
                                                    className="w-full h-11 px-4 bg-white border border-slate-200 focus:border-orange-500 rounded-xl outline-none font-bold text-xs transition-all shadow-sm"
                                                    placeholder="e.g. Lagos"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Logical City</label>
                                                <input
                                                    value={locCity}
                                                    onChange={e => setLocCity(e.target.value)}
                                                    className="w-full h-11 px-4 bg-white border border-slate-200 focus:border-orange-500 rounded-xl outline-none font-bold text-xs transition-all shadow-sm"
                                                    placeholder="e.g. Victoria Island"
                                                />
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={createLocation}
                                                onChange={e => setCreateLocation(e.target.checked)}
                                                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <div className="flex-1">
                                                <p className="text-[11px] font-black text-slate-900">AUTO-PROVISION GEOGRAPHY</p>
                                                <p className="text-[10px] text-slate-500 font-medium tracking-tight">Add new State/City to system registry if not found.</p>
                                            </div>
                                        </label>

                                        {locationHint && (
                                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[10px] font-bold text-rose-700 flex items-center gap-2">
                                                <Info size={14} className="shrink-0" /> {locationHint}
                                            </div>
                                        )}
                                    </div>
                                </SectionCard>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Operations */}
                                <SectionCard title="Commercial Profile" icon={Store}>
                                    <div className="flex items-center gap-4 mb-4 border-b border-slate-100 pb-4">
                                        <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                                            {vendor.logo ? (
                                                <img src={vendor.logo} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Store size={24} className="text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Company Description</p>
                                            <p className="text-xs font-bold text-slate-700 line-clamp-2 leading-relaxed italic">
                                                "{vendor.storeDescription || "No commercial summary provided."}"
                                            </p>
                                        </div>
                                    </div>
                                    <DetailRow label="Cuisine Types" value={vendor.cuisineTypes} icon={Utensils} />
                                    <DetailRow label="Delivery Ready" value={vendor.acceptsDelivery} icon={Truck} />
                                    <DetailRow label="Fulfillment" value={vendor.deliveryManagedBy === 'admin' ? "GRUBDASH" : "SELF-MANAGED"} icon={Truck} warning={!vendor.deliveryManagedBy} />
                                </SectionCard>

                                {/* Banking */}
                                <SectionCard title="Payout Infrastructure" icon={Banknote}>
                                    <DetailRow label="Financial Institution" value={vendor.payoutDetails?.bankName} icon={Building2} />
                                    <DetailRow label="A/C Designation" value={vendor.payoutDetails?.accountName} icon={User} />
                                    <DetailRow label="Account Serial" value={vendor.payoutDetails?.accountNumber} icon={CreditCard} />
                                    <DetailRow label="Payout State" value={vendor.payoutDetails?.payoutEnabled} icon={CheckCircle2} />
                                </SectionCard>
                            </div>

                        </div>

                        {/* Workflow Actions Side Panel */}
                        <div className="lg:col-span-4 space-y-6">

                            {/* Status Terminal */}
                            <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl space-y-6 sticky top-4">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Workflow Terminal</h3>
                                    <div className="space-y-3">
                                        {[
                                            { label: "Account Email Verified", ok: vendor.verified },
                                            { label: "Document Compliance", ok: !!vendor.logo && !!vendor.payoutDetails?.accountNumber },
                                            { label: "Geography Resolved", ok: vendor.locationStatus !== "pending_review" && !!vendor.address?.street },
                                            { label: "Administrative Lock", ok: !vendor.suspended },
                                        ].map((step, i) => (
                                            <div key={i} className="flex items-center justify-between text-[11px]">
                                                <span className="text-slate-400 font-bold">{step.label}</span>
                                                {step.ok ? (
                                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                                ) : (
                                                    <XCircle size={14} className="text-rose-500" strokeWidth={3} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-800 space-y-4">
                                    <button
                                        disabled={!canApprove || isActioning}
                                        onClick={handleApprove}
                                        className={`w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${canApprove
                                            ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                                            : "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700"
                                            }`}
                                    >
                                        {isActioning ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                                        Finalize Approval
                                    </button>

                                    <button
                                        disabled={isActioning}
                                        onClick={() => setRejectModal({ show: true, reason: "" })}
                                        className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-rose-500/30 text-rose-500 hover:bg-rose-500/5 transition-all"
                                    >
                                        <XCircle size={18} /> Decline Application
                                    </button>
                                </div>

                                <div className="text-center">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Operator: System Administrator</p>
                                    <p className="text-[9px] text-slate-700 font-mono mt-1">v.2.0.4-audit</p>
                                </div>
                            </div>

                            {/* Stats Detail */}
                            <SectionCard title="Audit History" icon={Calendar}>
                                <DetailRow label="Created On" value={formatDate(vendor.createdAt)} icon={Calendar} />
                                <DetailRow label="Last Modifier" value={formatDate(vendor.updatedAt)} icon={Clock} />
                                <DetailRow label="Products Count" value={vendor.foods?.length || 0} icon={Utensils} />
                                <DetailRow label="System Status" value={vendor.active ? "NOMINAL" : "DORMANT"} icon={ShieldCheck} />
                            </SectionCard>

                        </div>

                    </div>
                </div>

                {/* Reject Confirmation Modal */}
                <AnimatePresence>
                    {rejectModal.show && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => !isActioning && setRejectModal({ show: false, reason: "" })}
                                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl shadow-black/50"
                            >
                                <div className="p-8">
                                    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-500">
                                        <XCircle size={32} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 text-center mb-2 uppercase tracking-tight">Revoke Application</h3>
                                    <p className="text-slate-500 font-medium text-center mb-6 text-xs leading-relaxed max-w-sm mx-auto uppercase tracking-wide">
                                        Specify the exact deficit in this application. The vendor will receive these notes via official communication.
                                    </p>

                                    <textarea
                                        autoFocus
                                        value={rejectModal.reason}
                                        onChange={e => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                                        placeholder="e.g. Identity documents are unreadable; Payout account is closed; Unauthorized service area..."
                                        className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-2xl outline-none font-bold text-xs resize-none mb-6 transition-all"
                                    />

                                    <div className="flex gap-3">
                                        <button
                                            disabled={isActioning}
                                            onClick={() => setRejectModal({ show: false, reason: "" })}
                                            className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                                        >
                                            Discard Action
                                        </button>
                                        <button
                                            disabled={isActioning || !rejectModal.reason.trim()}
                                            onClick={handleReject}
                                            className="flex-[2] h-12 rounded-xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
                                        >
                                            {isActioning ? <Loader2 size={16} className="animate-spin" /> : "Confirm Decline"}
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
