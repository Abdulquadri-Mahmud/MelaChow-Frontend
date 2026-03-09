"use client";

import { useState, useEffect } from "react";
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
    TriangleAlert, CircleCheck, Info, Flag, Banknote, Globe
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────
const formatDate = (d) => d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

function FieldRow({ label, value, required, children }) {
    const isEmpty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
    return (
        <div className="flex items-start justify-between py-3.5 border-b border-gray-50 last:border-0 gap-4">
            <div className="flex items-center gap-2 shrink-0">
                {required
                    ? isEmpty
                        ? <XCircle size={16} className="text-rose-500" />
                        : <CircleCheck size={16} className="text-emerald-500" />
                    : isEmpty
                        ? <TriangleAlert size={16} className="text-amber-400" />
                        : <CircleCheck size={16} className="text-emerald-400" />
                }
                <span className="text-sm font-semibold text-gray-700">{label}</span>
                {required && <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Required</span>}
            </div>
            <div className="text-right">
                {children || (
                    <span className={`text-sm font-bold truncate ${isEmpty ? "text-gray-400 italic" : "text-gray-900"}`}>
                        {isEmpty
                            ? "Missing"
                            : typeof value === "boolean"
                                ? (value ? "Yes" : "No")
                                : Array.isArray(value)
                                    ? value.join(", ")
                                    : String(value)
                        }
                    </span>
                )}
            </div>
        </div>
    );
}

