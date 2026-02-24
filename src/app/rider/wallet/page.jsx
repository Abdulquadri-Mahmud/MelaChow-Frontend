"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    Clock,
    ChevronLeft,
    RefreshCw,
    TrendingUp,
    AlertCircle,
    Calendar,
    ArrowUpRight,
    Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRider } from "@/app/context/RiderContext";
import { getRiderWallet } from "@/app/lib/riderApi";
import toast from "react-hot-toast";

export default function RiderWalletPage() {
    const router = useRouter();
    const { rider } = useRider();
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const riderId = rider?._id || rider?.id;

    const fetchWallet = async (isRefresh = false) => {
        if (!riderId) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const res = await getRiderWallet(riderId);
            // Ensure we extract the 'data' part of the response if it exists
            const walletData = res?.data || res;
            setWallet(walletData);
        } catch (error) {
            console.error("Failed to fetch wallet:", error);
            toast.error("Failed to update wallet balance");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (riderId) {
            fetchWallet();
        }
    }, [riderId]);

    const transactions = wallet?.transactions || [];
    const balance = wallet?.balance || 0;

    if (loading && !refreshing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Accessing Vault...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white italic">Rider Wallet</h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Earnings Management</p>
                    </div>
                </div>
                <button
                    onClick={() => fetchWallet(true)}
                    disabled={refreshing}
                    className={`w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors ${refreshing ? 'animate-spin opacity-50' : ''}`}
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Balance Card Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
            >
                <div className="bg-gradient-to-br from-orange-600 to-red-700 rounded-[40px] p-8 overflow-hidden shadow-2xl shadow-orange-600/20 relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/20 rounded-full -ml-16 -mb-16 blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white/90 mb-4 flex items-center gap-2">
                            <RefreshCw size={10} className={refreshing ? 'animate-spin' : ''} />
                            Available Balance
                        </div>

                        <div className="flex items-start">
                            <span className="text-2xl font-black text-white/70 mr-1 mt-2">₦</span>
                            <span className="text-6xl font-black text-white tracking-tighter italic">
                                {balance.toLocaleString()}
                            </span>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10">
                                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Lifetime</p>
                                <p className="text-lg font-black text-white">₦{Number(rider?.totalEarnings || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10">
                                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Deliveries</p>
                                <p className="text-lg font-black text-white">{rider?.totalDeliveries || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-4">
                <button className="bg-white text-black font-black py-4 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-white/5">
                    <ArrowUpRight size={20} />
                    Cash Out Earnings
                </button>
            </div>

            {/* Transaction History */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Clock className="text-orange-500" size={18} />
                        Transaction History
                    </h2>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{transactions.length} record(s)</span>
                </div>

                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {transactions.length > 0 ? (
                            transactions.map((tx, idx) => (
                                <motion.div
                                    key={tx._id || idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-[#1A1D23] border border-white/5 rounded-3xl p-5 flex items-center justify-between hover:border-orange-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'credit'
                                            ? 'bg-green-500/10 text-green-500'
                                            : 'bg-red-500/10 text-red-500'
                                            }`}>
                                            {tx.type === 'credit' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors uppercase tracking-tight">
                                                {tx.description || (tx.type === 'credit' ? 'Order Earning' : 'Wallet Withdrawal')}
                                            </p>
                                            <p className="text-[10px] text-gray-500 font-bold mt-1 flex items-center gap-1.5 uppercase tracking-widest">
                                                <Calendar size={10} />
                                                {new Date(tx.date || tx.createdAt).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-black italic ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                            {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                                        </p>
                                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Completed</p>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-[#1A1D23] border border-white/5 border-dashed rounded-[40px] p-16 flex flex-col items-center justify-center text-center"
                            >
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 text-gray-600">
                                    <Clock size={40} />
                                </div>
                                <h3 className="text-white font-black text-lg mb-1">No Transactions Yet</h3>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest max-w-[200px] leading-relaxed">
                                    Complete your first delivery to see your earnings flow here.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Help Section */}
            <div className="bg-orange-500/5 border border-orange-500/10 rounded-3xl p-6 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-orange-500">
                    <AlertCircle size={18} />
                    <h4 className="font-black text-sm uppercase tracking-widest">Wallet Policy</h4>
                </div>
                <p className="text-gray-500 text-xs font-medium leading-relaxed">
                    Earning from deliveries are credited instantly after successful delivery. Payouts can be requested once you reach the minimum balance of ₦1,000.
                </p>
            </div>
        </div>
    );
}
