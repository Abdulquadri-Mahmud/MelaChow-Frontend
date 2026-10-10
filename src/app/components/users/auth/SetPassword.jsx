"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthFrame, { authInputClass, authLabelClass } from "./AuthFrame";
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
        <AuthFrame subtitle="Secure your account">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                <div className="mb-6 inline-flex rounded-full bg-orange-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700">Step 3 of 3 · Set password</div>
                <h1 className="mb-2 text-[28px] font-semibold tracking-tight">Create a password <Lock className="inline text-orange-500" size={23} /></h1>
                <p className="mb-6 text-base leading-relaxed text-slate-500">Choose a strong password of at least 8 characters. You&apos;ll use it to sign in.</p>

                <form onSubmit={handleSetPassword} className="space-y-5">
                    <div className="space-y-2 p-1">
                        <label className={authLabelClass}>New password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Min. 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className={`${authInputClass} pr-12`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-orange-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2 p-1">
                        <label className={authLabelClass}>Confirm password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Repeat your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className={authInputClass}
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-[20px] bg-orange-500 py-5 text-base font-semibold text-white shadow-[0_10px_20px_rgba(249,115,22,0.25)] transition hover:bg-orange-600 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                <span>Securing Account...</span>
                            </>
                        ) : (
                            <>
                                <span>Set password &amp; sign in</span>
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
        </AuthFrame>
    );
}
