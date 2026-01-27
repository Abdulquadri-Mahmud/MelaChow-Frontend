"use client";

import React, { useEffect, useState } from "react";
import BackButton from "@/app/components/BackButton";
import ProtectedRoute from "@/app/components/protected-route/ProtectedRoute";
import { getUserReviews } from "@/app/lib/api";
import { Star, Store, Utensils, MessageCircle, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function MyReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const data = await getUserReviews();
                console.log(data)
                // Assuming data structure: { success: true, reviews: [...] }
                const reviewsData = data.reviews || (Array.isArray(data) ? data : []);
                setReviews(reviewsData);
            } catch (err) {
                console.error("Reviews fetch error:", err);
                setError(err.message || "Failed to load reviews");
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <ProtectedRoute>
            <div className="bg-zinc-50 min-h-screen font-display pb-20">
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-4 py-4">
                    <div className="max-w-md mx-auto flex items-center gap-4">
                        <BackButton />
                        <h1 className="text-lg font-bold text-zinc-800">My Reviews</h1>
                    </div>
                </div>

                <div className="max-w-md mx-auto p-4 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 border border-red-100">
                            <AlertCircle size={20} />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {loading ? (
                        // Loading Skeleton
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-white p-4 rounded-2xl border border-zinc-100 space-y-3 animate-pulse">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-zinc-100 rounded" />
                                        <div className="h-3 w-24 bg-zinc-100 rounded" />
                                    </div>
                                    <div className="h-6 w-12 bg-zinc-100 rounded-full" />
                                </div>
                                <div className="h-16 w-full bg-zinc-100 rounded-xl" />
                                <div className="h-3 w-20 bg-zinc-100 rounded" />
                            </div>
                        ))
                    ) : reviews.length === 0 ? (
                        // Empty State
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center">
                                <MessageCircle size={32} className="text-orange-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-zinc-800">No reviews yet</h3>
                                <p className="text-zinc-500 text-sm mt-1 max-w-[200px] mx-auto">
                                    Your feedback matters! Order some food and share your thoughts.
                                </p>
                            </div>
                            <Link
                                href="/home"
                                className="mt-4 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 transition-colors"
                            >
                                Browse Food
                            </Link>
                        </div>
                    ) : (
                        // Reviews List
                        reviews.map((review) => (
                            <div
                                key={review._id}
                                className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-orange-50 rounded-lg">
                                                <Store size={14} className="text-orange-600" />
                                            </div>
                                            <h3 className="font-bold text-zinc-900 text-sm">
                                                {review.vendorId?.storeName || "Vendor"}
                                            </h3>
                                        </div>
                                        {review.foodId && (
                                            <div className="flex items-center gap-2 pl-1">
                                                <Utensils size={12} className="text-zinc-400" />
                                                <span className="text-xs text-zinc-500 font-medium">
                                                    {review.foodId.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                                        <Star size={12} className="text-orange-500 fill-orange-500" />
                                        <span className="text-xs font-bold text-orange-700">
                                            {review.rating.toFixed(1)}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-zinc-50 p-3 rounded-xl mb-3">
                                    <p className="text-sm text-zinc-700 leading-relaxed italic">
                                        "{review.comment}"
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                    <Calendar size={12} />
                                    <span>{formatDate(review.createdAt)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
