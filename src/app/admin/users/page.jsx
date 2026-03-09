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
    Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white p-3 rounded-[32px] border border-gray-100 flex flex-col gap-4 group hover:border-orange-200 transition-all duration-300"
    >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} bg-opacity-10 transition-transform group-hover:scale-110 duration-300`}>
            <Icon size={24} className={`${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-gray-500">
                {label}
            </div>
            <div className="text-3xl font-black text-gray-900 tracking-tight">
                {value?.toLocaleString() || 0}
            </div>
        </div>
    </motion.div>
);

const Badge = ({ children, variant = "default" }) => {
    const variants = {
        default: "bg-gray-100 text-gray-600 border-gray-200",
        success: "bg-emerald-50 text-emerald-600 border-emerald-100",
        warning: "bg-orange-50 text-orange-600 border-orange-100",
        danger: "bg-rose-50 text-rose-600 border-rose-100",
        info: "bg-blue-50 text-blue-600 border-blue-100",
        dark: "bg-gray-900 text-white border-gray-800"
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${variants[variant]}`}>
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

    // Action Modal State
    const [actionModal, setActionModal] = useState({
        show: false,
        type: "", // 'suspend', 'ban', 'reactivate'
        user: null,
        reason: "",
        loading: false
    });

    // Actions List Modal State
    const [actionsModal, setActionsModal] = useState({
        show: false,
        user: null
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Clean up filter - remove empty strings to ensure 'All' option works correctly
            const cleanFilter = Object.entries(filter).reduce((acc, [key, value]) => {
                if (value !== "") acc[key] = value;
                return acc;
            }, {});

            const [usersData, statsData] = await Promise.all([
                adminApi.getAllUsers({ ...cleanFilter, search }),
                adminApi.getUserStats()
            ]);

            // Sort users alphabetically by fullName
            const sortedUsers = (usersData.users || []).sort((a, b) =>
                (a.fullName || "").localeCompare(b.fullName || "")
            );

            setUsers(sortedUsers);
            setStats(statsData.stats);
        } catch (error) {
            console.error("Failed to fetch user data:", error);
            toast.error("Could not load user data");
        } finally {
            setLoading(false);
        }
    }, [filter, search]);

    useEffect(() => {
        const timeout = setTimeout(fetchData, 500);
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
            toast.error("Please provide a reason");
            return;
        }

        setActionModal(prev => ({ ...prev, loading: true }));
        try {
            if (type === "suspend") await adminApi.suspendUser(user._id, reason);
            else if (type === "ban") await adminApi.banUser(user._id, reason);
            else if (type === "reactivate") await adminApi.reactivateUser(user._id);

            toast.success(`User ${type === 'reactivate' ? 'reactivated' : type + 'ed'} successfully`);
            setActionModal({ show: false, type: "", user: null, reason: "", loading: false });
            fetchData();
        } catch (error) {
            toast.error(error.message || `Failed to ${type} user`);
            setActionModal(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-10 pb-20">
                    {/* Hero Header */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col md:flex-row md:items-end justify-between gap-3"
                    >
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-orange-100">
                                <Activity size={12} /> Platform Oversight
                            </div>
                            <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">
                                User <span className="text-orange-500">Directory</span>
                            </h1>
                            <p className="text-gray-500 font-medium text-lg max-w-xl">
                                Comprehensive management of your platform's user base. Oversee account health, balances, and community status.
                            </p>
                        </div>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
                        <StatCard
                            icon={Users}
                            label="Total Users"
                            value={stats?.totalUsers}
                            color="bg-blue-500"
                            delay={0.1}
                        />
                        <StatCard
                            icon={UserCheck}
                            label="Verified"
                            value={stats?.verifiedUsers}
                            color="bg-emerald-500"
                            delay={0.2}
                        />
                        <StatCard
                            icon={UserMinus}
                            label="Unverified"
                            value={(stats?.totalUsers || 0) - (stats?.verifiedUsers || 0)}
                            color="bg-orange-500"
                            delay={0.3}
                        />
                        <StatCard
                            icon={AlertCircle}
                            label="Suspended"
                            value={stats?.suspendedUsers}
                            color="bg-amber-500"
                            delay={0.4}
                        />
                        <StatCard
                            icon={Ban}
                            label="Banned"
                            value={stats?.bannedUsers}
                            color="bg-rose-500"
                            delay={0.5}
                        />
                    </div>

                    {/* Controls & Listing */}
                    <div className="space-y-6 mt-6">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search users by name, email or ID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-16 pl-16 pr-6 bg-white border border-gray-100 rounded-[24px] focus:border-orange-500 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-400 placeholder:font-medium"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-16 flex items-center bg-white border border-gray-100 rounded-[24px] px-2 gap-1 overflow-hidden">
                                    <div className="px-4 text-[10px] font-black uppercase text-gray-400 border-r border-gray-50 flex items-center gap-2">
                                        <Filter size={12} /> Filters
                                    </div>
                                    <select
                                        value={filter.suspended}
                                        onChange={(e) => setFilter({ ...filter, suspended: e.target.value })}
                                        className="h-full px-4 bg-transparent outline-none font-bold text-sm text-gray-700 cursor-pointer hover:text-orange-500 transition-colors"
                                    >
                                        <option value="">Status: All</option>
                                        <option value="false">Active Only</option>
                                        <option value="true">Suspended</option>
                                    </select>
                                    <select
                                        value={filter.verified}
                                        onChange={(e) => setFilter({ ...filter, verified: e.target.value })}
                                        className="h-full px-4 bg-transparent outline-none font-bold text-sm text-gray-700 cursor-pointer hover:text-orange-500 transition-colors"
                                    >
                                        <option value="">Verify: All</option>
                                        <option value="true">Verified Only</option>
                                        <option value="false">Unverified Only</option>
                                    </select>
                                </div>
                                {(search || filter.verified || filter.suspended) && (
                                    <button
                                        onClick={() => {
                                            setSearch("");
                                            setFilter({ verified: "", suspended: "", banned: "" });
                                        }}
                                        className="h-16 px-8 bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all border border-gray-100 flex items-center gap-2"
                                    >
                                        <X size={14} /> Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* User Table Card */}
                        <div className="bg-white border border-gray-100 rounded-[40px] overflow-hidden flex flex-col">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-gray-50/50 border-b border-gray-50">
                                            <th className="px-5 py-3 text-[11px] font-black uppercase text-gray-400 tracking-widest">User Profile</th>
                                            <th className="px-8 py-3 text-[11px] font-black uppercase text-gray-400 tracking-widest">Wallet Assets</th>
                                            <th className="px-8 py-3 text-[11px] font-black uppercase text-gray-400 tracking-widest text-center">Identity</th>
                                            <th className="px-8 py-3 text-[11px] font-black uppercase text-gray-400 tracking-widest text-center">Platform Status</th>
                                            <th className="px-5 py-3 text-[11px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="5" className="py-12">
                                                    <div className="flex flex-col items-center gap-4 text-gray-400">
                                                        <Loader2 className="animate-spin text-orange-500" size={40} />
                                                        <span className="font-black text-[10px] uppercase tracking-widest">Syncing User Data...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : users.length > 0 ? (
                                            users.map((user, idx) => (
                                                <motion.tr
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    key={user._id}
                                                    className="hover:bg-gray-50/80 transition-all duration-300 group"
                                                >
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-5">
                                                            <div className="relative">
                                                                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 overflow-hidden ring-2 ring-transparent group-hover:ring-orange-100 transition-all duration-300">
                                                                    {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <Users size={24} />}
                                                                </div>
                                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.isOnline ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-gray-900 text-lg tracking-tight group-hover:text-orange-600 transition-colors">{user.fullName}</div>
                                                                <div className="text-sm text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                                                                    <Mail size={12} className="text-gray-300" /> {user.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-7">
                                                        <div className="space-y-2">
                                                            <div className={`flex items-center gap-2 font-black transition-transform origin-left group-hover:scale-105 ${(user.wallet?.balance > 0) ? 'text-emerald-600' : 'text-gray-900'
                                                                }`}>
                                                                <Wallet size={16} className={user.wallet?.balance > 0 ? 'text-emerald-500' : 'text-gray-400'} />
                                                                ₦{(user.wallet?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                                                <ShoppingBag size={12} /> {user.totalOrderCount || 0} Successful Orders
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-7 text-center">
                                                        {user.isVerified ? (
                                                            <Badge variant="success">Verified</Badge>
                                                        ) : (
                                                            <Badge variant="warning">Unverified</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-7 text-center">
                                                        {user.banned ? (
                                                            <Badge variant="dark">Banned</Badge>
                                                        ) : user.suspended ? (
                                                            <Badge variant="danger">Suspended</Badge>
                                                        ) : (
                                                            <Badge variant="info">Active</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-10 py-7 text-right">
                                                        <button
                                                            onClick={() => setActionsModal({ show: true, user })}
                                                            className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-all duration-200 ml-auto"
                                                        >
                                                            <MoreVertical size={20} />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="py-40 text-center">
                                                    <div className="flex flex-col items-center gap-4 text-gray-300">
                                                        <UserMinus size={64} strokeWidth={1} />
                                                        <div className="text-xl font-black text-gray-400">Zero Profiles Detected</div>
                                                        <button onClick={() => { setSearch(""); setFilter({ verified: "", suspended: "", banned: "" }) }} className="text-orange-500 font-bold hover:underline">Reset all filters</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Modal */}
                <AnimatePresence>
                    {showModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowModal(false)}
                                className="absolute inset-0 bg-gray-950/80 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 40 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 40 }}
                                className="relative w-full max-w-2xl bg-white rounded-[48px] overflow-hidden"
                            >
                                {/* Modal Header */}
                                <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                                            <Activity size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">Consumer Intel</h2>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">
                                                UID: {selectedUser?._id?.slice(-8)}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-950 hover:border-gray-900 transition-all duration-300">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="p-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
                                    {detailsLoading ? (
                                        <div className="py-20 text-center flex flex-col items-center gap-4">
                                            <Loader2 className="animate-spin text-orange-500" size={48} />
                                            <span className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">Aggregating Intel...</span>
                                        </div>
                                    ) : userDetails ? (
                                        <div className="space-y-10">
                                            {/* Top Banner Info */}
                                            <div className="flex flex-col md:flex-row gap-4 items-center bg-gray-50 p-4 rounded-[32px] border border-gray-100">
                                                <div className="w-32 h-32 bg-white rounded-[40px] overflow-hidden flex-shrink-0 border-4 border-white ring-1 ring-gray-100 shadow-sm">
                                                    {userDetails.avatar ? <img src={userDetails.avatar} alt="" className="w-full h-full object-cover" /> : <Users size={48} className="m-auto mt-10 text-gray-200" />}
                                                </div>
                                                <div className="flex-1 text-center md:text-left space-y-3">
                                                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                                        {userDetails.isVerified && <Badge variant="info">Verified Identity</Badge>}
                                                        <Badge>{userDetails.role}</Badge>
                                                    </div>
                                                    <div className="text-4xl font-black text-gray-900 tracking-tighter">{userDetails.fullName}</div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-gray-500 font-bold text-sm">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <Mail size={16} className="text-orange-500 shrink-0" />
                                                            <span className="truncate">{userDetails.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Phone size={16} className="text-orange-500 shrink-0" />
                                                            {userDetails.phone || "---"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Wallet Section */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4 px-4">
                                                    <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.2em]">Wallet & Billing</h3>
                                                    <div className="flex-1 h-[1px] bg-gray-50" />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-[32px] shadow-lg shadow-emerald-500/20 col-span-full md:col-span-1 border border-emerald-400/20 flex flex-col justify-between min-h-[160px]">
                                                        <div className="flex items-center justify-between">
                                                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white">
                                                                <Wallet size={20} />
                                                            </div>
                                                            <Badge variant="dark" className="border-white/20 bg-emerald-900/20">Active Wallet</Badge>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Current Balance</div>
                                                            <div className="text-3xl font-black text-white tracking-tight">
                                                                ₦{(userDetails.wallet?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-50 p-3 rounded-3xl border border-gray-100 flex flex-col justify-center">
                                                        <ShoppingBag size={20} className="text-blue-500 mb-2" />
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Orders</div>
                                                        <div className="text-xl font-black text-gray-900">{userDetails.totalOrderCount || 0}</div>
                                                    </div>

                                                    <div className="bg-gray-50 p-3 rounded-3xl border border-gray-100 flex flex-col justify-center">
                                                        <Activity size={20} className="text-emerald-500 mb-2" />
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Experience</div>
                                                        <div className="text-xl font-black text-gray-900 truncate">Silver Tier</div>
                                                    </div>
                                                </div>

                                                {/* Transaction History */}
                                                <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
                                                    <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-50 flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Transaction History</span>
                                                        <Badge variant="info">Recent Operations</Badge>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse">
                                                            <thead>
                                                                <tr className="border-b border-gray-50">
                                                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Date</th>
                                                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Type</th>
                                                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Description</th>
                                                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Amount</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50">
                                                                {userDetails.wallet?.transactions?.length > 0 ? (
                                                                    [...userDetails.wallet.transactions]
                                                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                                        .map((tx, idx) => (
                                                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                                                <td className="px-6 py-4 text-xs font-bold text-gray-600">
                                                                                    {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                                </td>
                                                                                <td className="px-6 py-4 text-center">
                                                                                    <div className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                                                        }`}>
                                                                                        {tx.type}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-6 py-4 text-xs font-medium text-gray-500">
                                                                                    {tx.description}
                                                                                </td>
                                                                                <td className={`px-6 py-4 text-xs font-black text-right ${tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                                                                                    }`}>
                                                                                    {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                                </td>
                                                                            </tr>
                                                                        ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan="4" className="py-12 text-center">
                                                                            <div className="flex flex-col items-center gap-2 text-gray-300">
                                                                                <Wallet size={24} strokeWidth={1} />
                                                                                <span className="text-[10px] font-black uppercase tracking-widest">No wallet activity found</span>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Addresses Section */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4 px-4">
                                                    <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.2em]">Geo-Locations</h3>
                                                    <div className="flex-1 h-[1px] bg-gray-50" />
                                                </div>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {userDetails.addresses?.length > 0 ? userDetails.addresses.map((addr, idx) => (
                                                        <div key={idx} className="p-3 bg-white rounded-3xl border border-gray-100 flex items-center gap-3 hover:border-orange-200 transition-colors shadow-sm">
                                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-orange-500 shrink-0">
                                                                {addr.isDefault ? <UserCheck size={20} /> : <MapPin size={20} />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="font-black text-gray-900 flex items-center gap-2 leading-none mb-1">
                                                                    {addr.label}
                                                                    {addr.isDefault && <span className="text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">Main</span>}
                                                                </div>
                                                                <div className="text-sm text-gray-500 font-bold">{addr.addressLine}, {addr.cityName}</div>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <div className="p-10 border-2 border-dashed border-gray-100 rounded-[32px] text-center flex flex-col items-center gap-2">
                                                            <div className="text-gray-200"><Users size={32} /></div>
                                                            <span className="text-sm font-black text-gray-300 uppercase tracking-widest">No Logged Locations</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Violation Status */}
                                            {(userDetails.suspended || userDetails.banned) && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="p-4 bg-rose-50 rounded-[40px] border border-rose-100 flex gap-3"
                                                >
                                                    <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-500/20">
                                                        <Ban size={24} />
                                                    </div>
                                                    <div>
                                                        <div className="text-lg font-black text-rose-900 leading-none mb-2">
                                                            {userDetails.banned ? 'Permanent Access Revocation' : 'Temporal Account Suspension'}
                                                        </div>
                                                        <p className="text-sm text-rose-600 font-bold leading-relaxed">
                                                            Protocol violation reason: {userDetails.banReason || userDetails.suspensionReason || 'Data unavailable.'}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="py-20 text-center font-black text-gray-300">Intelligence Fetch Failure</div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Custom Action Modal */}
                <AnimatePresence>
                    {actionModal.show && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => !actionModal.loading && setActionModal({ ...actionModal, show: false })}
                                className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden p-4"
                            >
                                <div className="text-center space-y-4">
                                    <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center ${actionModal.type === 'ban' ? 'bg-rose-50 text-rose-500' :
                                        actionModal.type === 'suspend' ? 'bg-amber-50 text-amber-500' :
                                            'bg-emerald-50 text-emerald-500'
                                        }`}>
                                        {actionModal.type === 'ban' ? <Ban size={40} /> :
                                            actionModal.type === 'suspend' ? <AlertCircle size={40} /> :
                                                <RefreshCcw size={40} />}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                            {actionModal.type === 'ban' ? 'Confirm Permanent Ban' :
                                                actionModal.type === 'suspend' ? 'Suspend User Access' :
                                                    'Reactivate Account'}
                                        </h3>
                                        <p className="text-gray-500 font-medium text-sm mt-2">
                                            {actionModal.type === 'reactivate'
                                                ? `Are you sure you want to restore access for ${actionModal.user.fullName}?`
                                                : `This action will restrict ${actionModal.user.fullName} from core platform features.`}
                                        </p>
                                    </div>

                                    {(actionModal.type === 'ban' || actionModal.type === 'suspend') && (
                                        <div className="text-left space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Reason for Action</label>
                                            <textarea
                                                value={actionModal.reason}
                                                onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                                                placeholder="e.g. Terms of Service violation, suspicious activity..."
                                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-orange-500 outline-none font-bold text-sm text-gray-900 transition-all resize-none h-24"
                                            />
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2 pt-4">
                                        <button
                                            disabled={actionModal.loading}
                                            onClick={handleConfirmAction}
                                            className={`w-full h-14 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center transition-all ${actionModal.type === 'ban' ? 'bg-rose-500 text-white hover:bg-rose-600' :
                                                actionModal.type === 'suspend' ? 'bg-amber-500 text-white hover:bg-amber-600' :
                                                    'bg-emerald-500 text-white hover:bg-emerald-600'
                                                }`}
                                        >
                                            {actionModal.loading ? <Loader2 className="animate-spin" /> : 'Confirm Action'}
                                        </button>
                                        <button
                                            disabled={actionModal.loading}
                                            onClick={() => setActionModal({ ...actionModal, show: false })}
                                            className="w-full h-14 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Actions Selector Modal */}
                <AnimatePresence>
                    {actionsModal.show && (
                        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setActionsModal({ show: false, user: null })}
                                className="absolute inset-0 bg-gray-950/20 backdrop-blur-[2px]"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="relative w-full max-w-[280px] bg-white rounded-[32px] shadow-2xl overflow-hidden p-3 border border-gray-100"
                            >
                                <div className="space-y-1">
                                    <div className="px-3 pb-3 border-b border-gray-50 mb-3 text-center">
                                        <div className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Quick Actions</div>
                                        <div className="text-sm font-black text-gray-800 truncate">{actionsModal.user?.fullName}</div>
                                    </div>

                                    <ActionItem
                                        icon={Activity}
                                        label="View Intelligence"
                                        onClick={() => {
                                            handleViewDetails(actionsModal.user);
                                            setActionsModal({ show: false, user: null });
                                        }}
                                    />

                                    <div className="h-[1px] bg-gray-50 my-2" />

                                    {actionsModal.user?.suspended || actionsModal.user?.banned ? (
                                        <ActionItem
                                            icon={RefreshCcw}
                                            label="Reactivate"
                                            variant="success"
                                            onClick={() => {
                                                handleActionClick(actionsModal.user, 'reactivate');
                                                setActionsModal({ show: false, user: null });
                                            }}
                                        />
                                    ) : (
                                        <>
                                            <ActionItem
                                                icon={AlertCircle}
                                                label="Suspend Access"
                                                variant="warning"
                                                onClick={() => {
                                                    handleActionClick(actionsModal.user, 'suspend');
                                                    setActionsModal({ show: false, user: null });
                                                }}
                                            />
                                            <ActionItem
                                                icon={Ban}
                                                label="Permanent Ban"
                                                variant="danger"
                                                onClick={() => {
                                                    handleActionClick(actionsModal.user, 'ban');
                                                    setActionsModal({ show: false, user: null });
                                                }}
                                            />
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

const ActionItem = ({ icon: Icon, label, onClick, variant = "default" }) => {
    const variants = {
        default: "text-gray-600 hover:bg-gray-50",
        success: "text-emerald-600 hover:bg-emerald-50",
        warning: "text-amber-600 hover:bg-amber-50",
        danger: "text-rose-600 hover:bg-rose-50"
    };

    return (
        <button
            onClick={onClick}
            className={`w-full h-11 px-4 flex items-center gap-3 rounded-2xl transition-all group ${variants[variant]}`}
        >
            <Icon size={18} className="transition-transform group-hover:scale-110" />
            <span className="text-[11px] font-black uppercase tracking-wider">{label}</span>
        </button>
    );
};
