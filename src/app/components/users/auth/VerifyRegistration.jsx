"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, RefreshCw, Clock, CheckCircle2, AlertCircle, X, ArrowRight } from "lucide-react";
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
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', message: '' });

    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
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
            router.push(`/auth/set-password?email=${encodeURIComponent(email)}`);
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

            await axios.post(
                endpoint,
                { email, otp: otpString },
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                }
            );

            setStatusModal({
                isOpen: true,
                type: 'success',
                message: "Authentication successful! Now, let's secure your account with a password."
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
        if (resending || timeLeft > 0) return;

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
        <div className="h-screen w-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md flex flex-col h-full max-h-[90vh] justify-center"
            >
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <ShieldCheck size={36} />
                    </div>

                    <h1 className="text-4xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white mb-3">
                        Verify <span className="text-orange-600">Registration</span>
                    </h1>
                    <p className="text-xs font-semibold text-slate-500 mb-6 leading-relaxed">
                        A 6-digit code has been sent to<br />
                        <span className="text-slate-700 dark:text-slate-300 font-bold">{email}</span>
                    </p>

                    <div className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 py-3 px-5 rounded-full w-fit mx-auto border border-slate-100 dark:border-slate-800 shadow-sm">
                        <Clock size={14} className="text-orange-500" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            Expires in {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>

                {/* OTP Inputs */}
                <div className="flex justify-center gap-3 mb-10">
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
                            className="w-12 h-14 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl text-2xl font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all border border-transparent focus:border-orange-500/20 shadow-sm"
                        />
                    ))}
                </div>

                <div className="space-y-4">
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleVerify()}
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-orange-500/20"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                <span>Verifying...</span>
                            </>
                        ) : (
                            <>
                                <span>Verify & Continue</span>
                                <ArrowRight size={20} />
                            </>
                        )}
                    </motion.button>

                    <button
                        onClick={handleResend}
                        disabled={resending || timeLeft > 0}
                        className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all border ${resending || timeLeft > 0
                            ? "bg-transparent border-slate-100 dark:border-slate-800 text-slate-400 cursor-not-allowed"
                            : "bg-transparent border-orange-100 dark:border-orange-900/30 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/5 shadow-sm"
                            }`}
                    >
                        {resending ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <>
                                <RefreshCw size={18} className={timeLeft > 0 ? "opacity-50" : ""} />
                                <span>Resend OTP {timeLeft > 0 ? "" : ""}</span>
                            </>
                        )}
                    </button>

                    <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest pt-2">
                        Secured by GrubDash Auth
                    </p>
                </div>
            </motion.div>

            {/* Custom Status Modal */}
            <StatusModal
                isOpen={statusModal.isOpen}
                type={statusModal.type}
                message={statusModal.message}
                onClose={closeModal}
            />
        </div>
    );
}
