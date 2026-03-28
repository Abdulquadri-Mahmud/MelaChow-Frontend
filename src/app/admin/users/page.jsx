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
    Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";

const StatTile = ({ icon: Icon, label, value, colorClass, loading }) => (
    <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3">
        <div className={`w-9 h-9 rounded flex items-center justify-center ${colorClass} bg-opacity-10 text-${colorClass.replace('bg-', '')}`}>
            <Icon size={18} />
        </div>
        <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
            {loading ? (
                <div className="h-5 w-16 bg-slate-100 animate-pulse rounded" />
            ) : (
                <p className="text-lg font-bold text-slate-900 leading-none">{value?.toLocaleString() || 0}</p>
            )}
        </div>
    </div>
);

const Badge = ({ children, variant = "default" }) => {
    const variants = {
        default: "bg-slate-100 text-slate-600 border-slate-200",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        danger: "bg-rose-50 text-rose-700 border-rose-200",
        info: "bg-blue-50 text-blue-700 border-blue-200",
        dark: "bg-slate-900 text-white border-slate-800"
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${variants[variant]}`}>
            {children}
        </span>
    );
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
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

            const [usersData, statsData] = await Promise.all([
                adminApi.getAllUsers({ ...cleanFilter, search }),
                adminApi.getUserStats()
            ]);

            const sortedUsers = (usersData.users || []).sort((a, b) =>
                (a.fullName || "").localeCompare(b.fullName || "")
            );

            setUsers(sortedUsers);
            setStats(statsData.stats);
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
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">User Directory</h1>
                            <div className="h-0.5 w-6 bg-orange-500 rounded-full mt-1" />
                            <p className="text-sm text-slate-500 mt-1.5 font-medium">Manage platform accounts, check balances, and adjust access status.</p>
                        </div>
                        <button
                            onClick={fetchData}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                        >
                            <RefreshCcw size={15} className={loading ? "animate-spin" : ""} />
                            Sync Data
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <StatTile icon={Users} label="Total Users" value={stats?.totalUsers} colorClass="bg-blue-500" loading={loading} />
                        <StatTile icon={UserCheck} label="Verified" value={stats?.verifiedUsers} colorClass="bg-emerald-500" loading={loading} />
                        <StatTile icon={UserMinus} label="Pending" value={(stats?.totalUsers || 0) - (stats?.verifiedUsers || 0)} colorClass="bg-orange-500" loading={loading} />
                        <StatTile icon={AlertCircle} label="Suspended" value={stats?.suspendedUsers} colorClass="bg-amber-500" loading={loading} />
                        <StatTile icon={Ban} label="Banned" value={stats?.bannedUsers} colorClass="bg-rose-500" loading={loading} />
                    </div>

                    {/* Toolbar */}
                    <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col lg:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input
                                type="text"
                                placeholder="Search by name, email or ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-md outline-none text-sm focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md h-9 px-1">
                                <span className="px-2 text-[10px] font-bold text-slate-400 uppercase border-r border-slate-200">
                                    <Filter size={10} className="inline mr-1" /> Filters
                                </span>
                                <select
                                    value={filter.suspended}
                                    onChange={(e) => setFilter({ ...filter, suspended: e.target.value })}
                                    className="bg-transparent text-xs font-semibold px-2 outline-none h-full cursor-pointer text-slate-700 hover:text-slate-900"
                                >
                                    <option value="">Status: All</option>
                                    <option value="false">Active Only</option>
                                    <option value="true">Suspended</option>
                                </select>
                                <select
                                    value={filter.verified}
                                    onChange={(e) => setFilter({ ...filter, verified: e.target.value })}
                                    className="bg-transparent text-xs font-semibold px-2 outline-none h-full cursor-pointer text-slate-700 hover:text-slate-900 border-l border-slate-200"
                                >
                                    <option value="">Verify: All</option>
                                    <option value="true">Verified Only</option>
                                    <option value="false">Unverified</option>
                                </select>
                            </div>
                            {(search || filter.verified || filter.suspended) && (
                                <button
                                    onClick={() => { setSearch(""); setFilter({ verified: "", suspended: "", banned: "" }); }}
                                    className="h-9 px-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md text-xs font-bold transition-all border border-transparent hover:border-rose-100 flex items-center gap-1.5"
                                >
                                    <X size={14} /> Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* User Table */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">User</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Financials</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider text-center">Verified</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider text-center">Status</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="py-16 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="animate-spin text-slate-400" size={24} />
                                                    <p className="text-xs text-slate-400 font-medium">Syncing directory...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : users.length > 0 ? (
                                        users.map((user) => (
                                            <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200 relative">
                                                            {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <Users size={16} />}
                                                            <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${user.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-sm text-slate-900 leading-tight truncate px-0">{user.fullName}</p>
                                                            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className={`text-xs font-bold ${user.wallet?.balance > 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                                                            ₦{(user.wallet?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {user.totalOrderCount || 0} Successful Order(s)
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
                                                        user.suspended ? <Badge variant="danger">Suspended</Badge> :
                                                            <Badge variant="info">Active</Badge>}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => setActionsModal({ show: true, user })}
                                                        className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 rounded-md transition-colors"
                                                    >
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-20 text-center">
                                                <div className="flex flex-col items-center opacity-30">
                                                    <UserMinus size={40} className="text-slate-400 mb-2" />
                                                    <p className="text-sm font-bold text-slate-500">No users found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Details Modal */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                className="relative w-full max-w-2xl bg-white rounded-xl overflow-hidden border border-slate-200">
                                
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white">
                                            <Activity size={16} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-slate-900 leading-none">User Intelligence</h2>
                                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">ID: {selectedUser?._id}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="p-5 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6">
                                    {detailsLoading ? (
                                        <div className="py-16 text-center flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-slate-400" size={32} />
                                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Fetching details...</span>
                                        </div>
                                    ) : userDetails ? (
                                        <div className="space-y-6">
                                            {/* Profile Header Block */}
                                            <div className="flex flex-col md:flex-row gap-5 items-start bg-slate-50 p-4 rounded-lg border border-slate-200">
                                                <div className="w-24 h-24 bg-white rounded-lg overflow-hidden shrink-0 border border-slate-200 p-1">
                                                    {userDetails.avatar ? <img src={userDetails.avatar} alt="" className="w-full h-full object-cover rounded" /> : <Users size={32} className="m-auto mt-6 text-slate-200" />}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex flex-wrap gap-2 mb-1">
                                                        <Badge variant={userDetails.isVerified ? "info" : "warning"}>{userDetails.isVerified ? "ID Verified" : "Unverified"}</Badge>
                                                        <Badge>{userDetails.role}</Badge>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-900">{userDetails.fullName}</h3>
                                                    <div className="space-y-1 mt-2">
                                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                                            <Mail size={14} className="text-slate-400" /> {userDetails.email}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                                            <Phone size={14} className="text-slate-400" /> {userDetails.phone || "No phone added"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Financial Overview */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Financial Snapshot</h4>
                                                    <div className="flex-1 h-[1px] bg-slate-100" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div className="bg-slate-900 p-4 rounded-lg text-white md:col-span-1">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <Wallet size={16} className="text-slate-400" />
                                                            <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded">Wallet</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Available Balance</p>
                                                        <p className="text-xl font-bold mt-0.5">₦{(userDetails.wallet?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                    </div>
                                                    <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col justify-center">
                                                        <ShoppingBag size={16} className="text-blue-500 mb-2" />
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Orders</p>
                                                        <p className="text-lg font-bold text-slate-900">{userDetails.totalOrderCount || 0}</p>
                                                    </div>
                                                    <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col justify-center">
                                                        <Activity size={16} className="text-emerald-500 mb-2" />
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Platform Status</p>
                                                        <p className="text-lg font-bold text-slate-900">{userDetails.banned ? 'Banned' : userDetails.suspended ? 'Suspended' : 'Active'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Transaction History Table */}
                                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
                                                    <p className="text-[10px] font-bold uppercase text-slate-500">Recent Transactions</p>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left">
                                                        <thead>
                                                            <tr className="border-b border-slate-100 bg-white">
                                                                <th className="px-4 py-2 text-[10px] font-bold uppercase text-slate-400">Date/Type</th>
                                                                <th className="px-4 py-2 text-[10px] font-bold uppercase text-slate-400">Desc</th>
                                                                <th className="px-4 py-2 text-[10px] font-bold uppercase text-slate-400 text-right">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {userDetails.wallet?.transactions?.length > 0 ? (
                                                                [...userDetails.wallet.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).map((tx, idx) => (
                                                                    <tr key={idx} className="text-xs">
                                                                        <td className="px-4 py-2">
                                                                            <p className="font-semibold text-slate-700">{new Date(tx.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</p>
                                                                            <span className={`text-[9px] font-bold uppercase ${tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>{tx.type}</span>
                                                                        </td>
                                                                        <td className="px-4 py-2 text-slate-500 font-medium truncate max-w-[150px]">{tx.description}</td>
                                                                        <td className={`px-4 py-2 text-right font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                            {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr><td colSpan="3" className="py-8 text-center text-[10px] text-slate-400 font-bold uppercase">No records found</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Address Blocks */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Saved Locations</h4>
                                                    <div className="flex-1 h-[1px] bg-slate-100" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {userDetails.addresses?.length > 0 ? userDetails.addresses.map((addr, idx) => (
                                                        <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                                                                <MapPin size={14} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-slate-900 truncate">{addr.label} {addr.isDefault && <span className="ml-1 text-[8px] bg-slate-900 text-white px-1.5 py-0.5 rounded uppercase">Main</span>}</p>
                                                                <p className="text-[11px] text-slate-500 truncate">{addr.addressLine}</p>
                                                            </div>
                                                        </div>
                                                    )) : <p className="text-xs text-slate-400 italic">No addresses registered.</p>}
                                                </div>
                                            </div>

                                            {/* Ban/Suspension Reason Alerts */}
                                            {(userDetails.suspended || userDetails.banned) && (
                                                <div className="p-4 bg-rose-50 rounded-lg border border-rose-100 flex gap-3">
                                                    <Ban size={18} className="text-rose-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs font-bold text-rose-900">Restriction Active: {userDetails.banned ? 'Permanent Ban' : 'Account Suspension'}</p>
                                                        <p className="text-xs text-rose-600 mt-1 font-medium">{userDetails.banReason || userDetails.suspensionReason || 'No reason provided.'}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Final Confirmation Modal (Ban/Suspend) */}
                <AnimatePresence>
                    {actionModal.show && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => !actionModal.loading && setActionModal({ ...actionModal, show: false })}
                                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                className="relative w-full max-w-sm bg-white rounded-xl overflow-hidden border border-slate-200 p-6"
                            >
                                <div className="text-center space-y-4">
                                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center border ${actionModal.type === 'ban' ? 'bg-rose-50 border-rose-100 text-rose-500' :
                                        actionModal.type === 'suspend' ? 'bg-amber-50 border-amber-100 text-amber-500' :
                                            'bg-emerald-50 border-emerald-100 text-emerald-500'
                                        }`}>
                                        {actionModal.type === 'ban' ? <Ban size={22} /> :
                                            actionModal.type === 'suspend' ? <AlertCircle size={22} /> :
                                                <RefreshCcw size={22} />}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">
                                            {actionModal.type === 'ban' ? 'Permanent Ban' :
                                                actionModal.type === 'suspend' ? 'Suspend Access' :
                                                    'Reactivate User'}
                                        </h3>
                                        <p className="text-slate-500 text-sm mt-1">
                                            {actionModal.type === 'reactivate' 
                                                ? `Restore platform access for ${actionModal.user?.fullName}?` 
                                                : `Strict action against ${actionModal.user?.fullName}.`}
                                        </p>
                                    </div>

                                    {(actionModal.type === 'ban' || actionModal.type === 'suspend') && (
                                        <div className="text-left space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Reason required</label>
                                            <textarea
                                                value={actionModal.reason}
                                                onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                                                placeholder="Enter reason for restriction..."
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-medium focus:ring-1 focus:ring-slate-900 transition-all resize-none h-20"
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-2">
                                        <button disabled={actionModal.loading} onClick={() => setActionModal({ ...actionModal, show: false })}
                                            className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                                        <button disabled={actionModal.loading} onClick={handleConfirmAction}
                                            className={`flex-1 py-2 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 ${actionModal.type === 'ban' ? 'bg-rose-600 hover:bg-rose-700' : actionModal.type === 'suspend' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                            {actionModal.loading ? <Loader2 className="animate-spin" size={14} /> : 'Proceed'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Quick Action Item Selector */}
                <AnimatePresence>
                    {actionsModal.show && (
                        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setActionsModal({ show: false, user: null })} className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" />
                            <motion.div initial={{ opacity: 0, scale: 0.98, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 5 }}
                                className="relative w-full max-w-[240px] bg-white rounded-lg shadow-xl overflow-hidden p-1 border border-slate-200">
                                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected User</p>
                                    <p className="text-xs font-bold text-slate-800 truncate">{actionsModal.user?.fullName}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <ActionLink icon={Activity} label="View Intel" onClick={() => { handleViewDetails(actionsModal.user); setActionsModal({ show: false, user: null }); }} />
                                    <div className="h-[1px] bg-slate-50 my-1" />
                                    {actionsModal.user?.suspended || actionsModal.user?.banned ? (
                                        <ActionLink icon={Unlock} variant="success" label="Reactivate" onClick={() => { handleActionClick(actionsModal.user, 'reactivate'); setActionsModal({ show: false, user: null }); }} />
                                    ) : (
                                        <>
                                            <ActionLink icon={Lock} variant="warning" label="Suspend" onClick={() => { handleActionClick(actionsModal.user, 'suspend'); setActionsModal({ show: false, user: null }); }} />
                                            <ActionLink icon={Ban} variant="danger" label="Ban Permanent" onClick={() => { handleActionClick(actionsModal.user, 'ban'); setActionsModal({ show: false, user: null }); }} />
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

const ActionLink = ({ icon: Icon, label, onClick, variant = "default" }) => {
    const variants = {
        default: "text-slate-600 hover:bg-slate-50",
        success: "text-emerald-600 hover:bg-emerald-50",
        warning: "text-amber-600 hover:bg-amber-50",
        danger: "text-rose-600 hover:bg-rose-50"
    };

    return (
        <button onClick={onClick} className={`w-full px-3 py-2 flex items-center gap-2.5 rounded text-[11px] font-semibold tracking-tight transition-colors ${variants[variant]}`}>
            <Icon size={14} /> <span>{label}</span>
        </button>
    );
};
