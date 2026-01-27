"use client";

import React, { useState, useEffect } from "react";
import { useProfile } from "@/app/context/ProfileContext";
import { getWallet, fundWallet } from "@/app/lib/api";
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Calendar, CreditCard, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function UserWalletPage() {
    const { userProfile, isLoading: isProfileLoading } = useProfile();
    const [walletData, setWalletData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFunding, setIsFunding] = useState(false);
    const [amount, setAmount] = useState("");
    const [showFundModal, setShowFundModal] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            setIsLoading(true);
            const data = await getWallet();
            setWalletData(data.wallet);
        } catch (error) {
            toast.error("Failed to load wallet data.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFundWallet = async (e) => {
        e.preventDefault();
        if (!amount || isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }

        if (!userProfile?.email) {
            toast.error("User email not found. Please update your profile.");
            return;
        }

        try {
            setIsFunding(true);
            const res = await fundWallet({ amount: Number(amount), email: userProfile.email });
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

    if (isProfileLoading || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
                <p className="text-gray-500 font-medium animate-pulse">Loading wallet...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
                    <p className="text-gray-500 mt-1">Manage your funds and transactions</p>
                </div>
                <button
                    onClick={() => setShowFundModal(true)}
                    className="bg-gray-900 text-white px-5 py-2.5 rounded-full font-bold flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg hover:shadow-orange-200"
                >
                    <Plus size={18} />
                    Fund Wallet
                </button>
            </div>

            {/* Balance Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-[32px] p-8 shadow-2xl text-white"
            >
                <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <Wallet size={20} />
                            <span className="text-sm font-medium uppercase tracking-wider">Available Balance</span>
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black tracking-tight">
                            ₦{walletData?.balance?.toLocaleString() || "0.00"}
                        </h2>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Status</p>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="font-bold text-emerald-400">Active</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Transactions */}
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <CreditCard size={20} className="text-orange-500" />
                    Recent Transactions
                </h3>

                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                    {(!walletData?.transactions || walletData.transactions.length === 0) ? (
                        <div className="py-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Wallet size={24} className="text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">No transactions yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {walletData.transactions.map((tx, idx) => (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={tx._id || idx} // Fallback to idx if no _id
                                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'credit' || tx.type === 'deposit'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'bg-red-50 text-red-600'
                                            }`}>
                                            {tx.type === 'credit' || tx.type === 'deposit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 capitalize">
                                                {tx.description || (tx.type === 'credit' ? 'Wallet Funding' : 'Payment')}
                                            </h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                                <Calendar size={12} />
                                                <span>{new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-bold ${tx.status === 'success'
                                                ? (tx.type === 'credit' || tx.type === 'deposit' ? 'text-emerald-600' : 'text-gray-900')
                                                : 'text-amber-500' // Pending or Failed
                                            }`}>
                                            {tx.type === 'credit' || tx.type === 'deposit' ? '+' : '-'}₦{tx.amount?.toLocaleString()}
                                        </p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${tx.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                                                tx.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Fund Modal */}
            <AnimatePresence>
                {showFundModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowFundModal(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 m-auto w-full max-w-sm h-fit bg-white rounded-[32px] p-6 shadow-2xl z-50 border border-gray-100"
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Fund Your Wallet</h3>
                            <p className="text-gray-500 text-sm mb-6">Enter the amount you want to add to your user wallet.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Amount (₦)</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="e.g. 5000"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowFundModal(false)}
                                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleFundWallet}
                                        disabled={isFunding}
                                        className="flex-1 py-3 bg-gray-900 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isFunding ? <Loader2 className="animate-spin" size={18} /> : "Pay Now"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
