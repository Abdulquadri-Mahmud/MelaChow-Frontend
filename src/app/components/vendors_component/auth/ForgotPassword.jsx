"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, Loader2, Store } from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function VendorForgotPassword() {
    const { baseUrl } = useApi();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        try {
            setLoading(true);
            setMessage(null);

            const endpoint = `${baseUrl}/vendor/auth/forgot-password`;

            if (process.env.NODE_ENV === 'development') {
                console.log('[VendorForgotPassword] Sending request to:', endpoint);
            }

            await axios.post(
                endpoint,
                { email },
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                }
            );

            setMessage("✅ Reset instructions sent to your email.");
            setTimeout(() => router.push(`/vendors/auth/reset-password?email=${encodeURIComponent(email)}`), 2000);

        } catch (error) {
            console.error('[VendorForgotPassword] Error:', error);
            if (error.response) {
                setMessage(error.response.data.message || "Failed to send reset email.");
            } else {
                setMessage("Network error. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Store size={36} />
                    </div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white mb-2">
                        Reset <span className="text-orange-600">Password</span>
                    </h1>
                    <p className="text-xs font-semibold text-slate-500">
                        Enter your vendor email to receive reset instructions
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="email"
                                placeholder="vendor@restaurant.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-slate-50 dark:bg-slate-800 p-4 pl-12 rounded-xl text-base font-medium dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                            />
                        </div>
                    </div>

                    <AnimatePresence>
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`text-center p-3 rounded-xl text-sm font-bold ${message.includes("✅") ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}
                            >
                                {message}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : (
                            <>
                                <span>Send Code</span>
                                <ArrowRight size={20} />
                            </>
                        )}
                    </motion.button>
                </form>

                <div className="mt-8 text-center">
                    <Link href="/vendors/auth/login" className="text-xs font-bold text-slate-400 hover:text-orange-600 transition-colors uppercase tracking-widest">
                        Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
