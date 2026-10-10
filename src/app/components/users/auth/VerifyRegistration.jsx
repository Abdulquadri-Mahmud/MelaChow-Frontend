"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthFrame from "./AuthFrame";
import { useApi } from "@/app/context/ApiContext";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Mail, Loader2, RefreshCw, Clock, CheckCircle2, AlertCircle, X, ArrowRight } from "lucide-react";
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
                            {type === 'success' ? 'Verified!' : 'Oops!'}
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
                            {type === 'success' ? 'Set My Password' : 'Try Again'}
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default function VerifyRegistration() {
    const [otp, setOtp] = useState(Array(6).fill(""));
    const inputRefs = useRef([]);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes countdown
    const [resendCooldown, setResendCooldown] = useState(30); // 30 seconds resend cooldown
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', message: '' });
    const [requiresPassword, setRequiresPassword] = useState(true);

    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const returnTo = searchParams.get("returnTo");
    const { baseUrl } = useApi();

    useEffect(() => {
        if (timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft]);

    useEffect(() => {
        if (resendCooldown <= 0) return;

        const interval = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [resendCooldown]);

    const formatTime = (seconds) => {
        const m = String(Math.floor(seconds / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");
        return `${m}:${s}`;
    };

    const handleChange = (value, index) => {
        if (/^[0-9]?$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);
            if (value && index < 5) inputRefs.current[index + 1]?.focus();

            // Auto-submit if all fields are filled
            if (newOtp.every((digit) => digit !== "")) {
                handleVerify(newOtp);
            }
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim();

        if (/^\d{6}$/.test(pastedData)) {
            const newOtp = pastedData.split("");
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
            handleVerify(newOtp);
        } else {
            setStatusModal({
                isOpen: true,
                type: 'error',
                message: "Please paste a valid 6-digit OTP."
            });
        }
    };

    const closeModal = () => {
        const wasSuccess = statusModal.type === 'success';
        setStatusModal({ ...statusModal, isOpen: false });
        if (wasSuccess) {
            router.push(requiresPassword ? `/auth/set-password?email=${encodeURIComponent(email)}` : (returnTo === "signin" ? `/auth/signin?verified=1` : "/auth/signin"));
        }
    };

    const handleVerify = async (currentOtp = otp) => {
        const otpString = currentOtp.join("");
        if (otpString.length !== 6) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                message: "Please enter a valid 6-digit OTP."
            });
            return;
        }

        try {
            setLoading(true);
            const endpoint = `${baseUrl}/user/auth/verify-registration`;

            const { data } = await axios.post(
                endpoint,
                { email, otp: otpString },
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                }
            );

            const needsPassword = data.requiresPassword !== false;
            setRequiresPassword(needsPassword);
            setStatusModal({
                isOpen: true,
                type: 'success',
                message: needsPassword
                    ? "Email verified. Create a password to complete your account."
                    : "Email verified. You can now sign in."
            });

        } catch (error) {
            console.error('[VerifyRegistration] Verification error:', error);
            const errorMessage = error.response?.data?.message || "Invalid or expired OTP. Please check and try again.";

            setStatusModal({
                isOpen: true,
                type: 'error',
                message: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resending || resendCooldown > 0) return;

        try {
            setResending(true);
            const endpoint = `${baseUrl}/user/auth/resend-otp`;

            await axios.post(
                endpoint,
                { email },
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                }
            );

            setStatusModal({
                isOpen: true,
                type: 'success',
                message: "A new 6-digit code has been sent to your email."
            });

            setOtp(Array(6).fill(""));
            inputRefs.current[0]?.focus();
            setTimeLeft(600);
            setResendCooldown(30);
        } catch (error) {
            console.error('[VerifyRegistration] Resend error:', error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                message: "Could not resend OTP. Please try again later."
            });
        } finally {
            setResending(false);
        }
    };

    return (
        <AuthFrame subtitle="Verify your email">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                <div className="mb-6 inline-flex rounded-full bg-orange-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700">Step 2 of 3 · Verification</div>
                <h1 className="mb-2 text-[28px] font-semibold tracking-tight">Check your email <Mail className="inline text-orange-500" size={24} /></h1>
                <p className="mb-7 text-base leading-relaxed text-slate-500">We sent a 6-digit code to <span className="font-semibold text-orange-700">{email}</span>. Enter it below.</p>

                {/* OTP Inputs */}
                <div className="flex justify-center gap-3 mb-10 py-1">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(e.target.value, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            className="h-[68px] min-w-0 flex-1 rounded-[20px] border-2 border-orange-500 bg-white text-center text-2xl font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-orange-100"
                        />
                    ))}
                </div>

                <div className="space-y-4">
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleVerify()}
                        disabled={loading}
                        className="w-full rounded-[20px] bg-orange-500 py-5 text-base font-semibold text-white shadow-[0_10px_20px_rgba(249,115,22,0.25)] transition hover:bg-orange-600 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                <span>Verifying...</span>
                            </>
                        ) : (
                            <>
                                <span>Verify code</span>
                            </>
                        )}
                    </motion.button>

                    <button
                        onClick={handleResend}
                        disabled={resending || resendCooldown > 0}
                        className="w-full py-3 text-sm font-semibold text-orange-700 disabled:text-slate-400"
                    >
                        {resending ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <>
                                <RefreshCw size={18} className={resendCooldown > 0 ? "opacity-50" : ""} />
                                <span>
                                    {resendCooldown > 0
                                        ? `Resend OTP (${resendCooldown}s)`
                                        : "Resend OTP"}
                                </span>
                            </>
                        )}
                    </button>

                </div>
            </motion.div>

            {/* Custom Status Modal */}
            <StatusModal
                isOpen={statusModal.isOpen}
                type={statusModal.type}
                message={statusModal.message}
                onClose={closeModal}
            />
        </AuthFrame>
    );
}

