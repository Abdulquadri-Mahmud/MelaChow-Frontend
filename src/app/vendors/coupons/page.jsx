"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDiscounts, createDiscount } from "@/app/lib/api";
import { Loader2, Plus, Tag, TicketPercent, Trash2, Calendar, DollarSign, Percent } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function CouponsPage() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        code: "",
        discountType: "PERCENTAGE", // or FIXED
        value: "",
        minOrderAmount: "",
        maxDiscountAmount: "",
        expiresAt: "",
        usageLimit: ""
    });

    // Fetch Discounts
    const { data: discountsData, isLoading } = useQuery({
        queryKey: ["vendorDiscounts"],
        queryFn: getDiscounts,
    });

    const discounts = discountsData?.discounts || [];

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: createDiscount,
        onSuccess: () => {
            queryClient.invalidateQueries(["vendorDiscounts"]);
            toast.success("Coupon created successfully!");
            setIsCreating(false);
            setFormData({
                code: "",
                discountType: "PERCENTAGE",
                value: "",
                minOrderAmount: "",
                maxDiscountAmount: "",
                expiresAt: "",
                usageLimit: ""
            });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to create coupon");
        }
    });

    const handleCreate = (e) => {
        e.preventDefault();
        if (!formData.code || !formData.value) return toast.error("Please fill required fields");

        // Convert types
        const payload = {
            ...formData,
            value: Number(formData.value),
            minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : 0,
            maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
            usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        };

        createMutation.mutate(payload);
    };

    return (
        <div className="space-y-4 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Discount Coupons</h1>
                    <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-widest">Create and manage your promo codes</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-md font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-none"
                >
                    <Plus size={16} />
                    Create Coupon
                </button>
            </header>

            {/* Creation Form Modal/Panel */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white dark:bg-zinc-900 rounded-md p-4 border border-zinc-100 dark:border-zinc-800 shadow-none overflow-hidden"
                    >
                        <h3 className="text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-tight">
                            <TicketPercent size={16} className="text-orange-600" />
                            New Coupon Details
                        </h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1.5 tracking-widest leading-none">Coupon Code</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-md p-2.5 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-orange-600 transition-all opacity-80"
                                        placeholder="e.g. SAVE20"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1.5 tracking-widest leading-none">Type</label>
                                    <div className="flex bg-zinc-50 dark:bg-zinc-900/50 p-1 rounded-md border border-zinc-200 dark:border-zinc-800">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, discountType: 'PERCENTAGE' })}
                                            className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${formData.discountType === 'PERCENTAGE' ? 'bg-white dark:bg-zinc-800 text-orange-600' : 'text-zinc-500'}`}
                                        >
                                            Percentage (%)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, discountType: 'FIXED' })}
                                            className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${formData.discountType === 'FIXED' ? 'bg-white dark:bg-zinc-800 text-orange-600' : 'text-zinc-500'}`}
                                        >
                                            Fixed (₦)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1.5 tracking-widest leading-none">Value {formData.discountType === 'PERCENTAGE' ? '(%)' : '(₦)'}</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={formData.value}
                                            onChange={e => setFormData({ ...formData, value: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-md p-2.5 text-xs font-black focus:outline-none focus:border-orange-600 pl-8 transition-all"
                                            required
                                        />
                                        <div className="absolute left-3 top-3.5 text-zinc-400">
                                            {formData.discountType === 'PERCENTAGE' ? <Percent size={16} /> : <DollarSign size={16} />}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1.5 tracking-widest leading-none">Min Order (₦)</label>
                                    <input
                                        type="number"
                                        value={formData.minOrderAmount}
                                        onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-md p-2.5 text-xs font-black focus:outline-none focus:border-orange-600 transition-all"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1.5 tracking-widest leading-none">Expiration</label>
                                    <input
                                        type="date"
                                        value={formData.expiresAt}
                                        onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-md p-2.5 text-xs font-black focus:outline-none focus:border-orange-600 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="bg-orange-600 text-white px-5 py-2.5 rounded-md font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {createMutation.isPending ? "Creating..." : "Save Coupon"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-5 py-2.5 rounded-md font-black uppercase text-[10px] tracking-widest text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Coupons List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-28 bg-zinc-100 dark:bg-zinc-800 rounded-md animate-pulse" />
                    ))
                ) : (
                    discounts.map(coupon => (
                        <div key={coupon._id} className="bg-white dark:bg-zinc-900 p-4 rounded-md border border-zinc-100 dark:border-zinc-800 relative group hover:border-orange-500/30 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-orange-100 dark:border-orange-900/30">
                                    {coupon.code}
                                </span>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${coupon.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
                                    {coupon.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="mb-3">
                                <p className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                                    {coupon.discountType === 'PERCENTAGE' ? `${coupon.value}% OFF` : `₦${coupon.value.toLocaleString()} OFF`}
                                </p>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mt-1">
                                    Min: ₦{coupon.minOrderAmount?.toLocaleString() || '0'}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-t border-zinc-50 dark:border-zinc-800/50 pt-3">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={12} className="text-zinc-400" />
                                    <span>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'No Expiry'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Tag size={12} className="text-zinc-400" />
                                    <span>{coupon.usedCount || 0} uses</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
