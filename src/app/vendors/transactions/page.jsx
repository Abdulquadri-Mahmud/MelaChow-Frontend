"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    Calendar,
    Download,
    CreditCard,
    TrendingUp,
    TrendingDown,
    ChevronDown,
    X,
    Copy,
    Check,
    ExternalLink,
    FileText,
    Clock,
    RotateCw,
    Building2
} from "lucide-react";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import { 
    getVendorWallet, 
    getVendorPayoutDetails, 
    getWithdrawalHistory 
} from "@/app/lib/vendorApi";
import { ConfigureBankModal, WithdrawFundsModal } from "./components/PayoutModals";

export default function TransactionsPage() {
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [vendorProfile, setVendorProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [typeFilter, setTypeFilter] = useState("all");
    const [activeTab, setActiveTab] = useState("ledger"); // ledger | payouts
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const { vendorDetails } = useVendorStorage();

    const fetchWallet = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            // Fetch wallet and transactions
            const walletRes = await getVendorWallet();
            if (walletRes.success && walletRes.data) {
                setWallet(walletRes.data);
                const sortedTxns = (walletRes.data.transactions || []).sort((a, b) =>
                    new Date(b.date) - new Date(a.date)
                );
                setTransactions(sortedTxns);
            }

            // Fetch payout details — dedicated endpoint, never exposes recipientCode
            try {
                const payoutRes = await getVendorPayoutDetails();
                if (payoutRes?.success) {
                    setVendorProfile({ payoutDetails: payoutRes.payoutDetails });
                }
            } catch (payoutErr) {
                console.error("Payout details fetch error:", payoutErr.message);
            }

            // Fetch withdrawal history — backend returns { withdrawals: [...] }
            try {
                const withdrawalRes = await getWithdrawalHistory();
                setWithdrawals(withdrawalRes?.withdrawals || []);
            } catch (withdrawErr) {
                console.error("Withdrawal history fetch error:", withdrawErr.message);
                setWithdrawals([]);
            }

        } catch (err) {
            console.error("Transactions fetch error:", err);
            // Handle wallet not created (404) by providing a default empty balance
            if (err.response?.status === 404) {
                setWallet({ balance: 0, transactions: [] });
            }
            // Note: 500 errors are caught but we don't set partial state to avoid loop triggers
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchWallet();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Get available months from transactions
    const availableMonths = useMemo(() => {
        const months = new Set();
        transactions.forEach(txn => {
            const date = new Date(txn.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.add(monthYear);
        });
        return Array.from(months).sort().reverse();
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(txn => {
            // Type filter
            if (typeFilter !== "all" && txn.type !== typeFilter) return false;

            // Month filter
            if (selectedMonth !== "all") {
                const txnDate = new Date(txn.date);
                const txnMonthYear = `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}`;
                if (txnMonthYear !== selectedMonth) return false;
            }

            return true;
        });
    }, [transactions, typeFilter, selectedMonth]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatMonthYear = (monthYear) => {
        if (monthYear === "all") return "All Time";
        const [year, month] = monthYear.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    };

    // Download CSV Report
    const downloadReport = () => {
        const csvContent = [
            ['Transaction ID', 'Description', 'Type', 'Amount', 'Date', 'Status'],
            ...filteredTransactions.map(txn => [
                txn._id,
                txn.description || 'Transaction',
                txn.type,
                `₦${txn.amount.toLocaleString()}`,
                formatDate(txn.date),
                'Success'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `transactions_${selectedMonth === 'all' ? 'all_time' : selectedMonth}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Download Single Transaction Receipt
    const downloadReceipt = (transaction) => {
        const receiptContent = `
TRANSACTION RECEIPT
==========================================

Transaction ID: ${transaction._id}
Description: ${transaction.description || 'Transaction'}
Type: ${transaction.type.toUpperCase()}
Amount: ${transaction.type === 'credit' ? '+' : '-'}₦${transaction.amount.toLocaleString()}
Date: ${formatDate(transaction.date)}
Status: SUCCESS

==========================================
MelaChow Vendor Platform
Need help? Contact support with your reference ID
        `.trim();

        const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `receipt_${transaction._id.slice(-8)}.txt`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate stats for filtered transactions
    const stats = useMemo(() => {
        const credits = filteredTransactions.filter(t => t.type === 'credit');
        const debits = filteredTransactions.filter(t => t.type === 'debit');

        return {
            totalCredits: credits.reduce((acc, curr) => acc + curr.amount, 0),
            totalDebits: debits.reduce((acc, curr) => acc + curr.amount, 0),
            creditCount: credits.length,
            debitCount: debits.length
        };
    }, [filteredTransactions]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-md animate-spin" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loading Ledger...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 p-4">
            <div className="max-w-6xl mx-auto space-y-4">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Financial Ledger</h1>
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-widest">Track earnings and manage platform payouts.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchWallet(true)}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 rounded-md text-[10px] font-black uppercase tracking-widest border border-orange-200 dark:border-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            <RotateCw size={14} className={isRefreshing ? "animate-spin" : ""} strokeWidth={2.5} />
                            Refresh
                        </button>
                        <button
                            onClick={downloadReport}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                        >
                            <Download size={14} />
                            Export Ledger
                        </button>
                    </div>
                </motion.div>

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

                    {/* Escrow Banner */}
                    <div className="md:col-span-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-800/50 rounded-md p-3 flex items-start gap-3">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-800 text-blue-600 rounded-md flex-shrink-0">
                            <Wallet size={14} />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-tight text-blue-900 dark:text-blue-300 leading-none">Escrow Protection Active</h4>
                            <p className="text-[9px] text-blue-700 dark:text-blue-400/80 mt-1 leading-relaxed font-black uppercase tracking-widest">
                                Revenue is safely held in Escrow and credited upon Delivery.
                            </p>
                        </div>
                    </div>

                    {/* Main Balance Card */}
                    <div className="md:col-span-1 bg-orange-600 rounded-md p-5 text-white relative flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1 leading-none">
                                <Wallet size={12} className="opacity-80" />
                                <p className="text-white/80 text-[10px] font-black uppercase tracking-widest">Available Balance</p>
                            </div>
                            <h2 className="text-3xl font-black tracking-tight leading-none my-2">₦{wallet?.balance?.toLocaleString() || "0.00"}</h2>
                        </div>
                        <button 
                            onClick={() => {
                                if (!vendorProfile?.payoutDetails?.payoutEnabled) {
                                    setShowBankModal(true);
                                } else {
                                    setShowWithdrawModal(true);
                                }
                            }}
                            className="w-full bg-white text-orange-600 px-4 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                        >
                            <CreditCard size={14} />
                            {vendorProfile?.payoutDetails?.payoutEnabled ? "Withdraw Funds" : "Link Bank Account"}
                        </button>
                    </div>

                    {/* Pending Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-md p-4 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-md text-blue-600">
                                <Clock size={16} />
                            </div>
                            <span className="text-[9px] font-black text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-blue-100 dark:border-blue-500/20">
                                In Escrow
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 mb-1 font-black uppercase tracking-widest leading-none">Pending Balance</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white leading-none">
                                ₦{wallet?.pendingBalance?.toLocaleString() || "0.00"}
                            </p>
                        </div>
                    </div>

                    {/* Earnings Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-md p-4 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-md text-emerald-600">
                                <TrendingUp size={16} />
                            </div>
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                                Lifetime
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 mb-1 font-black uppercase tracking-widest leading-none">Total Earned</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white leading-none">
                                ₦{wallet?.totalEarned?.toLocaleString() || "0.00"}
                            </p>
                        </div>
                    </div>

                    {/* Withdrawn Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-md p-4 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-md text-rose-600">
                                <TrendingDown size={16} />
                            </div>
                            <span className="text-[9px] font-black text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-rose-100 dark:border-rose-500/20">
                                Disbursed
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 mb-1 font-black uppercase tracking-widest leading-none">Total Withdrawn</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white leading-none">
                                ₦{wallet?.totalWithdrawn?.toLocaleString() || "0.00"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bank Configuration Banner */}
                {!vendorProfile?.payoutDetails?.accountNumber && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-orange-600 p-4 rounded-md flex flex-col md:flex-row items-center justify-between gap-4 border-2 border-orange-500/30 shadow-lg shadow-orange-600/10"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-md text-white">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-black uppercase tracking-tight text-sm">Payout Destination Missing</h3>
                                <p className="text-white/70 text-[9px] font-black uppercase tracking-widest">Connect your bank account to receive settled platform revenue.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowBankModal(true)}
                            className="bg-white text-orange-600 px-6 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all active:scale-95 shrink-0"
                        >
                            Configure Settlements
                        </button>
                    </motion.div>
                )}

                {/* Account Details Display (If configured) */}
                {vendorProfile?.payoutDetails?.accountNumber && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-md p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-md text-slate-400">
                                <Building2 size={14} />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Settlement Destination</p>
                                <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                    {vendorProfile.payoutDetails.bankName} • {vendorProfile.payoutDetails.accountNumber}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowBankModal(true)}
                            className="text-[9px] font-black text-orange-600 uppercase tracking-widest hover:underline"
                        >
                            Update Bank Info
                        </button>
                    </div>
                )}

                {/* Transactions List */}
                <div
                    className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-800/50 overflow-hidden shadow-xl shadow-slate-200/30 dark:shadow-none"
                >

                    {/* Filters Header */}
                    <div className="p-5 border-b border-slate-50 dark:border-slate-800/50">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="space-y-0.5">
                                <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Transaction History</h3>
                                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} recorded
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2.5">
                                {/* Tab Switcher */}
                                <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-md border border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => setActiveTab("ledger")}
                                        className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "ledger"
                                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-none border border-slate-100 dark:border-slate-700'
                                            : 'text-slate-500 dark:text-slate-400'
                                            }`}
                                    >
                                        Ledger
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("payouts")}
                                        className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "payouts"
                                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-none border border-slate-100 dark:border-slate-700'
                                            : 'text-slate-500 dark:text-slate-400'
                                            }`}
                                    >
                                        Payouts
                                    </button>
                                </div>

                                {/* Type Filter (Only for ledger) */}
                                {activeTab === "ledger" && (
                                    <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-md border border-slate-100 dark:border-slate-800">
                                        {['all', 'credit', 'debit'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setTypeFilter(type)}
                                                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === type
                                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-none border border-slate-100 dark:border-slate-700'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 transition-colors'
                                                    }`}
                                            >
                                                {type === 'all' ? 'All' : type === 'credit' ? 'Credits' : 'Debits'}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Month Filter Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all active:scale-95"
                                    >
                                        <Calendar size={14} />
                                        {formatMonthYear(selectedMonth)}
                                        <ChevronDown size={14} className={`transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {showMonthDropdown && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-md shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden z-20"
                                            >
                                                <div className="p-1 max-h-64 overflow-y-auto">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMonth("all");
                                                            setShowMonthDropdown(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${selectedMonth === "all"
                                                            ? 'bg-orange-600 text-white'
                                                            : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                            }`}
                                                    >
                                                        All Time
                                                    </button>
                                                    {availableMonths.map((month) => (
                                                        <button
                                                            key={month}
                                                            onClick={() => {
                                                                setSelectedMonth(month);
                                                                setShowMonthDropdown(false);
                                                            }}
                                                            className={`w-full text-left px-3 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${selectedMonth === month
                                                                ? 'bg-orange-600 text-white'
                                                                : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                                }`}
                                                        >
                                                            {formatMonthYear(month)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Clear Filters */}
                                {(typeFilter !== 'all' || selectedMonth !== 'all') && (
                                    <motion.button
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        onClick={() => {
                                            setTypeFilter('all');
                                            setSelectedMonth('all');
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors"
                                    >
                                        <X size={14} />
                                        Reset
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {activeTab === "ledger" ? (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 text-[9px] uppercase font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-5 py-3">Transaction</th>
                                        <th className="px-5 py-3">Reference</th>
                                        <th className="px-5 py-3 text-center">Date & Time</th>
                                        <th className="px-5 py-3 text-right">Amount</th>
                                        <th className="px-5 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {filteredTransactions.length > 0 ? (
                                        filteredTransactions.map((txn, index) => (
                                            <tr
                                                key={txn._id}
                                                onClick={() => {
                                                    setSelectedTransaction(txn);
                                                    setShowModal(true);
                                                }}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group cursor-pointer"
                                            >
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`p-1.5 rounded-md ${txn.type === 'credit'
                                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-600/10'
                                                            : 'bg-rose-50 text-rose-600 dark:bg-rose-600/10'
                                                            }`}>
                                                            {txn.type === 'credit' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{txn.description || "Transaction"}</p>
                                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{txn.type}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className="text-[9px] font-black text-slate-400 px-2 py-0.5 border border-slate-100 dark:border-slate-800 rounded-md uppercase tracking-widest">
                                                        {txn._id.slice(-8).toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 text-center uppercase tracking-widest">
                                                    {formatDate(txn.date)}
                                                </td>
                                                <td className={`px-5 py-3 text-right font-black text-[11px] ${txn.type === 'credit' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'
                                                    }`}>
                                                    {txn.type === 'credit' ? '+' : '-'}₦{txn.amount.toLocaleString()}
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 dark:bg-emerald-600/10 border border-emerald-100 dark:border-emerald-600/20">
                                                        Success
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No ledger entries found.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 text-[9px] uppercase font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-5 py-3">Payout Ref</th>
                                        <th className="px-5 py-3">Destination</th>
                                        <th className="px-5 py-3 text-center">Initiated</th>
                                        <th className="px-5 py-3 text-right">Net Amount</th>
                                        <th className="px-5 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {withdrawals.length > 0 ? (
                                        withdrawals.map((withdraw) => (
                                            <tr key={withdraw._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all cursor-default">
                                                <td className="px-5 py-4">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{withdraw.paystackReference || "Pending Ref"}</p>
                                                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">WD-{withdraw._id.slice(-6).toUpperCase()}</p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{withdraw.bankName}</p>
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{withdraw.accountNumber}</p>
                                                </td>
                                                <td className="px-5 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 text-center uppercase tracking-widest">
                                                    {formatDate(withdraw.initiatedAt)}
                                                </td>
                                                <td className="px-5 py-4 text-right font-black text-[11px] text-slate-900 dark:text-white">
                                                    ₦{withdraw.netAmount.toLocaleString()}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                                        withdraw.status === "completed" 
                                                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-600/10 dark:border-emerald-600/20"
                                                            : withdraw.status === "failed" || withdraw.status === "reversed"
                                                            ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-600/10 dark:border-rose-600/20"
                                                            : "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-600/10 dark:border-blue-600/20"
                                                    }`}>
                                                        {withdraw.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No payout history found.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Modals */}
                <ConfigureBankModal 
                    isOpen={showBankModal}
                    onClose={() => setShowBankModal(false)}
                    onSaved={() => fetchWallet(true)}
                    existingDetails={vendorProfile?.payoutDetails}
                />

                <WithdrawFundsModal 
                    isOpen={showWithdrawModal}
                    onClose={() => setShowWithdrawModal(false)}
                    balance={wallet?.balance || 0}
                    onInitiated={() => {
                        fetchWallet(true);
                        setActiveTab("payouts");
                    }}
                    payoutDetails={vendorProfile?.payoutDetails}
                />

                {/* Transaction Details Modal */}
                <TransactionDetailsModal
                    transaction={selectedTransaction}
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedTransaction(null);
                    }}
                    formatDate={formatDate}
                    downloadReceipt={downloadReceipt}
                />
            </div>
        </div>
    );
}

// Premium Transaction Details Modal Component
function TransactionDetailsModal({ transaction, isOpen, onClose, formatDate, downloadReceipt }) {
    const [copied, setCopied] = useState(false);

    if (!transaction) return null;

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden"
                        >
                            {/* Header with Background */}
                            <div className={`relative p-5 ${transaction.type === 'credit'
                                ? 'bg-emerald-600'
                                : 'bg-orange-600'
                                } text-white`}>
                                <div className="relative z-10 text-center">
                                    <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                                        Transaction Receipt
                                    </p>
                                    <div className="inline-flex p-3 bg-white/20 rounded-md mb-3">
                                        {transaction.type === 'credit' ? (
                                            <ArrowUpRight size={24} className="text-white" />
                                        ) : (
                                            <ArrowDownLeft size={24} className="text-white" />
                                        )}
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tighter">
                                        {transaction.type === 'credit' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                                    </h2>
                                    <div className="mt-4 flex flex-col items-center gap-1.5 px-4 py-2 bg-black/10 rounded-md">
                                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                            <Check size={12} /> Success
                                        </span>
                                        <span className="text-white/60 text-[9px] font-black uppercase tracking-widest leading-none">
                                            {formatDate(transaction.date)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-5 space-y-4">
                                {/* Transaction Details */}
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                                        Data Points
                                    </h3>

                                    <div className="space-y-2">
                                        {/* Description */}
                                        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800">
                                                    <FileText size={14} className="text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Description</p>
                                                    <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {transaction.description || "Transaction"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reference ID */}
                                        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="p-2 bg-white dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800">
                                                    <FileText size={14} className="text-slate-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Reference ID</p>
                                                    <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                                                        {transaction._id}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleCopy(transaction._id)}
                                                className="ml-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md transition-all active:scale-90"
                                            >
                                                {copied ? (
                                                    <Check size={12} className="text-emerald-600" />
                                                ) : (
                                                    <Copy size={12} className="text-slate-400" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Date & Time */}
                                        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800">
                                                    <Clock size={14} className="text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Timestamp</p>
                                                    <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {formatDate(transaction.date)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Transaction Type */}
                                        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800">
                                                    <Wallet size={14} className="text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Classification</p>
                                                    <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {transaction.type}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2.5 pt-4 border-t border-slate-50 dark:border-slate-800">
                                    <button
                                        onClick={() => handleCopy(transaction._id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 transition-all active:scale-95"
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={14} />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} />
                                                Copy Hash
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => downloadReceipt(transaction)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                    >
                                        <Download size={14} />
                                        Ledger PDF
                                    </button>
                                </div>

                                {/* Help Text */}
                                <p className="text-[9px] font-black text-center text-slate-400 uppercase tracking-widest">
                                    Support Reference: hash-{transaction._id.slice(-8)}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

