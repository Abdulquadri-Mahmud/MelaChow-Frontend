"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Send, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function ReviewModal({ isOpen, onClose, food, vendorId, baseUrl, token }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [hoveredRating, setHoveredRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!rating) return toast.error("Please provide a rating");
        if (!comment.trim()) return toast.error("Please add a comment");

        setIsSubmitting(true);
        try {
            await axios.post(
                `${baseUrl}/user/reviews`,
                {
                    vendorId: vendorId,
                    foodId: food.foodId,
                    rating,
                    comment,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            toast.success("Review submitted! Thank you for your feedback.");
            onClose();
        } catch (err) {
            console.error("Review submission error:", err);
            toast.error(err.response?.data?.message || "Failed to submit review");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-zinc-100 dark:border-zinc-800"
                >
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black italic uppercase tracking-tight text-zinc-900 dark:text-white">Write a Review</h3>
                            <button
                                onClick={onClose}
                                className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-800">
                                <img src={food.variant?.image || food.image} alt={food.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h4 className="font-bold text-zinc-900 dark:text-white line-clamp-1">{food.variant?.name || food.name}</h4>
                                <p className="text-xs text-zinc-500 uppercase font-black">Rate your experience</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Star Rating */}
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <motion.button
                                        key={star}
                                        type="button"
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        className="p-1"
                                    >
                                        <Star
                                            size={32}
                                            className={`transition-colors ${star <= (hoveredRating || rating)
                                                    ? "fill-orange-500 text-orange-500"
                                                    : "text-zinc-200 dark:text-zinc-700"
                                                }`}
                                        />
                                    </motion.button>
                                ))}
                            </div>

                            {/* Comment */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest pl-1">Share your thoughts</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="The food was amazing! Fast delivery too..."
                                    className="w-full h-32 p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl outline-none focus:border-orange-500/50 transition-all text-sm resize-none"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-lg shadow-orange-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <Send size={18} />
                                        <span>Submit Review</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
