"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Users,
    Search,
    ShieldCheck,
    Ban,
    RefreshCcw,
    Mail,
    Phone,
    Wallet,
    ShoppingBag,
    Loader2,
    X,
    AlertCircle,
    UserCheck,
    MoreVertical,
    Activity,
    UserMinus,
    ChevronRight,
    Filter,
    MapPin,
    ExternalLink,
    Lock,
    Unlock,
    Trash2,
    ChevronDown,
    Eye
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";

// ─── Shared Components ────────────────────────────────────────────────────────

const StatTile = ({ icon: Icon, label, value, bg, text, loading }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:border-orange-200 hover:shadow-sm transition-all group">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg} ${text} bg-opacity-30 group-hover:bg-opacity-50 transition-colors`}>
            <Icon size={18} />
        </div>
        <div className="min-w-0">
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1 truncate">{label}</p>
            {loading ? (
                <div className="h-5 w-16 bg-slate-100 animate-pulse rounded" />
            ) : (
                <p className="text-lg font-extrabold text-slate-900 leading-none">{value?.toLocaleString() || 0}</p>
            )}
        </div>
    </div>
);

const Badge = ({ children, variant = "default" }) => {
    const variants = {
        default: "bg-slate-50 text-slate-600 border-slate-200",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        danger: "bg-rose-50 text-rose-700 border-rose-200",
        info: "bg-blue-50 text-blue-700 border-blue-200",
        dark: "bg-slate-900 text-white border-slate-800"
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold border uppercase tracking-widest ${variants[variant]}`}>
            {children}
        </span>
    );
};

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

const ActionLink = ({ icon: Icon, label, onClick, variant = "default" }) => {
    const variants = {
        default: "text-slate-600 hover:bg-slate-50",
        success: "text-emerald-600 hover:bg-emerald-50",
        warning: "text-amber-600 hover:bg-amber-50",
        danger: "text-rose-600 hover:bg-rose-50"
    };

    return (
        <button onClick={onClick} className={`w-full px-3 py-2.5 flex items-center gap-2.5 rounded-lg text-xs font-bold tracking-tight transition-all border border-transparent hover:border-slate-100 uppercase tracking-widest text-[10px] ${variants[variant]}`}>
            <Icon size={14} /> <span>{label}</span>
        </button>
    );
};

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [signupTrend, setSignupTrend] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState({
        verified: "",
        suspended: "",
        banned: ""
    });

    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const [actionModal, setActionModal] = useState({
        show: false,
        type: "",
        user: null,
        reason: "",
        loading: false
    });

    const [actionsModal, setActionsModal] = useState({
        show: false,
        user: null
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const cleanFilter = Object.entries(filter).reduce((acc, [key, value]) => {
                if (value !== "") acc[key] = value;
                return acc;
            }, {});

            const [usersData, statsData, metricsData] = await Promise.all([
                adminApi.getAllUsers({ ...cleanFilter, search }),
                adminApi.getUserStats(),
                adminApi.getUserMetrics()
            ]);

            const sortedUsers = (usersData.users || []).sort((a, b) =>
                (a.fullName || "").localeCompare(b.fullName || "")
            );

            setUsers(sortedUsers);
            setStats(statsData.stats);
            setSignupTrend(metricsData.signupTrend || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Sync failed");
        } finally {
            setLoading(false);
        }
    }, [filter, search]);

    useEffect(() => {
        const timeout = setTimeout(fetchData, 400);
        return () => clearTimeout(timeout);
    }, [fetchData]);

    const handleViewDetails = async (user) => {
        setSelectedUser(user);
        setShowModal(true);
        setDetailsLoading(true);
        try {
            const data = await adminApi.getUserById(user._id);
            setUserDetails(data.user);
        } catch (error) {
            toast.error("Failed to load user details");
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleActionClick = (user, type) => {
        setActionModal({
            show: true,
            type,
            user,
            reason: "",
            loading: false
        });
    };

    const handleConfirmAction = async () => {
        const { type, user, reason } = actionModal;
        if ((type === 'suspend' || type === 'ban') && !reason.trim()) {
            toast.error("Reason required");
            return;
        }

        setActionModal(prev => ({ ...prev, loading: true }));
        try {
            if (type === "suspend") await adminApi.suspendUser(user._id, reason);
            else if (type === "ban") await adminApi.banUser(user._id, reason);
            else if (type === "reactivate") await adminApi.reactivateUser(user._id);

            toast.success(`User ${type === 'reactivate' ? 'restored' : type + 'ed'}`);
            setActionModal({ show: false, type: "", user: null, reason: "", loading: false });
            fetchData();
        } catch (error) {
            toast.error(error.message || `Action failed`);
            setActionModal(prev => ({ ...prev, loading: false }));
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
                                    <Users size={17} className="text-white" />
                                </div>
                                <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                                    User Directory
                                </h1>
                                <span className="hidden md:inline text-[9px] font-extrabold px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-200 uppercase tracking-widest">
                                    {users.length} Records
                                </span>
                            </div>
                            <div className="flex items-center gap-2 ml-12">
                                <div className="h-0.5 w-8 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" />
                                <p className="text-xs text-slate-500 font-medium leading-snug">
                                    Audit customer accounts, manage platform access, and review detailed intel.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:border-orange-200 hover:text-orange-600 transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50 shadow-sm"
                            >
                                <RefreshCcw size={14} className={loading ? "animate-spin text-orange-500" : ""} />
                                Refresh Intel
                            </button>
                        </div>
                    </div>

                    {/* ── ANALYTICS TREND ───────────────────────────────────── */}
                    <AnimatePresence>
                        {signupTrend.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                            >
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <Activity size={15} className="text-orange-500" /> User Growth Velocity
                                    </h3>
                                    <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-orange-200">
                                        Last 7 Days
                                    </span>
                                </div>
                                <div className="p-4 h-[180px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={signupTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f48525" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#f48525" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} allowDecimals={false} />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                                labelStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}
                                            />
                                            <Area type="monotone" dataKey="signups" name="New Users" stroke="#f48525" strokeWidth={3} fillOpacity={1} fill="url(#colorSignups)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── STAT TILES ────────────────────────────────────────── */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        <StatTile icon={Users} label="Total Reach" value={stats?.totalUsers} bg="bg-blue-100" text="text-blue-600" loading={loading} />
                        <StatTile icon={UserCheck} label="ID Verified" value={stats?.verifiedUsers} bg="bg-emerald-100" text="text-emerald-600" loading={loading} />
                        <StatTile icon={UserMinus} label="Pending Sync" value={(stats?.totalUsers || 0) - (stats?.verifiedUsers || 0)} bg="bg-orange-100" text="text-orange-600" loading={loading} />
                        <StatTile icon={AlertCircle} label="Restricted" value={stats?.suspendedUsers} bg="bg-amber-100" text="text-amber-600" loading={loading} />
                        <StatTile icon={Ban} label="Banned" value={stats?.bannedUsers} bg="bg-rose-100" text="text-rose-600" loading={loading} />
                    </div>

                    {/* ── TOOLBAR (Search & Filters) ───────────────────────── */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col lg:flex-row gap-3 shadow-sm">
                        <div className="flex-1 relative group w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Search by name, email or ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all text-slate-800"
                            />
                        </div>
                        <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                            <div className="relative flex-1 md:flex-none">
                                <select
                                    value={filter.suspended}
                                    onChange={(e) => setFilter({ ...filter, suspended: e.target.value })}
                                    className="w-full h-10 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-extrabold uppercase tracking-wider outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 appearance-none cursor-pointer text-slate-600 min-w-[140px]"
                                >
                                    <option value="">Status: All</option>
                                    <option value="false">Active Only</option>
                                    <option value="true">Suspended</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            <div className="relative flex-1 md:flex-none">
                                <select
                                    value={filter.verified}
                                    onChange={(e) => setFilter({ ...filter, verified: e.target.value })}
                                    className="w-full h-10 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-extrabold uppercase tracking-wider outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 appearance-none cursor-pointer text-slate-600 min-w-[140px]"
                                >
                                    <option value="">Verify: All</option>
                                    <option value="true">Verified Only</option>
                                    <option value="false">Unverified</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            
                            <AnimatePresence>
                                {(search || filter.verified || filter.suspended) && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onClick={() => { setSearch(""); setFilter({ verified: "", suspended: "", banned: "" }); }}
                                        className="h-10 px-4 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-extrabold tracking-widest text-[10px] uppercase transition-colors border border-rose-200 flex items-center gap-1.5"
                                    >
                                        <X size={14} /> Clear
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* ── USER TABLE ────────────────────────────────────────── */}
                    <TableCard>
                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    <Th>Account Identifier</Th>
                                    <Th>Financials</Th>
                                    <Th center>Verification</Th>
                                    <Th center>Platform Access</Th>
                                    <Th right>Actions</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    /* Skeleton rows */
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-md w-3/4" /></td>
                                            <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-md w-1/2" /></td>
                                            <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-md w-12 mx-auto" /></td>
                                            <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-md w-24 mx-auto" /></td>
                                            <td className="px-4 py-3 flex justify-end"><div className="h-6 w-16 bg-slate-100 rounded-md" /></td>
                                        </tr>
                                    ))
                                ) : users.length > 0 ? (
                                    users.map((user) => (
                                        <tr key={user._id} className="hover:bg-orange-50/40 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden group-hover:border-orange-300 transition-colors relative">
                                                        {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <Users size={16} className="text-slate-300 group-hover:text-orange-400" />}
                                                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${user.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-extrabold text-sm text-slate-900 leading-tight truncate px-0 group-hover:text-orange-600 transition-colors">{user.fullName}</p>
                                                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className={`text-xs font-extrabold ${user.wallet?.balance > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                        ₦{(user.wallet?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                                        {user.totalOrderCount || 0} Orders
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant={user.isVerified ? "success" : "warning"}>
                                                    {user.isVerified ? "Verified" : "Unverified"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {user.banned ? <Badge variant="dark">Banned</Badge> :
                                                    user.suspended ? <Badge variant="danger">Restricted</Badge> :
                                                        <Badge variant="info">Active Access</Badge>}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleViewDetails(user)}
                                                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                                        title="User Intel"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setActionsModal({ show: true, user })}
                                                        className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors border border-transparent"
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
                                                <UserMinus size={32} className="text-slate-300" />
                                            </div>
                                            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide mb-1">No Records Found</h3>
                                            <p className="text-xs text-slate-500 font-medium tracking-tight">Sync another search or adjust filters.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </TableCard>
                </div>

                {/* ── DETAILS MODAL ────────────────────────────────────── */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl">
                                
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-sm shadow-orange-200 shrink-0">
                                            <Activity size={16} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider leading-none">User Intelligence Hub</h2>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 tracking-wider">ID: {selectedUser?._id}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="p-5 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6">
                                    {detailsLoading ? (
                                        <div className="py-24 text-center flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-orange-500" size={32} />
                                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Updating Intel Registry…</span>
                                        </div>
                                    ) : userDetails ? (
                                        <div className="space-y-6">
                                            {/* Profile Header Block */}
                                            <div className="flex flex-col md:flex-row gap-5 items-start bg-slate-50 p-5 rounded-2xl border border-slate-100 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/20 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                                                <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden shrink-0 border border-slate-200 p-1 relative z-10">
                                                    {userDetails.avatar ? <img src={userDetails.avatar} alt="" className="w-full h-full object-cover rounded-xl" /> : <Users size={32} className="m-auto mt-6 text-slate-200" />}
                                                </div>
                                                <div className="flex-1 space-y-1 relative z-10">
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        <Badge variant={userDetails.isVerified ? "success" : "warning"}>{userDetails.isVerified ? "Verified Identity" : "Pending Verification"}</Badge>
                                                        <Badge variant="dark">{userDetails.role}</Badge>
                                                    </div>
                                                    <h3 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight leading-none">{userDetails.fullName}</h3>
                                                    <div className="space-y-1.5 mt-3">
                                                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                                                            <div className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center"><Mail size={12} className="text-slate-400" /></div>
                                                            {userDetails.email}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                                                            <div className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center"><Phone size={12} className="text-slate-400" /></div>
                                                            {userDetails.phone || "No direct phone registry"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Financial Overview */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-[0.2em] pl-1">Financial Snapshot</h4>
                                                    <div className="flex-1 h-px bg-slate-100" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-white md:col-span-1 relative overflow-hidden group">
                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-orange-500/20 transition-colors" />
                                                        <div className="flex items-center justify-between mb-5 relative z-10">
                                                            <Wallet size={18} className="text-orange-400" />
                                                            <span className="text-[9px] font-extrabold bg-white/10 text-white/80 px-2 py-0.5 rounded-full uppercase tracking-widest border border-white/5">Primary Wallet</span>
                                                        </div>
                                                        <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-widest">Available Credit</p>
                                                        <p className="text-2xl font-extrabold mt-1 tracking-tight">₦{(userDetails.wallet?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })}</p>
                                                    </div>
                                                    <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-center gap-1 group hover:border-orange-200 transition-colors shadow-sm">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-1 group-hover:bg-blue-100 transition-colors"><ShoppingBag size={15} className="text-blue-500" /></div>
                                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Transaction History</p>
                                                        <p className="text-xl font-extrabold text-slate-900 leading-none">{userDetails.totalOrderCount || 0} Successful Order(s)</p>
                                                    </div>
                                                    <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-center gap-1 group hover:border-orange-200 transition-colors shadow-sm">
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-1 group-hover:bg-emerald-100 transition-colors"><Activity size={15} className="text-emerald-500" /></div>
                                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Platform Integrity</p>
                                                        <p className="text-xl font-extrabold text-slate-900 leading-none uppercase tracking-tight">{userDetails.banned ? 'Banned' : userDetails.suspended ? 'Restricted' : 'Verified Access'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Transaction History Table */}
                                            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                                    <p className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest">Recent Wallet Flux</p>
                                                    <div className="h-1 w-8 bg-slate-200 rounded-full" />
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left">
                                                        <thead>
                                                            <tr className="border-b border-slate-50 bg-white">
                                                                <th className="px-5 py-2.5 text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Timeline</th>
                                                                <th className="px-5 py-2.5 text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Context</th>
                                                                <th className="px-5 py-2.5 text-[9px] font-extrabold uppercase text-slate-400 tracking-wider text-right">Value Delta</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {userDetails.wallet?.transactions?.length > 0 ? (
                                                                [...userDetails.wallet.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0, 5).map((tx, idx) => (
                                                                    <tr key={idx} className="text-xs group hover:bg-slate-50/50">
                                                                        <td className="px-5 py-3">
                                                                            <p className="font-extrabold text-slate-800 uppercase tracking-tighter">{new Date(tx.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</p>
                                                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>• {tx.type}</span>
                                                                        </td>
                                                                        <td className="px-5 py-3 text-slate-500 font-bold uppercase tracking-tight text-[10px] truncate max-w-[180px]">{tx.description}</td>
                                                                        <td className={`px-5 py-3 text-right font-extrabold text-sm tracking-tight ${tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                            {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr><td colSpan="3" className="py-12 text-center text-[10px] text-slate-400 font-extrabold uppercase tracking-widest opacity-50">No activity recorded</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Address Blocks */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-[0.2em] pl-1">Operational Locations</h4>
                                                    <div className="flex-1 h-px bg-slate-100" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {userDetails.addresses?.length > 0 ? userDetails.addresses.map((addr, idx) => (
                                                        <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-4 group hover:border-orange-200 transition-colors">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                                                                <MapPin size={16} />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <p className="text-[11px] font-extrabold text-slate-900 truncate uppercase tracking-widest">{addr.label}</p>
                                                                    {addr.isDefault && <span className="text-[8px] font-extrabold bg-slate-900 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter shrink-0 border border-slate-800 shadow-sm">Primary Hub</span>}
                                                                </div>
                                                                <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{addr.addressLine}</p>
                                                            </div>
                                                        </div>
                                                    )) : <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest opacity-50 italic py-4">No locations mapped yet.</p>}
                                                </div>
                                            </div>

                                            {/* Alert Area */}
                                            {(userDetails.suspended || userDetails.banned) && (
                                                <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100 flex gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-rose-100"><Ban size={20} className="text-rose-500" /></div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-extrabold text-rose-900 uppercase tracking-widest mb-1.5">System Lock Active: {userDetails.banned ? 'Permanent Blacklist' : 'Operational Suspension'}</p>
                                                        <p className="text-xs text-rose-600 font-bold leading-relaxed">{userDetails.banReason || userDetails.suspensionReason || 'No technical reason provided.'}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                                    <button onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-[10px] font-extrabold uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Dismiss Portal</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── ACTION CONFIRMATION MODAL ─────────────────────────── */}
                <AnimatePresence>
                    {actionModal.show && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => !actionModal.loading && setActionModal({ ...actionModal, show: false })}
                                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl p-6"
                            >
                                <div className="text-center space-y-5">
                                    <div className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center border shadow-lg ${actionModal.type === 'ban' ? 'bg-rose-50 border-rose-100 text-rose-500 shadow-rose-100' :
                                        actionModal.type === 'suspend' ? 'bg-amber-50 border-amber-100 text-amber-500 shadow-amber-100' :
                                            'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-emerald-50'
                                        }`}>
                                        {actionModal.type === 'ban' ? <Ban size={28} /> :
                                            actionModal.type === 'suspend' ? <AlertCircle size={28} /> :
                                                <RefreshCcw size={28} />}
                                    </div>
                                    <div className="px-4">
                                        <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">
                                            {actionModal.type === 'ban' ? 'System Blacklist' :
                                                actionModal.type === 'suspend' ? 'Account Suspension' :
                                                    'Access Restoration'}
                                        </h3>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1.5 opacity-60">
                                            Target: {actionModal.user?.fullName}
                                        </p>
                                        <p className="text-slate-500 text-xs font-medium mt-2 leading-relaxed">
                                            {actionModal.type === 'reactivate' 
                                                ? `Verify restoration of platform privileges and wallet access for this identity.` 
                                                : `Strict disciplinary action will override current account accessibility. System logs will record this mandate.`}
                                        </p>
                                    </div>

                                    {(actionModal.type === 'ban' || actionModal.type === 'suspend') && (
                                        <div className="text-left space-y-2 px-1">
                                            <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-widest pl-1">Formal Reason for Mandate</label>
                                            <textarea
                                                autoFocus
                                                value={actionModal.reason}
                                                onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                                                placeholder="Provide technical justification…"
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all resize-none h-32 shadow-inner"
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-3 px-1">
                                        <button disabled={actionModal.loading} onClick={() => setActionModal({ ...actionModal, show: false })}
                                            className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-extrabold uppercase tracking-[0.15em] rounded-2xl hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                                        <button disabled={actionModal.loading} onClick={handleConfirmAction}
                                            className={`flex-1 py-3.5 text-white text-[11px] font-extrabold uppercase tracking-[0.15em] rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${actionModal.type === 'ban' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : actionModal.type === 'suspend' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-slate-900 hover:bg-black shadow-slate-200'}`}>
                                            {actionModal.loading ? <Loader2 className="animate-spin" size={16} /> : 'Proceed with Action'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ── QUICK ACTION ITEM SELECTOR ───────────────────────── */}
                <AnimatePresence>
                    {actionsModal.show && (
                        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setActionsModal({ show: false, user: null })} className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" />
                            <motion.div initial={{ opacity: 0, scale: 0.96, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 5 }}
                                className="relative w-full max-w-[260px] bg-white rounded-2xl shadow-2xl overflow-hidden p-2 border border-slate-200">
                                <div className="px-4 py-3 border-b border-slate-50 mb-1 flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Active Selector</p>
                                        <p className="text-xs font-extrabold text-slate-800 truncate">{actionsModal.user?.fullName}</p>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${actionsModal.user?.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                </div>
                                <div className="space-y-1 mt-1">
                                    <ActionLink icon={Activity} label="Intel Hub" onClick={() => { handleViewDetails(actionsModal.user); setActionsModal({ show: false, user: null }); }} />
                                    <div className="h-px bg-slate-50 mx-2" />
                                    {actionsModal.user?.suspended || actionsModal.user?.banned ? (
                                        <ActionLink icon={Unlock} variant="success" label="Restore Access" onClick={() => { handleActionClick(actionsModal.user, 'reactivate'); setActionsModal({ show: false, user: null }); }} />
                                    ) : (
                                        <>
                                            <ActionLink icon={Lock} variant="warning" label="Restrict Portal" onClick={() => { handleActionClick(actionsModal.user, 'suspend'); setActionsModal({ show: false, user: null }); }} />
                                            <ActionLink icon={Ban} variant="danger" label="Blacklist User" onClick={() => { handleActionClick(actionsModal.user, 'ban'); setActionsModal({ show: false, user: null }); }} />
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}

