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
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0F172A]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Loading reviews...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50 dark:bg-[#0F172A] p-4 md:p-8">

            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <BackButton label="Back to Dashboard" className="mb-2" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Customer Reviews</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">See what people are saying about your food</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-4">
                        <div className="bg-white dark:bg-[#1E293B] px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                            <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
                                <MessageSquare size={20} className="text-[#FF6B00]" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Total Reviews</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{reviews.length}</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#1E293B] px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                            <div className="p-2 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl">
                                <Star size={20} className="text-yellow-500 fill-yellow-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Average Rating</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{averageRating}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Content */}
            <div className="space-y-6">
                {error ? (
                    <div className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3">
                        <AlertCircle size={24} />
                        <p className="font-medium">{error}</p>
                    </div>
                ) : reviews.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 text-center"
                    >
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                            <MessageSquare size={48} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No reviews yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
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
                                className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
                            >
                                {/* Review Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                                {review.userId ? `${review.userId.firstname} ${review.userId.lastname}` : "Anonymous"}
                                            </h3>
                                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                                <Calendar size={10} /> {formatDate(review.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="px-2.5 py-1 bg-orange-50 dark:bg-orange-500/10 rounded-lg flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold text-xs">
                                        <Star size={12} className="fill-orange-500 text-orange-500" />
                                        {review.rating}
                                    </div>
                                </div>

                                {/* Comment */}
                                <div className="relative mb-4">
                                    <Quote size={24} className="absolute -top-2 -left-2 text-slate-100 dark:text-slate-800 rotate-180" />
                                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed relative z-10 pl-2">
                                        "{review.comment}"
                                    </p>
                                </div>

                                {/* Food Item Badge */}
                                {review.foodId && (
                                    <div className="pt-4 mt-auto border-t border-slate-50 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-xl">
                                            <Utensils size={14} className="text-slate-400" />
                                            <span className="text-xs font-bold line-clamp-1">{review.foodId.name}</span>
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
