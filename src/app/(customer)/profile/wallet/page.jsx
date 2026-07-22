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
    const [dateFilterMode, setDateFilterMode] = useState("ALL"); // ALL, DATE, MONTH, YEAR
    const [dateFilterValue, setDateFilterValue] = useState("");
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
    const transactions = useMemo(() => walletData?.transactions || [], [walletData]);

    // 1. Filter
    const filteredTransactions = useMemo(() => {
        const result = transactions.filter(tx => {
            // Filter by Type
            if (filterType === "CREDIT" && !(tx.type === 'credit' || tx.type === 'deposit')) return false;
            if (filterType === "DEBIT" && (tx.type === 'credit' || tx.type === 'deposit')) return false;

            // Search by Description or Amount
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const descMatch = tx.description?.toLowerCase().includes(searchLower);
                const amtMatch = tx.amount?.toString().includes(searchLower);
                if (!(descMatch || amtMatch)) return false;
            }

            // Date filter by exact day, month, or year
            if (dateFilterMode !== "ALL" && dateFilterValue) {
                const txDate = new Date(tx.date || tx.createdAt);
                if (Number.isNaN(txDate.getTime())) return false;

                const txYear = txDate.getFullYear().toString();
                const txMonth = `${txYear}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
                const txDay = txDate.toISOString().slice(0, 10);

                if (dateFilterMode === "DATE" && dateFilterValue !== txDay) return false;
                if (dateFilterMode === "MONTH" && dateFilterValue !== txMonth) return false;
                if (dateFilterMode === "YEAR" && dateFilterValue !== txYear) return false;
            }

            return true;
        });

        // Sort by newest first
        return result.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    }, [transactions, filterType, searchQuery, dateFilterMode, dateFilterValue]);

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

            <div className="max-w-4xl mx-auto md:px-6 px-2 py-2.5 space-y-5">
 
                {/* Header Section */}
                {/* <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">My Wallet</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5 font-medium">Manage your balance & transactions</p>
                    </div>
                </div> */}

                {/* VISUAL BALANCE CARD */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[8px] shadow-2xl transition-all hover:shadow-orange-500/10 group"
                >
                    {/* Artistic Background Layer */}
                    <div className="absolute inset-0 bg-gray-900">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4"></div>
                        {/* Mesh grid pattern overlay */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150"></div>
                    </div>
 
                    <div className="relative z-10 p-5 md:p-6 flex flex-col md:flex-row justify-between gap-5 md:items-end">
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                                <span className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full text-white/80 text-[10px] font-bold uppercase tracking-widest border border-white/5 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div> Active
                                </span>
                                <button
                                    onClick={() => setShowBalance(!showBalance)}
                                    className="text-white/40 hover:text-white transition-colors"
                                >
                                    {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                            </div>
 
                            <div>
                                <p className="text-white/60 font-medium text-xs mb-0.5 uppercase tracking-wider">Total Balance</p>
                                <div className="flex items-baseline gap-0.5">
                                    <h2 className="text-3.5xl md:text-4xl font-black text-white tracking-tight tabular-nums">
                                        {showBalance ? (
                                            <>
                                                <span className="text-xl md:text-2xl font-bold text-orange-500 opacity-80">₦</span>
                                                {walletData?.balance?.toLocaleString() || "0.00"}
                                            </>
                                        ) : (
                                            <span className="tracking-widest relative top-1 text-2xl">••••••••</span>
                                        )}
                                    </h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* TRANSACTIONS SECTION */}
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600">
                                <CreditCard size={14} />
                            </div>
                            Transactions
                        </h3>

                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {/* Filter Tabs */}
                            <div className="flex p-1 bg-zinc-200/50 dark:bg-zinc-800/50 rounded">
                                <button
                                    onClick={() => setFilterType("ALL")}
                                    className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${filterType === "ALL" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilterType("CREDIT")}
                                    className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${filterType === "CREDIT" ? "bg-white dark:bg-zinc-700 shadow-sm text-emerald-600" : "text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-500"}`}
                                >
                                    Money In
                                </button>
                                <button
                                    onClick={() => setFilterType("DEBIT")}
                                    className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${filterType === "DEBIT" ? "bg-white dark:bg-zinc-700 shadow-sm text-red-600" : "text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-500"}`}
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
                                    className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 dark:text-zinc-100 rounded text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none w-32 focus:w-48 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            <Filter size={14} className="text-zinc-400 dark:text-zinc-500" />
                            <span>Date filter</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['ALL', 'DATE', 'MONTH', 'YEAR'].map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => {
                                        setDateFilterMode(mode);
                                        if (mode === 'ALL') setDateFilterValue('');
                                    }}
                                    className={`px-3 py-1.5 rounded text-xs font-semibold transition ${dateFilterMode === mode ? 'bg-orange-500 text-white shadow-sm' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                                >
                                    {mode === 'ALL' ? 'All' : mode.charAt(0) + mode.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                        {dateFilterMode !== 'ALL' && (
                            <div className="flex items-center gap-2 flex-wrap">
                                {dateFilterMode === 'DATE' && (
                                    <input
                                        type="date"
                                        value={dateFilterValue}
                                        onChange={(e) => setDateFilterValue(e.target.value)}
                                        className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 dark:text-zinc-100 rounded text-xs focus:ring-2 focus:ring-orange-500/20 outline-none"
                                    />
                                )}
                                {dateFilterMode === 'MONTH' && (
                                    <input
                                        type="month"
                                        value={dateFilterValue}
                                        onChange={(e) => setDateFilterValue(e.target.value)}
                                        className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 dark:text-zinc-100 rounded text-xs focus:ring-2 focus:ring-orange-500/20 outline-none"
                                    />
                                )}
                                {dateFilterMode === 'YEAR' && (
                                    <input
                                        type="number"
                                        min="2000"
                                        max="2100"
                                        placeholder="YYYY"
                                        value={dateFilterValue}
                                        onChange={(e) => setDateFilterValue(e.target.value)}
                                        className="w-28 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 dark:text-zinc-100 rounded text-xs focus:ring-2 focus:ring-orange-500/20 outline-none"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDateFilterMode('ALL');
                                        setDateFilterValue('');
                                    }}
                                    className="px-3 py-2 rounded text-xs font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {Object.keys(groupedTransactions).length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-[8px] border border-dashed border-zinc-200 dark:border-zinc-800">
                                <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 relative">
                                    <div className="absolute inset-0 bg-orange-500/5 rounded-full animate-ping"></div>
                                    <Search size={32} className="text-zinc-300 dark:text-zinc-400 relative z-10" />
                                </div>
                                <h4 className="text-zinc-900 dark:text-zinc-100 font-bold text-lg">No transactions found</h4>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Try adjusting your filters or search.</p>
                            </motion.div>
                        ) : (
                            Object.entries(groupedTransactions).map(([dateLabel, txs]) => (
                                <div key={dateLabel}>
                                    <div className="sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-[1] py-1 mb-1 flex items-center gap-4 transition-colors">
                                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{dateLabel}</h4>
                                        <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 flex-1"></div>
                                    </div>
 
                                    <div className="bg-white dark:bg-zinc-900 rounded border border-zinc-100 dark:border-zinc-800 overflow-hidden">
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
                                                className={`group p-2.5 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-950 cursor-pointer ${(idx !== txs.length - 1) ? "border-b border-gray-50 dark:border-zinc-800" : ""}`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className={`w-9 h-9 rounded flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${tx.type === 'credit' || tx.type === 'deposit'
                                                        ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-200'
                                                        : 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-200'
                                                        }`}>
                                                        {tx.type === 'credit' || tx.type === 'deposit' ? <TrendingUp size={16} strokeWidth={2.5} /> : <TrendingDown size={16} strokeWidth={2.5} />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm truncate">
                                                            {tx.description || (tx.type === 'credit' ? 'Wallet Funding' : 'Payment')}
                                                        </h5>
                                                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                            <span>{new Date(tx.date || tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                            <span className="uppercase font-semibold tracking-wider text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{tx.type}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right flex items-center justify-between sm:block shrink-0">
                                                        <span className="sm:hidden text-xs font-bold text-zinc-500 dark:text-zinc-400">Amount</span>
                                                    <div>
                                                        <p className={`text-sm sm:text-base font-black tabular-nums ${tx.type === 'credit' || tx.type === 'deposit' ? 'text-emerald-500 dark:text-emerald-300' : 'text-zinc-900 dark:text-zinc-100'
                                                            }`}>
                                                            {tx.type === 'credit' || tx.type === 'deposit' ? '+' : '-'}
                                                            {formatCurrency(tx.amount)}
                                                        </p>
                                                        <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-500 ml-auto hidden sm:block" />
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
                                className="fixed top-[10%] left-0 right-0 m-auto mx-4 max-w-md h-fit bg-white dark:bg-zinc-950 rounded-[8px] overflow-hidden shadow-2xl z-50 border border-gray-100 dark:border-zinc-800"
                            >
                                <div className="relative bg-black p-6">
                                    <div className="absolute top-0 right-0 p-24 bg-orange-600/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                    <button onClick={() => setShowFundModal(false)} className="absolute top-5 right-5 z-20 p-2 bg-white/15 dark:bg-zinc-800/80 rounded-full text-white hover:bg-white/25 dark:hover:bg-zinc-700 transition"><X size={18} /></button>
                                    <h3 className="text-2xl font-black text-white relative z-10">Fund Wallet</h3>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 relative z-10">Add funds securely via Paystack</p>
                                </div>

                                <div className="md:p-6 p-3">
                                     <div className="mb-4">
                                         <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Enter Amount</label>
                                         <div className="relative">
                                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-xl font-bold">₦</span>
                                             <input
                                                 type="number"
                                                 value={amount}
                                                 onChange={(e) => setAmount(e.target.value)}
                                                 placeholder="0.00"
                                                 className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded pl-10 pr-4 py-3 font-black text-2xl text-zinc-900 dark:text-zinc-100 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all appearance-none"
                                             />
                                         </div>
                                     </div>
 
                                     <div className="mb-5">
                                         <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Quick Select</label>
                                         <div className="flex flex-wrap gap-1.5">
                                             {PRESET_AMOUNTS.map(amt => (
                                                 <button
                                                     key={amt}
                                                     onClick={() => setAmount(amt)}
                                                     className="px-3 py-1.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-100 hover:bg-orange-50 dark:hover:bg-orange-600/10 hover:text-orange-600 dark:hover:text-orange-300 active:scale-95 transition-all shadow-sm"
                                                 >
                                                     ₦{amt.toLocaleString()}
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
 
                                     <button
                                         onClick={handleFundWallet}
                                         disabled={isFunding}
                                         className="w-full py-3 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 text-white font-bold text-sm rounded-lg hover:shadow-xl hover:shadow-orange-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                     >
                                         {isFunding ? (
                                             <Loader2 className="animate-spin" size={20} />
                                         ) : (
                                             <>Proceed to Payment <ArrowUpRight size={16} /></>
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
                                className="fixed top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md bg-white dark:bg-zinc-950 rounded shadow-2xl z-50 overflow-hidden border border-gray-100 dark:border-zinc-800"
                            >
                                {/* Header */}
                                <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 md:p-4 p-3">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
                                    <button
                                        onClick={() => setShowTransactionModal(false)}
                                        className="absolute cursor-pointer z-24 top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                    >
                                        <X size={16} className="text-white" />
                                    </button>

                                    <div className="relative z-10">
                                        <div className={`w-12 h-12 rounded flex items-center justify-center mb-3 ${selectedTransaction.type === 'credit' || selectedTransaction.type === 'deposit'
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {selectedTransaction.type === 'credit' || selectedTransaction.type === 'deposit'
                                                ? <TrendingUp size={24} strokeWidth={2.5} />
                                                : <TrendingDown size={24} strokeWidth={2.5} />
                                            }
                                        </div>

                                        <h3 className="text-xl font-black text-white mb-0.5">
                                            {selectedTransaction.description || (selectedTransaction.type === 'credit' ? 'Wallet Funding' : 'Payment')}
                                        </h3>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-xs">Transaction Details</p>
                                    </div>
                                </div>

                                {/* Amount Display */}
                                <div className="md:px-4 p-2.5 py-2.5 border-b border-gray-100 dark:border-zinc-800">
                                    <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Amount</p>
                                    <p className={`text-2xl font-black ${selectedTransaction.type === 'credit' || selectedTransaction.type === 'deposit'
                                        ? 'text-emerald-500 dark:text-emerald-300'
                                        : 'text-zinc-900 dark:text-zinc-100'
                                        }`}>
                                        {selectedTransaction.type === 'credit' || selectedTransaction.type === 'deposit' ? '+' : '-'}
                                        {formatCurrency(selectedTransaction.amount)}
                                    </p>
                                </div>

                                {/* Transaction Info */}
                                <div className="md:px-4 p-2.5 py-1.5 space-y-0.5">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-zinc-800">
                                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Type</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedTransaction.type === 'credit' || selectedTransaction.type === 'deposit'
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200'
                                            : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-200'
                                            }`}>
                                            {selectedTransaction.type}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-start py-2 border-b border-gray-50 dark:border-zinc-800">
                                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Description</span>
                                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 text-right max-w-[60%] break-words">
                                            {selectedTransaction.description || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-zinc-800">
                                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Date & Time</span>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                {new Date(selectedTransaction.date || selectedTransaction.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                                {new Date(selectedTransaction.date || selectedTransaction.createdAt).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Transaction ID</span>
                                        <span className="text-[10px] font-mono text-zinc-300 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                            {selectedTransaction._id?.slice(-8).toUpperCase() || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-4 py-2 bg-gray-50 dark:bg-zinc-900">
                                    <button
                                        onClick={() => setShowTransactionModal(false)}
                                        className="w-full py-2.5 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all"
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
