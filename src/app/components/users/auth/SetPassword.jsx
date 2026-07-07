"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, X, ArrowRight } from "lucide-react";
import { TokenManager } from "@/app/lib/auth-token";
import axios from "axios";

// --- Custom Status Modal Component ---
const StatusModal = ({ isOpen, type, message, onClose }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden"
                >
                    {/* Decorative Background */}
                    <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 ${type === 'success' ? 'bg-orange-500' : 'bg-rose-500'
                        }`} />

                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-sm ${type === 'success' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-500'
                            }`}>
                            {type === 'success' ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
                        </div>

                        <h3 className="text-2xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white mb-2">
                            {type === 'success' ? 'Success!' : 'Oops!'}
                        </h3>

                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px]">
                            {message}
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            className={`mt-8 w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg ${type === 'success'
                                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20'
                                : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-slate-900/20'
                                }`}
                        >
                            {type === 'success' ? 'Continue to Sign In' : 'Try Again'}
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default function SetPassword() {
    const { baseUrl } = useApi();
    const { saveUser } = useUserStorage();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', message: '' });

    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    const closeModal = () => {
        const wasSuccess = statusModal.type === 'success';
        setStatusModal({ ...statusModal, isOpen: false });

        if (wasSuccess) {
            router.push("/auth/signin");
        }
    };

    const handleSetPassword = async (e) => {
        e.preventDefault();

        // Validate password length
        if (!password || password.length < 8) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                message: "Password must be at least 8 characters long."
            });
            return;
        }

        // Validate password match
        if (password !== confirmPassword) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                message: "Passwords do not match. Please check and try again."
            });
            return;
        }

        try {
            setLoading(true);

            const endpoint = `${baseUrl}/user/auth/set-password`;

            if (process.env.NODE_ENV === 'development') {
                console.log('[SetPassword] Setting password for:', email);
            }

            const { data } = await axios.post(
                endpoint,
                { email, password },
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                }
            );

            // Check for API-level errors
            if (data.status === false) {
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    message: data.message || "Failed to set password."
                });
                return;
            }

            // ✅ SECURITY: No auto-login! User must login to confirm they know their password
            // This ensures a clean, verified session.
            if (process.env.NODE_ENV === 'development') {
                console.log('[SetPassword] Password set successfully. User must now login.');
            }

            setStatusModal({
                isOpen: true,
                type: 'success',
                message: "Password set successfully! For your security, please sign in with your new credentials to access your account."
            });

        } catch (error) {
            console.error('[SetPassword] Error:', error);

            const errorMessage = error.response?.data?.message || "Failed to set password. Please try again.";

            setStatusModal({
                isOpen: true,
                type: 'error',
                message: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-y-auto p-3 md:p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md flex flex-col justify-center py-4"
            >
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Lock size={36} />
                    </div>

                    <h1 className="text-4xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white mb-3">
                        Set Your <span className="text-orange-600">Password</span>
                    </h1>
                    <p className="text-xs font-semibold text-slate-500 mb-4 leading-relaxed">
                        Create a secure password for your new account:<br />
                        <span className="text-slate-700 dark:text-slate-300 font-bold">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleSetPassword} className="space-y-5">
                    <div className="space-y-2 p-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a strong password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-base font-medium dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all border border-slate-200 focus:border-orange-500/20"
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

                    <div className="space-y-2 p-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Confirm Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Repeat your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-base font-medium dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all border border-slate-200 focus:border-orange-500/20"
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8 shadow-xl shadow-orange-500/20"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                <span>Securing Account...</span>
                            </>
                        ) : (
                            <>
                                <span>Complete Registration</span>
                                <ArrowRight size={20} />
                            </>
                        )}
                    </motion.button>
                </form>
            </motion.div>

            <StatusModal
                isOpen={statusModal.isOpen}
                type={statusModal.type}
                message={statusModal.message}
                onClose={closeModal}
            />
        </div>
    );
}