function SectionCard({ icon: Icon, title, iconColor = "text-orange-600", iconBg = "bg-orange-100", children, badge }) {
    return (
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-3">
                <div className={`w-8 h-8 ${iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon className={iconColor} size={18} />
                </div>
                <h2 className="font-black text-gray-900 uppercase text-sm tracking-widest">{title}</h2>
                {badge && <span className="ml-auto">{badge}</span>}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

export default function VendorReviewPage() {
    const { vendorId } = useParams();
    const router = useRouter();

    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isActioning, setIsActioning] = useState(false);

    // Location state
    const [locState, setLocState] = useState("");
    const [locCity, setLocCity] = useState("");
    const [createLocation, setCreateLocation] = useState(false);
    const [locationHint, setLocationHint] = useState("");

    // Reject modal
    const [rejectModal, setRejectModal] = useState({ show: false, reason: "" });

    // Foods collapse
    const [foodsExpanded, setFoodsExpanded] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await adminApi.getVendorById(vendorId);
                const v = data.vendor || data;
                setVendor(v);
                if (v.locationStatus === "pending_review") {
                    setLocState(v.requestedState || "");
                    setLocCity(v.requestedCity || "");
                }
            } catch (err) {
                toast.error("Failed to load vendor: " + err.message);
            } finally {
                setLoading(false);
            }
        };
        if (vendorId) load();
    }, [vendorId]);

    // ── Blocking guard ─────────────────────────────────────────────────────
    const blockingIssues = vendor ? [
        !vendor.name && "Owner name is missing",
        !vendor.email && "Email address is missing",
        !vendor.phone && "Phone number is missing",
        !vendor.storeName && "Store name is missing",
        !vendor.address?.street && "Street address is missing",
        vendor.suspended && "Vendor is currently suspended",
        vendor.deletedAt && "Vendor account has been soft-deleted",
        (vendor.locationStatus === "pending_review" && (!locState.trim() || !locCity.trim()))
        && "Location pending — enter a valid state and city",
        vendor.locationStatus === null && !vendor.address?.street
        && "No address at all — cannot approve",
    ].filter(Boolean) : [];

    const canApprove = blockingIssues.length === 0;

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleApprove = async () => {
        if (!canApprove) return;
        setIsActioning(true);
        setLocationHint("");
        try {
            const body = vendor.locationStatus === "pending_review"
                ? { state: locState.trim(), city: locCity.trim(), createLocation }
                : {};
            await adminApi.approveVendor(vendorId, body);
            toast.success(`Vendor approved! A confirmation email was sent to ${vendor.email}.`);
            router.push("/admin/vendors/pending");
        } catch (err) {
            const raw = err.message || "";
            if (raw.toLowerCase().includes("location") || raw.toLowerCase().includes("hint")) {
                setLocationHint("Location not found in database. Check the state/city spelling, or enable 'Create location' to add it.");
            } else {
                toast.error(raw || "Approval failed");
            }
        } finally {
            setIsActioning(false);
        }
    };

    const handleReject = async () => {
        setIsActioning(true);
        try {
            await adminApi.rejectVendor(vendorId, rejectModal.reason);
            toast.success(`Vendor rejected. A notification email was sent to ${vendor.email}.`);
            router.push("/admin/vendors/pending");
        } catch (err) {
            toast.error(err.message || "Rejection failed");
        } finally {
            setIsActioning(false);
            setRejectModal({ show: false, reason: "" });
        }
    };

    // ── Loading state ─────────────────────────────────────────────────────
    if (loading) return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center space-y-4">
                        <Loader2 size={48} className="text-orange-500 animate-spin mx-auto" />
                        <p className="font-black text-[10px] uppercase tracking-widest text-gray-400">Loading Vendor Profile...</p>
                    </div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );

    if (!vendor) return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <AlertCircle size={48} className="text-gray-300" />
                    <p className="font-semibold text-gray-500">Vendor not found.</p>
                    <button onClick={() => router.back()} className="text-orange-500 font-bold text-sm hover:underline">← Go back</button>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );

    const foods = vendor.foods || [];

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="max-w-5xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 transition-all active:scale-95"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <p className="text-[11px] font-black text-orange-500 uppercase tracking-widest mb-0.5">Pending Approval → Review</p>
                                <h1 className="text-3xl font-black text-gray-900">{vendor.storeName || "Unnamed Vendor"}</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 font-black text-xs uppercase tracking-widest rounded-xl border border-amber-100">
                                <Clock size={16} /> Pending Approval
                            </span>
                            {vendor.locationStatus === "pending_review" && (
                                <span className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-700 font-black text-xs uppercase tracking-widest rounded-xl border border-rose-100">
                                    <MapPin size={16} /> Location Pending
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Blocking Banner */}
                    {blockingIssues.length > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex gap-4">
                            <AlertCircle className="text-rose-500 mt-0.5 shrink-0" size={22} />
                            <div>
                                <p className="font-black text-sm text-rose-800 uppercase tracking-widest mb-2">Cannot Approve — Issues Found</p>
                                <ul className="space-y-1">
                                    {blockingIssues.map((issue, i) => (
                                        <li key={i} className="text-sm font-semibold text-rose-700 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />{issue}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-5">

                            {/* Section A — Identity */}
                            {vendor.suspended && (
                                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 font-semibold text-sm">
                                    <TriangleAlert size={18} className="shrink-0 text-amber-500" />
                                    ⚠ This vendor is currently <strong>suspended</strong>. Investigate before approving.
                                </div>
                            )}
                            {vendor.deletedAt && (
                                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 font-semibold text-sm">
                                    <XCircle size={18} className="shrink-0 text-rose-500" />
                                    ⛔ This vendor soft-deleted their account on {formatDate(vendor.deletedAt)}.
                                </div>
                            )}

                            <SectionCard icon={User} title="Identity & Contact" iconColor="text-blue-600" iconBg="bg-blue-100">
                                <FieldRow label="Owner Name" value={vendor.name} required />
                                <FieldRow label="Email Address" value={vendor.email} required />
                                <FieldRow label="Phone Number" value={vendor.phone} required />
                                <FieldRow label="Store Name" value={vendor.storeName} required />
                                <FieldRow label="Street Address" value={vendor.address?.street} required />
                            </SectionCard>

                            {/* Section B — Store Info */}
                            <SectionCard icon={Store} title="Store Information" iconColor="text-orange-600" iconBg="bg-orange-100">
                                {/* Logo */}
                                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-50">
                                    <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center text-gray-400 relative border border-gray-200 shrink-0">
                                        {vendor.logo
                                            ? <img src={vendor.logo} alt="" className="w-full h-full object-cover" />
                                            : <Store size={28} />
                                        }
                                        {!vendor.logo && (
                                            <div className="absolute bottom-0 right-0 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white">
                                                <TriangleAlert size={9} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        {!vendor.logo && <p className="text-xs font-bold text-amber-600 mb-1">⚠ No logo uploaded</p>}
                                        <p className="text-sm font-semibold text-gray-700 leading-relaxed">{vendor.storeDescription || <span className="italic text-gray-400">No description</span>}</p>
                                    </div>
                                </div>

                                <FieldRow label="Cuisine Types" value={vendor.cuisineTypes} />
                                <FieldRow label="Accepts Delivery" value={vendor.acceptsDelivery} />

                                {/* Delivery Mode — prominent badge */}
                                <div className="flex items-center justify-between py-3.5 border-b border-gray-50">
                                    <span className="text-sm font-semibold text-gray-700">Delivery Managed By</span>
                                    {vendor.deliveryManagedBy === "vendor"
                                        ? <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-100"><Utensils size={13} /> Vendor Manages Riders (Cash Pay)</span>
                                        : vendor.deliveryManagedBy === "admin"
                                            ? <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-xs font-black uppercase tracking-widest border border-purple-100"><Truck size={13} /> GrubDash Manages Riders (Wallet Pay)</span>
                                            : <span className="text-sm text-gray-400 italic font-medium">Not set</span>
                                    }
                                </div>

                                {/* Opening Hours */}
                                <div className="mt-4">
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Opening Hours</p>
                                    {vendor.openingHours && Object.keys(vendor.openingHours).length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {Object.entries(vendor.openingHours).map(([day, h]) => (
                                                <div key={day} className={`p-2.5 rounded-xl border text-xs ${h?.closed ? "bg-gray-50 border-gray-100 text-gray-400" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
                                                    <p className="font-black uppercase text-[9px] tracking-widest mb-0.5 capitalize">{day}</p>
                                                    {h?.closed ? "Closed" : <span className="font-bold">{h?.open} – {h?.close}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-amber-600 font-semibold flex items-center gap-2"><TriangleAlert size={15} /> Hours not configured</p>
                                    )}
                                </div>
                            </SectionCard>

                            {/* Section C — Location Resolution */}
                            <div className={`bg-white border rounded-3xl overflow-hidden ${vendor.locationStatus === "pending_review" ? "border-rose-200" : "border-gray-200"}`}>
                                <div className={`border-b px-6 py-4 flex items-center gap-3 ${vendor.locationStatus === "pending_review" ? "bg-rose-50 border-rose-100" : "bg-gray-50 border-gray-100"}`}>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${vendor.locationStatus === "pending_review" ? "bg-rose-100" : "bg-emerald-100"}`}>
                                        <MapPin className={vendor.locationStatus === "pending_review" ? "text-rose-600" : "text-emerald-600"} size={18} />
                                    </div>
                                    <h2 className="font-black text-gray-900 uppercase text-sm tracking-widest">Location Resolution</h2>
                                </div>
                                <div className="p-6">
                                    {vendor.locationStatus === "approved" && (
                                        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 font-semibold text-sm">
                                            <CircleCheck size={18} className="shrink-0" />
                                            ✅ Location verified — {[vendor.address?.city, vendor.address?.state].filter(Boolean).join(", ") || "Confirmed in database"}
                                        </div>
                                    )}

                                    {!vendor.locationStatus && !vendor.address?.street && (
                                        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 font-semibold text-sm">
                                            <XCircle size={18} className="shrink-0" />
                                            ❌ Vendor registered with no address. Cannot approve — reject and ask them to resubmit with a full address.
                                        </div>
                                    )}

                                    {!vendor.locationStatus && vendor.address?.street && (
                                        <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-600 font-semibold text-sm">
                                            <Info size={18} className="shrink-0" />
                                            Address on file: {vendor.address.street}. Location system did not flag any issues.
                                        </div>
                                    )}

                                    {vendor.locationStatus === "pending_review" && (
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm font-semibold">
                                                <TriangleAlert size={18} className="shrink-0 mt-0.5 text-amber-500" />
                                                <div>
                                                    ⚠ This vendor's location was not found in the GrubDash database. They requested: <strong>{vendor.requestedState}</strong> / <strong>{vendor.requestedCity}</strong>
                                                    <br />Review and confirm the correct location before approving.
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-1.5">State</label>
                                                    <input
                                                        value={locState}
                                                        onChange={e => setLocState(e.target.value)}
                                                        placeholder="e.g. Lagos"
                                                        className="w-full h-12 px-4 bg-white border border-amber-200 focus:border-amber-500 rounded-xl outline-none font-semibold text-sm transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-1.5">City</label>
                                                    <input
                                                        value={locCity}
                                                        onChange={e => setLocCity(e.target.value)}
                                                        placeholder="e.g. Ikeja"
                                                        className="w-full h-12 px-4 bg-white border border-amber-200 focus:border-amber-500 rounded-xl outline-none font-semibold text-sm transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <div
                                                    onClick={() => setCreateLocation(!createLocation)}
                                                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${createLocation ? "bg-amber-500 border-amber-500" : "border-gray-300 hover:border-amber-400"}`}
                                                >
                                                    {createLocation && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-800">Create this location in the database if it doesn't exist</p>
                                                    <p className="text-xs text-gray-500">Maps to <code className="bg-gray-100 px-1 rounded">createLocation: true</code> in the approve request</p>
                                                </div>
                                            </label>

                                            {locationHint && (
                                                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm font-semibold text-rose-700">
                                                    <Info size={16} className="shrink-0" /> {locationHint}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                <div className="bg-gray-50 rounded-xl p-3">
                                                    <span className="font-black text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Requested State</span>
                                                    <span className="font-bold text-sm text-gray-700">{vendor.requestedState || "—"}</span>
                                                </div>
                                                <div className="bg-gray-50 rounded-xl p-3">
                                                    <span className="font-black text-gray-400 uppercase tracking-widest text-[9px] block mb-1">Requested City</span>
                                                    <span className="font-bold text-sm text-gray-700">{vendor.requestedCity || "—"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section D — Foods (informational) */}
                            <SectionCard icon={Utensils} title="Menu Items" iconColor="text-slate-600" iconBg="bg-slate-100"
                                badge={<span className="px-3 py-1 bg-slate-100 text-slate-600 font-black text-xs rounded-lg uppercase tracking-widest">Informational</span>}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <p className="font-bold text-gray-700 text-sm">{foods.length} item{foods.length !== 1 ? "s" : ""} linked to this vendor</p>
                                    {foods.length > 0 && (
                                        <button
                                            onClick={() => setFoodsExpanded(!foodsExpanded)}
                                            className="flex items-center gap-1 text-xs font-black text-gray-400 hover:text-gray-700 transition-colors uppercase tracking-widest"
                                        >
                                            {foodsExpanded ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> Show all</>}
                                        </button>
                                    )}
                                </div>
                                {foods.length === 0 ? (
                                    <p className="text-sm text-gray-400 font-medium italic">No food items yet.</p>
                                ) : (
                                    <AnimatePresence>
                                        {foodsExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="space-y-2">
                                                    {foods.map(f => (
                                                        <div key={f._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                            <span className="text-sm font-semibold text-gray-800">{f.name}</span>
                                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${f.available || f.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                                                {f.available || f.isAvailable ? "Available" : "Unavailable"}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}
                            </SectionCard>
                        </div>

                        {/* Right — Status & Actions (sticky) */}
                        <div className="space-y-5">
                            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden sticky top-20">
                                <div className="bg-gray-50 border-b border-gray-100 px-6 py-4">
                                    <h2 className="font-black text-gray-900 uppercase text-sm tracking-widest">Account Status</h2>
                                </div>
                                <div className="p-6 space-y-3">
                                    {[
                                        { label: "Verified", ok: vendor.verified, val: vendor.verified ? "Yes" : "No" },
                                        { label: "Active", ok: vendor.active, val: vendor.active ? "Yes" : "No" },
                                        { label: "Suspended", ok: !vendor.suspended, val: vendor.suspended ? "⚠ Yes" : "No" },
                                        { label: "Deleted", ok: !vendor.deletedAt, val: vendor.deletedAt ? "⛔ Yes" : "No" },
                                    ].map(item => (
                                        <div key={item.label} className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-gray-600">{item.label}</span>
                                            <span className={`text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${item.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                                {item.val}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                                        <span className="text-sm font-semibold text-gray-600">Registered</span>
                                        <span className="text-sm font-bold text-gray-900">{formatDate(vendor.createdAt)}</span>
                                    </div>
                                </div>

                                <div className="px-6 pb-6 space-y-3">
                                    <button
                                        disabled={!canApprove || isActioning}
                                        onClick={handleApprove}
                                        title={!canApprove ? blockingIssues[0] : "Approve vendor"}
                                        className={`w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${canApprove
                                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            }`}
                                    >
                                        {isActioning ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                                        Approve Vendor
                                    </button>
                                    <button
                                        disabled={isActioning}
                                        onClick={() => setRejectModal({ show: true, reason: "" })}
                                        className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100"
                                    >
                                        <XCircle size={20} /> Reject Vendor
                                    </button>
                                </div>
                            </div>

                            {/* Payout */}
                            <SectionCard icon={Banknote} title="Payout" iconColor="text-green-600" iconBg="bg-green-100"
                                badge={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Informational</span>}
                            >
                                <FieldRow label="Bank Name" value={vendor.payoutDetails?.bankName} />
                                <FieldRow label="Account No." value={vendor.payoutDetails?.accountNumber} />
                                <FieldRow label="Payout Enabled" value={vendor.payoutDetails?.payoutEnabled} />
                            </SectionCard>
                        </div>
                    </div>
                </div>

                {/* Reject Modal */}
                <AnimatePresence>
                    {rejectModal.show && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => !isActioning && setRejectModal({ show: false, reason: "" })}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-md bg-white rounded-[40px] overflow-hidden"
                            >
                                <div className="p-10">
                                    <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                                        <XCircle className="text-rose-500" size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase text-center mb-2 tracking-tight">Reject Vendor</h3>
                                    <p className="text-gray-500 font-medium text-center mb-6 text-sm leading-relaxed">
                                        State the reason for rejecting <strong>{vendor.storeName}</strong>. This will be emailed to the vendor.
                                    </p>
                                    <textarea
                                        autoFocus
                                        value={rejectModal.reason}
                                        onChange={e => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                                        placeholder="e.g. Invalid documents, location outside service area..."
                                        className="w-full min-h-[100px] p-5 bg-gray-50 border border-transparent focus:border-rose-400 focus:bg-white rounded-3xl outline-none font-semibold resize-none text-sm mb-6 transition-all"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            disabled={isActioning}
                                            onClick={() => setRejectModal({ show: false, reason: "" })}
                                            className="h-14 rounded-3xl bg-gray-100 text-gray-500 font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={isActioning}
                                            onClick={handleReject}
                                            className="h-14 rounded-3xl bg-rose-500 text-white font-black text-sm uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isActioning ? <Loader2 size={20} className="animate-spin" /> : "Confirm Reject"}
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
