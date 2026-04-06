"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import { TokenManager } from "@/app/lib/auth-token";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import axios from "axios";

export default function VendorSetPassword() {
    const { baseUrl } = useApi();
    const { saveVendor } = useVendorStorage();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    const handleSetPassword = async (e) => {
        e.preventDefault();

        if (!password || password.length < 8) {
            setMessage("âš ï¸ Password must be at least 8 characters long.");
            return;
        }
        if (password !== confirmPassword) {
            setMessage("âš ï¸ Passwords do not match.");
            return;
        }

        try {
            setLoading(true);
            setMessage(null);

            const endpoint = `${baseUrl}/vendor/auth/set-password`;

            if (process.env.NODE_ENV === 'development') {
                console.log('[VendorSetPassword] Sending request to:', endpoint);
            }

            const { data } = await axios.post(
                endpoint,
                { email, password },
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                }
            );

            if (process.env.NODE_ENV === 'development') {
                console.log('[VendorSetPassword] Response:', data);
            }

            if (process.env.NODE_ENV === 'development') {
                console.log('[VendorSetPassword] Password set response:', data);
            }

            // Guide: If Approved (rare for signups), tokens are returned.
            const { accessToken, token, vendor, requiresApproval, ...rest } = data;
            const finalToken = accessToken || token;
            const vendorData = vendor || rest;

            if (finalToken) {
                TokenManager.setToken(finalToken, 'vendor');
            }

            if (vendorData && vendorData.storeName) {
                saveVendor(vendorData);
            }

            if (requiresApproval) {
                setMessage("âœ… Password set! Redirecting for business review...");
                setTimeout(() => router.push("/vendors/pending-approval"), 1500);
            } else {
                setMessage("âœ… Registration complete! Welcome to MelaChow.");
                setTimeout(() => router.push("/vendors/dashboard"), 1500);
            }

        } catch (error) {
            console.error('[VendorSetPassword] Error:', error);

            if (error.response) {
                setMessage(error.response.data.message || "Failed to set password.");
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md flex flex-col h-full max-h-[90vh] justify-center"
            >
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Lock size={36} />
                    </div>

                    <h1 className="text-3xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white mb-3">
                        Secure Your <span className="text-orange-600">Business</span>
                    </h1>
                    <p className="text-xs font-semibold text-slate-500 mb-4">
                        Set a password for<br />
                        <span className="text-slate-700 dark:text-slate-300 font-bold">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleSetPassword} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Min. 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-base font-medium dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Confirm Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-base font-medium dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className={`text-center p-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${message.includes("âœ…") ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-rose-50 text-rose-500 dark:bg-rose-500/10"
                                    }`}
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
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <span>Finalize Setup</span>
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
}

