"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useProfile } from "@/app/context/ProfileContext";
import { getWallet, fundWallet } from "@/app/lib/api";
import {
    Wallet, Plus, ArrowUpRight, ArrowDownLeft, Calendar,
    CreditCard, Loader2, Eye, EyeOff, Search, Filter,
    TrendingUp, TrendingDown, ChevronRight, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Header2 from "@/app/components/App_Header/Header2";

// Helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
    }).format(amount);
};

// Helper to group transactions by date
const groupTransactionsByDate = (transactions) => {
    const groups = {};

    transactions.forEach(tx => {
        const date = new Date(tx.date || tx.createdAt);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        if (date.toDateString() === today.toDateString()) {
            key = "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            key = "Yesterday";
        }

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(tx);
    });

    return groups;
};

export default function UserWalletPage() {
    const { userProfile, isLoading: isProfileLoading } = useProfile();
    const [walletData, setWalletData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFunding, setIsFunding] = useState(false);
    const [amount, setAmount] = useState("");
    const [showFundModal, setShowFundModal] = useState(false);
    const [showBalance, setShowBalance] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("ALL"); // ALL, CREDIT, DEBIT
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showTransactionModal, setShowTransactionModal] = useState(false);

    // Quick fund presets
    const PRESET_AMOUNTS = [1000, 2000, 5000, 10000, 20000];

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            setIsLoading(true);
            const data = await getWallet();
            console.log(data)
            setWalletData(data.wallet);
        } catch (error) {
            toast.error("Failed to load wallet data.");
        } finally {
            setIsLoading(false);
        }
    };

    // console.log(userProfile.user)

    const handleFundWallet = async (e) => {
        if (e) e.preventDefault();
        if (!amount || isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }

        // Extract email (handle both direct and nested structure)
        const email = userProfile?.user?.email || userProfile?.email;

        if (!email) {
            toast.error("User email not found. Please update your profile.");
            return;
        }

        try {
            setIsFunding(true);
            const res = await fundWallet({ amount: Number(amount), email });
            if (res.success && res.authorization_url) {
                window.location.href = res.authorization_url;
            } else {
                toast.error("Failed to initiate payment.");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Payment initialization failed.");
        } finally {
            setIsFunding(false);
        }
    };

    // Derived Logic for Display
    const transactions = walletData?.transactions || [];

    // 1. Filter
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            // Filter by Type
            if (filterType === "CREDIT" && !(tx.type === 'credit' || tx.type === 'deposit')) return false;
            if (filterType === "DEBIT" && (tx.type === 'credit' || tx.type === 'deposit')) return false;

            // Search by Description or Amount
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const descMatch = tx.description?.toLowerCase().includes(searchLower);
                const amtMatch = tx.amount?.toString().includes(searchLower);
                return descMatch || amtMatch;
            }

            return true;
        });
    }, [transactions, filterType, searchQuery]);

    // 2. Group
    const groupedTransactions = useMemo(() => groupTransactionsByDate(filteredTransactions), [filteredTransactions]);

    if (isProfileLoading || isLoading) {
        return (
            <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen transition-colors duration-300">
                <Header2 />
                <div className="flex flex-col items-center justify-center h-[80vh]">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-orange-100 dark:border-orange-500/10 rounded-full animate-spin"></div>
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-orange-500 rounded-full animate-spin border-t-transparent"></div>
                        <Wallet className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500" size={20} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen font-sans pb-20 transition-colors duration-300">
            <Header2 />

            <div className="max-w-4xl mx-auto md:px-6 px-2 py-4 space-y-8">

                {/* Header Section */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">My Wallet</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 font-medium">Manage your balance & transactions</p>
                    </div>
                </div>

                {/* VISUAL BALANCE CARD */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[40px] shadow-2xl transition-all hover:shadow-orange-500/10 group"
                >
                    {/* Artistic Background Layer */}
                    <div className="absolute inset-0 bg-gray-900">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4"></div>
                        {/* Mesh grid pattern overlay */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150"></div>
                    </div>

                    <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between gap-8 md:items-end">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3">
                                <span className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-white/80 text-xs font-bold uppercase tracking-widest border border-white/5 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div> Active
                                </span>
                                <button
                                    onClick={() => setShowBalance(!showBalance)}
                                    className="text-white/40 hover:text-white transition-colors"
                                >
                                    {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            </div>

                            <div>
                                <p className="text-white/60 font-medium text-sm mb-1 uppercase tracking-wider">Total Balance</p>
                                <div className="flex items-baseline gap-1">
                                    <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight tabular-nums">
                                        {showBalance ? (
                                            <>
                                                <span className="text-2xl md:text-3xl font-bold text-orange-500 opacity-80">₦</span>
                                                {walletData?.balance?.toLocaleString() || "0.00"}
                                            </>
                                        ) : (
                                            <span className="tracking-widest relative top-2">••••••••</span>
                                        )}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowFundModal(true)}
                            className="group relative bg-white text-gray-900 px-8 py-4 rounded-3xl font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center gap-3 overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <Plus size={20} className="stroke-[3px]" /> Fund Wallet
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                    </div>
                </motion.div>

                {/* TRANSACTIONS SECTION */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600">
                                <CreditCard size={16} />
                            </div>
                            Transactions
                        </h3>

                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {/* Filter Tabs */}
                            <div className="flex p-1 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-xl">
                                <button
                                    onClick={() => setFilterType("ALL")}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === "ALL" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilterType("CREDIT")}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === "CREDIT" ? "bg-white dark:bg-zinc-700 shadow-sm text-emerald-600" : "text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-500"}`}
                                >
                                    Money In
                                </button>
                                <button
                                    onClick={() => setFilterType("DEBIT")}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === "DEBIT" ? "bg-white dark:bg-zinc-700 shadow-sm text-red-600" : "text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-500"}`}
                                >
                                    Money Out
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 dark:text-zinc-100 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none w-32 focus:w-48 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {Object.keys(groupedTransactions).length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-[32px] border border-dashed border-zinc-200 dark:border-zinc-800">
                                <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 relative">
                                    <div className="absolute inset-0 bg-orange-500/5 rounded-full animate-ping"></div>
                                    <Search size={32} className="text-zinc-300 dark:text-zinc-700 relative z-10" />
                                </div>
                                <h4 className="text-zinc-900 dark:text-zinc-100 font-bold text-lg">No transactions found</h4>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Try adjusting your filters or search.</p>
                            </motion.div>
                        ) : (
                            Object.entries(groupedTransactions).map(([dateLabel, txs]) => (
                                <div key={dateLabel}>
                                    <div className="sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-[1] py-2 mb-2 flex items-center gap-4 transition-colors">
                                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{dateLabel}</h4>
                                        <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 flex-1"></div>
                                    </div>

                                    <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                                        {txs.map((tx, idx) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={tx._id}
                                                onClick={() => {
                                                    setSelectedTransaction(tx);
                                                    setShowTransactionModal(true);
                                                }}
                                                className={`group p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-gray-50 cursor-pointer ${(idx !== txs.length - 1) ? "border-b border-gray-50" : ""}`}
                                            >
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${tx.type === 'credit' || tx.type === 'deposit'
                                                        ? 'bg-emerald-50 text-emerald-500'
                                                        : 'bg-red-50 text-red-500'
                                                        }`}>
                                                        {tx.type === 'credit' || tx.type === 'deposit' ? <TrendingUp size={20} strokeWidth={2.5} /> : <TrendingDown size={20} strokeWidth={2.5} />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                                                            {tx.description || (tx.type === 'credit' ? 'Wallet Funding' : 'Payment')}
                                                        </h5>
                                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                                            <span>{new Date(tx.date || tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                            <span className="uppercase font-semibold tracking-wider text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{tx.type}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right flex items-center justify-between sm:block shrink-0">
                                                    <span className="sm:hidden text-xs font-bold text-gray-400">Amount</span>
                                                    <div>
                                                        <p className={`text-base sm:text-lg font-black tabular-nums ${tx.type === 'credit' || tx.type === 'deposit' ? 'text-emerald-500' : 'text-gray-900'
                                                            }`}>
                                                            {tx.type === 'credit' || tx.type === 'deposit' ? '+' : '-'}
                                                            {formatCurrency(tx.amount)}
                                                        </p>
                                                        <ChevronRight size={16} className="text-gray-400 ml-auto hidden sm:block" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* MODAL */}
                <AnimatePresence>
                    {showFundModal && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setShowFundModal(false)}
                                className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 transition-all"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                                className="fixed top-[10%] left-0 right-0 m-auto mx-4 max-w-md h-fit bg-white rounded-[32px] overflow-hidden shadow-2xl z-50 border border-gray-100"
                            >
                                <div className="relative bg-black p-6">
                                    <div className="absolute top-0 right-0 p-24 bg-orange-600/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                    <button onClick={() => setShowFundModal(false)} className="absolute top-5 right-5 z-20 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition"><X size={18} /></button>
                                    <h3 className="text-2xl font-black text-white relative z-10">Fund Wallet</h3>
                                    <p className="text-gray-400 text-sm mt-1 relative z-10">Add funds securely via Paystack</p>
                                </div>

                                <div className="md:p-6 p-3">
                                    <div className="mb-6">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Enter Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-bold">₦</span>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-4 font-black text-3xl text-gray-900 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all appearance-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-8">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Select</label>
                                        <div className="flex flex-wrap gap-2">
                                            {PRESET_AMOUNTS.map(amt => (
                                                <button
                                                    key={amt}
                                                    onClick={() => setAmount(amt)}
                                                    className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-600 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 active:scale-95 transition-all shadow-sm"
                                                >
                                                    ₦{amt.toLocaleString()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleFundWallet}
                                        disabled={isFunding}
                                        className="w-full py-4 bg-black text-white font-bold text-lg rounded-2xl hover:bg-gray-900 hover:shadow-xl hover:shadow-black/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isFunding ? (
                                            <Loader2 className="animate-spin" size={24} />
                                        ) : (
                                            <>Proceed to Payment <ArrowUpRight size={20} /></>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Transaction Details Modal */}
                <AnimatePresence>
                    {showTransactionModal && selectedTransaction && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowTransactionModal(false)}
                                className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="fixed top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md bg-white rounded-[32px] shadow-2xl z-50 overflow-hidden"
                            >
                                {/* Header */}
                                <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 md:p-6 p-4 pb-">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
                                    <button
                                        onClick={() => setShowTransactionModal(false)}
                                        className="absolute cursor-pointer z-24 top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                    >
                                        <X size={18} className="text-white" />
                                    </button>

                                    <div className="relative z-10">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${selectedTransaction.type === 'credit' || selectedTransaction.type === 'deposit'
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {selectedTransaction.type === 'credit' || selectedTransaction.type === 'deposit'
                                                ? <TrendingUp size={32} strokeWidth={2.5} />
                                                : <TrendingDown size={32} strokeWidth={2.5} />
                                            }
                                        </div>

                                        <h3 className="text-2xl font-black text-white mb-1">
                                            {selectedTransaction.description || (selectedTransaction.type === 'credit' ? 'Wallet Funding' : 'Payment')}
                                        </h3>
                                        <p className="text-gray-400 text-sm">Transaction Details</p>
                                    </div>
                                </div>

                                {/* Amount Display */}
                                <div className="md:px-6 p-3 py-3 border-b border-gray-100">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount</p>
                                    <p className={`text-4xl font-black ${selectedTransaction.type === 'credit' || selectedTransaction.type === 'deposit'
                                        ? 'text-emerald-500'
                                        : 'text-gray-900'
                                        }`}>
                                        {selectedTransaction.type === 'credit' || selectedTransaction.type === 'deposit' ? '+' : '-'}
                                        {formatCurrency(selectedTransaction.amount)}
                                    </p>
                                </div>

                                {/* Transaction Info */}
                                <div className="md:px-6 p-3 py-2 space-y-">
                                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                        <span className="text-sm font-semibold text-gray-500">Type</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedTransaction.type === 'credit' || selectedTransaction.type === 'deposit'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {selectedTransaction.type}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-start py-3 border-b border-gray-50">
                                        <span className="text-sm font-semibold text-gray-500">Description</span>
                                        <span className="text-sm font-bold text-gray-900 text-right max-w-[60%] break-words">
                                            {selectedTransaction.description || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                        <span className="text-sm font-semibold text-gray-500">Date & Time</span>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">
                                                {new Date(selectedTransaction.date || selectedTransaction.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(selectedTransaction.date || selectedTransaction.createdAt).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-sm font-semibold text-gray-500">Transaction ID</span>
                                        <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                            {selectedTransaction._id?.slice(-8).toUpperCase() || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-4 py-2 bg-gray-50">
                                    <button
                                        onClick={() => setShowTransactionModal(false)}
                                        className="w-full py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
