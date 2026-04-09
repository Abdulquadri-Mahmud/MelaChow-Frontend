"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, 
    Building2, 
    User, 
    Hash, 
    AlertCircle, 
    CheckCircle2, 
    Loader2, 
    ArrowRight, 
    Banknote,
    Info,
    ArrowDownToLine
} from "lucide-react";
import { 
    getBankList, 
    resolveBankAccount, 
    saveVendorBankAccount,
    initiateWithdrawal 
} from "../../../lib/vendorApi";

export function ConfigureBankModal({ isOpen, onClose, onSaved, existingDetails }) {
    const [banks, setBanks] = useState([]);
    const [selectedBank, setSelectedBank] = useState(existingDetails?.bankCode || "");
    const [accountNumber, setAccountNumber] = useState(existingDetails?.accountNumber || "");
    const [accountName, setAccountName] = useState(existingDetails?.accountName || "");
    const [isLoadingBanks, setIsLoadingBanks] = useState(false);
    const [isResolving, setIsResolving] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchBanks();
            setSelectedBank(existingDetails?.bankCode || "");
            setAccountNumber(existingDetails?.accountNumber || "");
            setAccountName(existingDetails?.accountName || "");
            setError("");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const fetchBanks = async () => {
        setIsLoadingBanks(true);
        try {
            const res = await getBankList();
            if (res.banks) {
                setBanks(res.banks);
            }
        } catch (err) {
            console.error("Failed to fetch banks:", err);
            setError("Could not load bank list. Please try again.");
        } finally {
            setIsLoadingBanks(false);
        }
    };

    const handleResolve = async () => {
        if (accountNumber.length !== 10 || !selectedBank) return;
        
        setIsResolving(true);
        setError("");
        try {
            const res = await resolveBankAccount(accountNumber, selectedBank);
            if (res.account_name) {
                setAccountName(res.account_name);
            }
        } catch (err) {
            setError("Could not verify account. Please check details.");
            setAccountName("");
        } finally {
            setIsResolving(false);
        }
    };

    // Auto-resolve when bank and 10-digit account number are present
    useEffect(() => {
        if (accountNumber.length !== 10 || !selectedBank || accountName || isResolving) return;

        const resolve = async () => {
            setIsResolving(true);
            setError("");
            try {
                const res = await resolveBankAccount(accountNumber, selectedBank);
                if (res.account_name) {
                    setAccountName(res.account_name);
                }
            } catch {
                setError("Could not verify account. Please check details.");
                setAccountName("");
            } finally {
                setIsResolving(false);
            }
        };

        resolve();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountNumber, selectedBank]);

    const handleSave = async () => {
        if (!selectedBank || !accountNumber || !accountName) {
            setError("Please fill all fields and verify the account.");
            return;
        }

        setIsSaving(true);
        setError("");
        try {
            const bankObj = banks.find(b => b.code === selectedBank);
            await saveVendorBankAccount({
                bank_name: bankObj?.name || "",
                bank_code: selectedBank,
                account_number: accountNumber,
                account_name: accountName
            });
            onSaved();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save bank account.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Setup Bank Payout</h2>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-widest">Register your local bank for withdrawals.</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-slate-400 transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-5">
                        {error && (
                            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-md flex items-center gap-3 text-rose-600">
                                <AlertCircle size={16} className="shrink-0" />
                                <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Bank Selection */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Bank</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Building2 size={16} />
                                    </div>
                                    <select
                                        value={selectedBank}
                                        onChange={(e) => {
                                            setSelectedBank(e.target.value);
                                            setAccountName("");
                                        }}
                                        disabled={isLoadingBanks}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 appearance-none uppercase tracking-tight"
                                    >
                                        <option value="">Choose a bank...</option>
                                        {banks.map((bank) => (
                                            <option key={bank.code} value={bank.code}>{bank.name}</option>
                                        ))}
                                    </select>
                                    {isLoadingBanks && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Loader2 size={14} className="animate-spin text-orange-500" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Account Number */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Hash size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={10}
                                        placeholder="0123456789"
                                        value={accountNumber}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, "");
                                            setAccountNumber(val);
                                            if (val.length !== 10) setAccountName("");
                                        }}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 tracking-[0.2em] placeholder:tracking-normal"
                                    />
                                    {isResolving && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Loader2 size={14} className="animate-spin text-orange-500" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Resolved Name */}
                            <AnimatePresence>
                                {accountName && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-md"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 rounded-md">
                                                <User size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest leading-none">Account Name Verified</p>
                                                <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase mt-1 tracking-tight">{accountName}</p>
                                            </div>
                                            <div className="text-emerald-600">
                                                <CheckCircle2 size={18} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!accountName || isSaving}
                            className="flex-[2] px-4 py-3 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Save Bank Details"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export function WithdrawFundsModal({ isOpen, onClose, balance, onInitiated, payoutDetails }) {
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const amountNum = Number(amount) || 0;
    
    // Fee Logic
    const fees = useMemo(() => {
        if (amountNum <= 0) return 0;
        if (amountNum <= 5000) return 10;
        if (amountNum <= 50000) return 25;
        return 50;
    }, [amountNum]);

    const netAmount = Math.max(0, amountNum - fees);

    const handleSubmit = async () => {
        if (amountNum < 1000) {
            setError("Minimum withdrawal is ₦1,000");
            return;
        }
        if (amountNum > balance) {
            setError("Insufficient balance");
            return;
        }

        setIsSubmitting(true);
        setError("");
        try {
            await initiateWithdrawal(amountNum);
            onInitiated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to initiate withdrawal.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
                >
                    <div className="p-5 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Withdraw Funds</h2>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-widest">Available: ₦{balance.toLocaleString()}</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-5 space-y-5">
                        {error && (
                            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-md flex items-center gap-3 text-rose-600">
                                <AlertCircle size={16} className="shrink-0" />
                                <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Amount Input */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Withdrawal Amount (₦)</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900 dark:text-white font-black">
                                        ₦
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-9 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md text-2xl font-black text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 tracking-tight"
                                    />
                                </div>
                                <div className="flex justify-between px-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min: ₦1,000</p>
                                    <button 
                                        onClick={() => setAmount(balance.toString())}
                                        className="text-[9px] font-black text-orange-600 uppercase tracking-widest"
                                    >
                                        Withdraw Max
                                    </button>
                                </div>
                            </div>

                            {/* Fee Breakdown */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400">Total Requested</span>
                                    <span className="text-slate-900 dark:text-white">₦{amountNum.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400 flex items-center gap-1">
                                        Paystack Fee <Info size={10} className="text-slate-300" />
                                    </span>
                                    <span className="text-rose-500">- ₦{fees.toLocaleString()}</span>
                                </div>
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Net Payout</span>
                                    <span className="text-lg font-black text-emerald-600 tracking-tight">₦{netAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Destination Bank */}
                            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-md">
                                <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-md">
                                    <Building2 size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[8px] font-black text-blue-600/60 uppercase tracking-widest leading-none mb-1">Settling To</p>
                                    <p className="text-[10px] font-black text-blue-900 dark:text-blue-300 uppercase truncate leading-none">
                                        {payoutDetails?.bankName} — {payoutDetails?.accountNumber}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 pt-0">
                        <button
                            onClick={handleSubmit}
                            disabled={amountNum < 1000 || amountNum > balance || isSubmitting}
                            className="w-full py-4 bg-orange-600 text-white rounded-md text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                        >
                            {isSubmitting ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <>
                                    <ArrowDownToLine size={16} />
                                    Initiate Withdrawal
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
