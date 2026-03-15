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
        <div className="space-y-6 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Discount Coupons</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Create and manage your promo codes</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                >
                    <Plus size={18} />
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
                        className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden"
                    >
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <TicketPercent className="text-orange-500" />
                            New Coupon Details
                        </h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Coupon Code</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-semibold uppercase tracking-wider focus:outline-none focus:border-orange-500"
                                        placeholder="e.g. SAVE20"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Discount Type</label>
                                    <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, discountType: 'PERCENTAGE' })}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.discountType === 'PERCENTAGE' ? 'bg-white dark:bg-slate-700 shadow-sm text-orange-600' : 'text-slate-500'}`}
                                        >
                                            Percentage (%)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, discountType: 'FIXED' })}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.discountType === 'FIXED' ? 'bg-white dark:bg-slate-700 shadow-sm text-orange-600' : 'text-slate-500'}`}
                                        >
                                            Fixed Amount (₦)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Value {formData.discountType === 'PERCENTAGE' ? '(%)' : '(₦)'}</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={formData.value}
                                            onChange={e => setFormData({ ...formData, value: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-semibold focus:outline-none focus:border-orange-500 pl-10"
                                            required
                                        />
                                        <div className="absolute left-3 top-3.5 text-slate-400">
                                            {formData.discountType === 'PERCENTAGE' ? <Percent size={16} /> : <DollarSign size={16} />}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Min Order (₦)</label>
                                    <input
                                        type="number"
                                        value={formData.minOrderAmount}
                                        onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-semibold focus:outline-none focus:border-orange-500"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Expiration</label>
                                    <input
                                        type="date"
                                        value={formData.expiresAt}
                                        onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-semibold focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="bg-slate-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-50"
                                >
                                    {createMutation.isPending ? "Creating..." : "Save Coupon"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-6 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Coupons List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                    ))
                ) : discounts.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-500 flex flex-col items-center">
                        <TicketPercent size={48} className="mb-4 text-slate-300" />
                        <p>No coupons found. Create your first one!</p>
                    </div>
                ) : (
                    discounts.map(coupon => (
                        <div key={coupon._id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative group hover:border-orange-200 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-lg text-sm font-black uppercase tracking-wider border border-orange-100 dark:border-orange-900/30">
                                    {coupon.code}
                                </span>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${coupon.isActive ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {coupon.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="mb-4">
                                <p className="text-2xl font-black text-slate-900 dark:text-white">
                                    {coupon.discountType === 'PERCENTAGE' ? `${coupon.value}% OFF` : `₦${coupon.value.toLocaleString()} OFF`}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Min. Order: ₦{coupon.minOrderAmount?.toLocaleString() || '0'}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-50 dark:border-slate-800 pt-3">
                                <div className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    <span>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'No Expiry'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Tag size={12} />
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
