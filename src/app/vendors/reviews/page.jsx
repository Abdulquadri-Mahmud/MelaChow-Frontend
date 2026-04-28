"use client";

import { useEffect, useState } from "react";
import { getVendorReviews } from "@/app/lib/vendorApi";
import { Star, MessageSquare, Utensils, Calendar, User, AlertCircle, Quote } from "lucide-react";
import { motion } from "framer-motion";
import BackButton from "@/app/components/BackButton";

export default function VendorReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const data = await getVendorReviews();
                // data structure: { success: true, total: 15, reviews: [...] }
                const reviewsData = data.reviews || (Array.isArray(data) ? data : []);
                setReviews(reviewsData);
            } catch (err) {
                console.error("Failed to fetch reviews:", err);
                setError("Failed to load reviews. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchReviews();
    }, []);

    // Stats Calculation
    const averageRating = reviews.length
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-[#0F172A]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Loading reviews...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-4 min-h-screen bg-zinc-50 dark:bg-zinc-950 p-3 rounded-md">

            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <BackButton label="Back to Dashboard" className="mb-2" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">Customer Reviews</h1>
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-widest">See what people are saying about your food</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-3">
                        <div className="bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-md border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                            <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-md">
                                <MessageSquare size={16} className="text-orange-600" />
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-widest">Total Reviews</p>
                                <p className="text-lg font-black text-zinc-900 dark:text-white">{reviews.length}</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-md border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                            <div className="p-2 bg-yellow-50 dark:bg-yellow-500/10 rounded-md">
                                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-widest">Avg Rating</p>
                                <p className="text-lg font-black text-zinc-900 dark:text-white">{averageRating}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Content */}
            <div className="space-y-6">
                {error ? (
                    <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md border border-rose-100 dark:border-rose-500/20 flex items-center gap-3">
                        <AlertCircle size={20} />
                        <p className="text-xs font-black uppercase tracking-widest">{error}</p>
                    </div>
                ) : reviews.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 rounded-md border border-zinc-100 dark:border-zinc-800 text-center"
                    >
                        <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-md mb-4">
                            <MessageSquare size={32} className="text-zinc-300 dark:text-zinc-600" />
                        </div>
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2 uppercase tracking-tight">No reviews yet</h3>
                        <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 max-w-[240px] mx-auto uppercase tracking-widest leading-relaxed">
                            Once customers start reviewing your dishes, they will appear here.
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reviews.map((review, idx) => (
                            <motion.div
                                key={review._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white dark:bg-zinc-900 p-4 rounded-md border border-zinc-100 dark:border-zinc-800 transition-all group"
                            >
                                {/* Review Header */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-zinc-900 dark:text-white text-xs uppercase tracking-tight">
                                                {review.userId ? `${review.userId.firstname} ${review.userId.lastname}` : "Anonymous"}
                                            </h3>
                                            <p className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 uppercase tracking-widest">
                                                <Calendar size={10} /> {formatDate(review.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="px-1.5 py-0.5 bg-orange-50 dark:bg-orange-500/10 rounded-md flex items-center gap-1 text-orange-600 dark:text-orange-400 font-black text-[10px]">
                                        <Star size={10} className="fill-orange-600 text-orange-600" />
                                        {review.rating}
                                    </div>
                                </div>

                                {/* Comment */}
                                <div className="relative mb-4">
                                    <Quote size={24} className="absolute -top-2 -left-2 text-zinc-100 dark:text-zinc-800 rotate-180" />
                                    <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed relative z-10 pl-2">
                                        "{review.comment}"
                                    </p>
                                </div>

                                {/* Food Item Badge */}
                                {review.foodId && (
                                    <div className="pt-3 mt-auto border-t border-zinc-50 dark:border-zinc-800/50">
                                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1.5 rounded-md">
                                            <Utensils size={12} className="text-zinc-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest line-clamp-1">{review.foodId.name}</span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
