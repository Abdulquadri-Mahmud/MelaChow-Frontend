"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    Clock,
    ChevronLeft,
    RefreshCw,
    AlertCircle,
    Calendar,
    ArrowUpRight,
    Loader2,
    Building2,
    Send,
    CheckCircle2,
    X,
    ChevronDown,
    History,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRider } from "@/app/context/RiderContext";
import {
    getRiderWallet,
    getRiderBankAccount,
    saveRiderBankAccount,
    resolveRiderAccountName,
    initiateWithdrawal,
    getRiderWithdrawalHistory,
    getBankList,
} from "@/app/lib/riderApi";
import toast from "react-hot-toast";

// ── Payout Sheet ──────────────────────────────────────────────────────────────
function PayoutSheet({ riderId, walletBalance, onClose, onSuccess }) {
    const [step, setStep] = useState("loading");
    const [bankAccount, setBankAccount] = useState(null);

    const [banks, setBanks] = useState([]);
    const [loadingBanks, setLoadingBanks] = useState(false);
    const [accountNumber, setAccountNumber] = useState("");
    const [selectedBank, setSelectedBank] = useState("");
    const [resolving, setResolving] = useState(false);
    const [resolvedName, setResolvedName] = useState("");
    const [saving, setSaving] = useState(false);

    const [amount, setAmount] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);

    const resolveTimeout = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getRiderBankAccount(riderId);
                const account = res?.data;
                if (account?.payoutEnabled && account?.accountNumber) {
                    setBankAccount(account);
                    setStep("withdraw");
                } else {
                    setStep("setup");
                }
            } catch {
                setStep("setup");
            }
        };
        const fetchBanks = async () => {
            setLoadingBanks(true);
            try {
                const res = await getBankList();
                if (res.banks) {
                    const seen = new Set();
                    const unique = res.banks.filter(b => {
                        if (seen.has(b.code)) return false;
                        seen.add(b.code);
                        return true;
                    });
                    setBanks(unique);
                }
            } catch { } finally {
                setLoadingBanks(false);
            }
        };
        load();
        fetchBanks();
    }, [riderId]);

    useEffect(() => {
        if (accountNumber.length !== 10 || !selectedBank) {
            setResolvedName("");
            return;
        }
        clearTimeout(resolveTimeout.current);
        resolveTimeout.current = setTimeout(async () => {
            setResolving(true);
            try {
                const res = await resolveRiderAccountName(riderId, accountNumber, selectedBank);
                setResolvedName(res?.data?.accountName || "");
            } catch {
                setResolvedName("");
                toast.error("Could not verify account. Check the number and try again.");
            } finally {
                setResolving(false);
            }
        }, 600);
        return () => clearTimeout(resolveTimeout.current);
    }, [accountNumber, selectedBank]);

    const handleSaveBankAccount = async () => {
        if (!resolvedName || !selectedBank || accountNumber.length !== 10) return;
        const bankObj = banks.find(b => b.code === selectedBank);
        setSaving(true);
        try {
            await saveRiderBankAccount(riderId, {
                accountNumber,
                bankCode: selectedBank,
                bankName: bankObj?.name || "",
            });
            toast.success("Bank account saved!");
            setBankAccount({ bankName: bankObj?.name || "", accountNumber, accountName: resolvedName, payoutEnabled: true });
            setStep("withdraw");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to save bank account. Try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleWithdraw = async () => {
        const numAmount = Number(amount);
        if (!numAmount || numAmount < 1000) { toast.error("Minimum withdrawal is ₦1,000"); return; }
        if (numAmount > walletBalance) { toast.error("Amount exceeds your available balance"); return; }
        setWithdrawing(true);
        setStep("processing");
        try {
            await initiateWithdrawal(riderId, numAmount);
            setStep("done");
            onSuccess?.();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Withdrawal failed. Your balance was not charged.");
            setStep("withdraw");
        } finally {
            setWithdrawing(false);
        }
    };

    const numAmount = Number(amount) || 0;
    let transferFee = 50;
    if (numAmount > 0 && numAmount <= 5000) transferFee = 10;
    else if (numAmount > 5000 && numAmount <= 50000) transferFee = 25;
    const netAmount = Math.max(0, numAmount - transferFee);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#111318] rounded-t-2xl px-4 pt-3 pb-32 shadow-xl max-h-[90vh] overflow-y-auto"
            >
                <div className="w-8 h-1 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mb-4" />
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <X size={14} />
                </button>

                <AnimatePresence mode="wait">
                    {step === "loading" && (
                        <motion.div key="loading" className="flex flex-col items-center py-10 gap-3">
                            <Loader2 className="animate-spin text-orange-500" size={24} />
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Loading...</p>
                        </motion.div>
                    )}

                    {step === "setup" && (
                        <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <div>
                                <h2 className="text-base font-black text-gray-900 dark:text-white">Add Bank Account</h2>
                                <p className="text-gray-500 text-xs font-medium mt-0.5">Verify your account to withdraw earnings.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Number</label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={accountNumber}
                                    onChange={e => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    placeholder="0123456789"
                                    className="w-full h-11 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 text-base font-black tracking-widest text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Bank</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <Building2 size={14} />
                                    </div>
                                    <select
                                        value={selectedBank}
                                        onChange={e => { setSelectedBank(e.target.value); setResolvedName(""); }}
                                        disabled={loadingBanks}
                                        className="w-full h-11 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 pl-9 pr-3 text-xs font-black text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none disabled:opacity-50"
                                    >
                                        <option value="">Choose a bank...</option>
                                        {banks.map(bank => (
                                            <option key={bank.code} value={bank.code}>{bank.name}</option>
                                        ))}
                                    </select>
                                    {loadingBanks && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <Loader2 size={13} className="animate-spin text-orange-500" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <AnimatePresence>
                                {(resolving || resolvedName) && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                        className={`rounded-lg p-3 flex items-center gap-2 ${resolvedName
                                            ? "bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20"
                                            : "bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
                                            }`}
                                    >
                                        {resolving
                                            ? <Loader2 size={14} className="animate-spin text-gray-400 shrink-0" />
                                            : <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                                        }
                                        <div>
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                                {resolving ? "Verifying..." : "Account verified"}
                                            </p>
                                            {resolvedName && (
                                                <p className="text-sm font-black text-gray-900 dark:text-white">{resolvedName}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={handleSaveBankAccount}
                                disabled={!resolvedName || saving}
                                className="w-full h-11 rounded-lg bg-orange-600 text-white font-black text-sm disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <><Building2 size={15} /> Save Bank Account</>}
                            </button>
                        </motion.div>
                    )}

                    {step === "withdraw" && (
                        <motion.div key="withdraw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <div>
                                <h2 className="text-base font-black text-gray-900 dark:text-white">Cash Out</h2>
                                <p className="text-gray-500 text-xs font-medium mt-0.5">Transfer earnings to your bank.</p>
                            </div>

                            {bankAccount && (
                                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                                            <Building2 size={14} className="text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{bankAccount.bankName}</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-white">{bankAccount.accountNumber}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">{bankAccount.accountName}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setAccountNumber(""); setSelectedBank(""); setResolvedName(""); setStep("setup"); }}
                                        className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:text-orange-600 transition-colors"
                                    >
                                        Change
                                    </button>
                                </div>
                            )}

                            <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-lg p-3">
                                <p className="text-[9px] font-black text-orange-600/70 dark:text-orange-400/70 uppercase tracking-widest">Available</p>
                                <p className="text-2xl font-black text-orange-600 dark:text-orange-400">₦{walletBalance.toLocaleString()}</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-black text-gray-400">₦</span>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value.replace(/\D/g, ""))}
                                        placeholder="1000"
                                        className="w-full h-12 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 pl-8 pr-3 text-xl font-black text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-orange-500 transition-colors"
                                    />
                                </div>
                                <div className="flex gap-1.5">
                                    {[1000, 2000, 5000].map(preset => (
                                        <button
                                            key={preset}
                                            onClick={() => setAmount(String(Math.min(preset, walletBalance)))}
                                            className="flex-1 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-[10px] font-black text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 transition-colors"
                                        >
                                            ₦{preset.toLocaleString()}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setAmount(String(walletBalance))}
                                        className="flex-1 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-[10px] font-black text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 transition-colors"
                                    >
                                        All
                                    </button>
                                </div>
                            </div>

                            {numAmount >= 1000 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                    className="bg-gray-50 dark:bg-white/5 rounded-lg p-3 space-y-1.5"
                                >
                                    {[
                                        { label: "Requested", value: `₦${numAmount.toLocaleString()}` },
                                        { label: "Transfer fee", value: `-₦${transferFee}`, muted: true },
                                    ].map(row => (
                                        <div key={row.label} className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-gray-500">{row.label}</span>
                                            <span className={`text-xs font-black ${row.muted ? "text-gray-400" : "text-gray-900 dark:text-white"}`}>{row.value}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-gray-200 dark:border-white/10 pt-1.5 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-700 dark:text-white uppercase tracking-widest">You receive</span>
                                        <span className="text-sm font-black text-green-500">₦{netAmount.toLocaleString()}</span>
                                    </div>
                                </motion.div>
                            )}

                            <button
                                onClick={handleWithdraw}
                                disabled={numAmount < 1000 || numAmount > walletBalance}
                                className="w-full h-11 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black font-black text-sm disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Send size={15} />
                                Withdraw ₦{numAmount > 0 ? numAmount.toLocaleString() : "—"}
                            </button>

                            <p className="text-center text-[10px] text-gray-400 font-medium">
                                Transfers arrive within 1–2 business hours.
                            </p>
                        </motion.div>
                    )}

                    {step === "processing" && (
                        <motion.div key="processing" className="flex flex-col items-center py-10 gap-3">
                            <Loader2 className="animate-spin text-orange-500" size={28} />
                            <div className="text-center">
                                <p className="text-sm font-black text-gray-900 dark:text-white">Processing Transfer</p>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Sending earnings to your bank...</p>
                            </div>
                        </motion.div>
                    )}

                    {step === "done" && (
                        <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8 gap-4 text-center">
                            <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 size={28} className="text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-gray-900 dark:text-white">Transfer Initiated!</h3>
                                <p className="text-gray-500 text-xs font-medium mt-1 max-w-[220px] mx-auto leading-relaxed">
                                    ₦{netAmount.toLocaleString()} is on its way to {bankAccount?.bankName}. Expect it within 1–2 hrs.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="h-10 px-6 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black font-black text-sm active:scale-95 transition-all"
                            >
                                Done
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

// ── Main Wallet Page ──────────────────────────────────────────────────────────
export default function RiderWalletPage() {
    const router = useRouter();
    const { rider } = useRider();
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showPayout, setShowPayout] = useState(false);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
    const [showWithdrawalHistory, setShowWithdrawalHistory] = useState(false);

    const riderId = rider?._id || rider?.id;

    const fetchWallet = async (isRefresh = false) => {
        if (!riderId) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const res = await getRiderWallet(riderId);
            setWallet(res?.data || res);
        } catch {
            toast.error("Failed to update wallet balance");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchWithdrawalHistory = async () => {
        if (!riderId) return;
        setLoadingWithdrawals(true);
        try {
            const res = await getRiderWithdrawalHistory(riderId);
            setWithdrawals(res?.data || []);
        } catch { } finally {
            setLoadingWithdrawals(false);
        }
    };

    useEffect(() => {
        if (riderId) { fetchWallet(); fetchWithdrawalHistory(); }
    }, [riderId]);

    const transactions = wallet?.transactions || [];
    const balance = wallet?.balance || 0;

    const withdrawalStatusStyle = (status) => {
        switch (status) {
            case "completed": return { bg: "bg-green-500/10", text: "text-green-500", label: "Completed" };
            case "processing": return { bg: "bg-blue-500/10", text: "text-blue-500", label: "Processing" };
            case "pending": return { bg: "bg-yellow-500/10", text: "text-yellow-500", label: "Pending" };
            case "failed": return { bg: "bg-red-500/10", text: "text-red-500", label: "Failed" };
            case "reversed": return { bg: "bg-orange-500/10", text: "text-orange-500", label: "Reversed" };
            default: return { bg: "bg-gray-500/10", text: "text-gray-500", label: status };
        }
    };

    if (loading && !refreshing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-orange-500 mb-3" size={28} />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Wallet...</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-5 pb-10">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-700 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-gray-900 dark:text-white">Rider Wallet</h1>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Earnings Management</p>
                        </div>
                    </div>
                    <button
                        onClick={() => fetchWallet(true)}
                        disabled={refreshing}
                        className={`w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-700 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${refreshing ? "animate-spin opacity-50" : ""}`}
                    >
                        <RefreshCw size={15} />
                    </button>
                </div>

                {/* Balance Card */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-gradient-to-br from-orange-600 to-red-700 rounded-2xl p-5 overflow-hidden shadow-lg shadow-orange-600/20 relative">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white/90 mb-3">
                                <RefreshCw size={9} className={refreshing ? "animate-spin" : ""} />
                                Available Balance
                            </div>
                            <div className="flex items-start">
                                <span className="text-base font-black text-white/70 mr-1 mt-1">₦</span>
                                <span className="text-4xl font-black text-white tracking-tight">
                                    {balance.toLocaleString()}
                                </span>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                    <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-0.5">Lifetime</p>
                                    <p className="text-base font-black text-white">₦{Number(rider?.totalEarnings || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                    <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-0.5">Deliveries</p>
                                    <p className="text-base font-black text-white">{rider?.totalDeliveries || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Cash Out Button */}
                <button
                    onClick={() => setShowPayout(true)}
                    disabled={balance < 1000}
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-black font-black py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                    <ArrowUpRight size={17} />
                    {balance < 1000 ? "Min. ₦1,000 to withdraw" : "Cash Out Earnings"}
                </button>

                {/* Withdrawal History */}
                {withdrawals.length > 0 && (
                    <div className="space-y-2">
                        <button
                            onClick={() => setShowWithdrawalHistory(v => !v)}
                            className="w-full flex items-center justify-between"
                        >
                            <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                                <History className="text-orange-500" size={15} />
                                Withdrawal History
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{withdrawals.length} record(s)</span>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform ${showWithdrawalHistory ? "rotate-180" : ""}`} />
                            </div>
                        </button>

                        <AnimatePresence>
                            {showWithdrawalHistory && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2 overflow-hidden"
                                >
                                    {loadingWithdrawals ? (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="animate-spin text-orange-500" size={20} />
                                        </div>
                                    ) : (
                                        withdrawals.map((wd, idx) => {
                                            const s = withdrawalStatusStyle(wd.status);
                                            return (
                                                <motion.div
                                                    key={wd._id || idx}
                                                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.04 }}
                                                    className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded-xl p-3 flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.bg}`}>
                                                            <Send size={14} className={s.text} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-900 dark:text-white">{wd.bankName}</p>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                                {new Date(wd.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-gray-900 dark:text-white">-₦{wd.requestedAmount.toLocaleString()}</p>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                                                            {s.label}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Transaction History */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                            <Clock className="text-orange-500" size={15} />
                            Transaction History
                        </h2>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{transactions.length} record(s)</span>
                    </div>

                    <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                            {transactions.length > 0 ? (
                                transactions.map((tx, idx) => (
                                    <motion.div
                                        key={tx._id || idx}
                                        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className="bg-white dark:bg-[#1A1D23] border border-gray-100 dark:border-white/5 rounded-xl p-3 flex items-center justify-between hover:border-orange-500/20 transition-all group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tx.type === "credit"
                                                ? "bg-green-500/10 text-green-600 dark:text-green-500"
                                                : "bg-red-500/10 text-red-600 dark:text-red-500"
                                                }`}>
                                                {tx.type === "credit" ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">
                                                    {tx.description || (tx.type === "credit" ? "Order Earning" : "Wallet Withdrawal")}
                                                </p>
                                                <p className="text-[10px] text-gray-500 font-bold mt-0.5 flex items-center gap-1 uppercase tracking-widest">
                                                    <Calendar size={9} />
                                                    {new Date(tx.date || tx.createdAt).toLocaleDateString(undefined, {
                                                        month: "short", day: "numeric", year: "numeric",
                                                        hour: "2-digit", minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-black ${tx.type === "credit" ? "text-green-500" : "text-red-500"}`}>
                                                {tx.type === "credit" ? "+" : "-"}₦{tx.amount.toLocaleString()}
                                            </p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Done</p>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="bg-white dark:bg-[#1A1D23] border border-dashed border-gray-200 dark:border-white/5 rounded-xl p-8 flex flex-col items-center justify-center text-center"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3 text-gray-400 dark:text-gray-600">
                                        <Clock size={24} />
                                    </div>
                                    <h3 className="text-gray-900 dark:text-white font-black text-sm mb-1">No Transactions Yet</h3>
                                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest max-w-[180px] leading-relaxed">
                                        Complete a delivery to see earnings here.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Policy */}
                <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-orange-500">
                        <AlertCircle size={14} />
                        <h4 className="font-black text-xs uppercase tracking-widest">Wallet Policy</h4>
                    </div>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed">
                        Earnings credit instantly after delivery. Minimum withdrawal is ₦1,000. A transfer fee (₦10–₦50) applies per payout.
                    </p>
                </div>
            </div>

            <AnimatePresence>
                {showPayout && (
                    <PayoutSheet
                        riderId={riderId}
                        walletBalance={balance}
                        onClose={() => setShowPayout(false)}
                        onSuccess={() => { fetchWallet(); fetchWithdrawalHistory(); }}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
