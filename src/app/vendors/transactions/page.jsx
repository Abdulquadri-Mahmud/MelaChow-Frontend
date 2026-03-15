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
    Clock
} from "lucide-react";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import { getVendorWallet } from "@/app/lib/vendorApi";

export default function TransactionsPage() {
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("all");
    const [selectedMonth, setSelectedMonth] = useState("all");
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const { vendorDetails } = useVendorStorage();

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const res = await getVendorWallet();
                if (res.success && res.data) {
                    setWallet(res.data);
                    const sortedTxns = (res.data.transactions || []).sort((a, b) =>
                        new Date(b.date) - new Date(a.date)
                    );
                    setTransactions(sortedTxns);
                }
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    // Wallet not created yet, show empty state
                    setWallet({ balance: 0 });
                    setTransactions([]);
                } else {
                    console.error("Failed to fetch wallet:", err);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchWallet();
    }, [vendorDetails]);

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
GrubDash Vendor Platform
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
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0F172A]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Loading transactions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] font-sans">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Transactions</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track your earnings and manage payouts</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={downloadReport}
                        className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        <Download size={18} />
                        Export Report
                    </motion.button>
                </motion.div>

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Balance Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="md:col-span-1 bg-gradient-to-br from-[#FF6B00] to-orange-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-orange-500/20"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Wallet size={20} className="opacity-80" />
                                <p className="text-white/80 text-sm font-medium">Available Balance</p>
                            </div>
                            <h2 className="text-4xl font-bold tracking-tight mb-6">₦{wallet?.balance?.toLocaleString() || "0.00"}</h2>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-white text-[#FF6B00] px-4 py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                <CreditCard size={18} />
                                Withdraw Funds
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Credits Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 border border-slate-200 dark:border-slate-800"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-100 dark:bg-green-500/10 rounded-xl text-green-600 dark:text-green-400">
                                <TrendingUp size={24} />
                            </div>
                            <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-3 py-1 rounded-full">
                                +{stats.creditCount}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Credits</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            ₦{stats.totalCredits.toLocaleString()}
                        </p>
                    </motion.div>

                    {/* Debits Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 border border-slate-200 dark:border-slate-800"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-500/10 rounded-xl text-red-600 dark:text-red-400">
                                <TrendingDown size={24} />
                            </div>
                            <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-full">
                                -{stats.debitCount}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Debits</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            ₦{stats.totalDebits.toLocaleString()}
                        </p>
                    </motion.div>
                </div>

                {/* Transactions List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                >

                    {/* Filters Header */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-xl text-slate-900 dark:text-white">Transaction History</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {/* Type Filter */}
                                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                                    {['all', 'credit', 'debit'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setTypeFilter(type)}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${typeFilter === type
                                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                                }`}
                                        >
                                            {type === 'all' ? 'All' : type === 'credit' ? 'Credits' : 'Debits'}
                                        </button>
                                    ))}
                                </div>

                                {/* Month Filter Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <Calendar size={16} />
                                        {formatMonthYear(selectedMonth)}
                                        <ChevronDown size={16} className={`transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {showMonthDropdown && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-20"
                                            >
                                                <div className="p-2 max-h-64 overflow-y-auto">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMonth("all");
                                                            setShowMonthDropdown(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedMonth === "all"
                                                            ? 'bg-[#FF6B00] text-white'
                                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
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
                                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedMonth === month
                                                                ? 'bg-[#FF6B00] text-white'
                                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
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
                                        className="flex items-center gap-1 px-3 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <X size={14} />
                                        Clear
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">
                                <tr>
                                    <th className="px-6 py-4">Transaction</th>
                                    <th className="px-6 py-4">Reference</th>
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                <AnimatePresence mode="popLayout">
                                    {filteredTransactions.length > 0 ? (
                                        filteredTransactions.map((txn, index) => (
                                            <motion.tr
                                                key={txn._id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ delay: index * 0.02 }}
                                                onClick={() => {
                                                    setSelectedTransaction(txn);
                                                    setShowModal(true);
                                                }}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2.5 rounded-xl ${txn.type === 'credit'
                                                            ? 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                                                            : 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                                                            }`}>
                                                            {txn.type === 'credit' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{txn.description || "Transaction"}</p>
                                                            <p className="text-xs text-slate-500 capitalize">{txn.type}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                                        {txn._id.slice(-8).toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {formatDate(txn.date)}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-bold ${txn.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'
                                                    }`}>
                                                    {txn.type === 'credit' ? '+' : '-'}₦{txn.amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                                                        Success
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                                                        <Wallet size={32} className="text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-700 dark:text-slate-300">No transactions found</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try adjusting your filters</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </motion.div>

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
                            className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl overflow-hidden"
                        >
                            {/* Header with Gradient */}
                            <div className={`relative p-6 ${transaction.type === 'credit'
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                : 'bg-gradient-to-br from-[#FF6B00] to-orange-600'
                                } text-white`}>
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                                                {transaction.type === 'credit' ? (
                                                    <ArrowUpRight size={24} className="text-white" />
                                                ) : (
                                                    <ArrowDownLeft size={24} className="text-white" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-white/80 text-sm font-medium">
                                                    {transaction.type === 'credit' ? 'Money Received' : 'Money Sent'}
                                                </p>
                                                <h2 className="text-3xl font-bold tracking-tight">
                                                    {transaction.type === 'credit' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                                                </h2>
                                            </div>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm">
                                            <Check size={14} />
                                            Success
                                        </span>
                                        <span className="text-white/60 text-xs">
                                            {formatDate(transaction.date)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-6">
                                {/* Transaction Details */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                                        Transaction Details
                                    </h3>

                                    <div className="space-y-3">
                                        {/* Description */}
                                        <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                                                    <FileText size={18} className="text-slate-600 dark:text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Description</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {transaction.description || "Transaction"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reference ID */}
                                        <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                                                    <FileText size={18} className="text-slate-600 dark:text-slate-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Reference ID</p>
                                                    <p className="text-sm font-mono font-bold text-slate-900 dark:text-white truncate">
                                                        {transaction._id}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleCopy(transaction._id)}
                                                className="ml-2 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            >
                                                {copied ? (
                                                    <Check size={16} className="text-green-600" />
                                                ) : (
                                                    <Copy size={16} className="text-slate-400" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Date & Time */}
                                        <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                                                    <Clock size={18} className="text-slate-600 dark:text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Date & Time</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {formatDate(transaction.date)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Transaction Type */}
                                        <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                                                    <Wallet size={18} className="text-slate-600 dark:text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Type</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                                                        {transaction.type}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleCopy(transaction._id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors"
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={18} />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={18} />
                                                Copy ID
                                            </>
                                        )}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => downloadReceipt(transaction)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#FF6B00] hover:bg-orange-600 rounded-xl text-sm font-bold text-white transition-colors"
                                    >
                                        <Download size={18} />
                                        Download Receipt
                                    </motion.button>
                                </div>

                                {/* Help Text */}
                                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                                    Need help? Contact support with your reference ID
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
