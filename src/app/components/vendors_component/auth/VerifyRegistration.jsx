"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useApi } from "@/app/context/ApiContext";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, RefreshCw, Clock } from "lucide-react";
import axios from "axios";

export default function VendorVerifyRegistration() {
    const [otp, setOtp] = useState(Array(6).fill(""));
    const inputRefs = useRef([]);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes countdown
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
            toast.error("Please paste a valid 6-digit OTP");
        }
    };

    const handleVerify = async (currentOtp = otp) => {
        const otpString = currentOtp.join("");
        if (otpString.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP.");
            return;
        }

        try {
            setLoading(true);

            const endpoint = `${baseUrl}/vendor/auth/verify-registration`;

            if (process.env.NODE_ENV === 'development') {
                console.log('[VendorVerify] Sending request to:', endpoint);
            }

            await axios.post(
                endpoint,
                { email, otp: otpString },
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                }
            );

            toast.success("Verified! Please set your password.");
            setTimeout(() => router.push(`/vendors/auth/set-password?email=${encodeURIComponent(email)}`), 1000);
        } catch (error) {
            console.error('[VendorVerify] Verification error:', error);
            if (error.response) {
                toast.error(error.response.data.message || "OTP verification failed");
            } else {
                toast.error("Network error. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resending || timeLeft > 0) return;

        try {
            setResending(true);
            const endpoint = `${baseUrl}/vendor/auth/resend-otp`; // Assuming this endpoint exists

            if (process.env.NODE_ENV === 'development') {
                console.log('[VendorVerify] Resending OTP to:', endpoint);
            }

            await axios.post(
                endpoint,
                { email },
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                }
            );

            toast.success("OTP Sent! Check your email.");
            setOtp(Array(6).fill(""));
            inputRefs.current[0]?.focus();
            setTimeLeft(600);
        } catch (error) {
            console.error('[VendorVerify] Resend error:', error);
            toast.error("Could not resend OTP.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="h-screen w-full bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md flex flex-col h-full max-h-[90vh] justify-center"
            >
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={36} />
                    </div>

                    <h1 className="text-3xl font-black italic uppercase tracking-tight text-zinc-900 dark:text-white mb-3">
                        Vendor <span className="text-orange-600">Verification</span>
                    </h1>
                    <p className="text-xs font-semibold text-zinc-500 mb-4">
                        A 6-digit code has been sent to<br />
                        <span className="text-zinc-700 dark:text-zinc-300 font-bold">{email}</span>
                    </p>

                    <div className="flex items-center justify-center gap-2 bg-zinc-50 dark:bg-zinc-800 py-2 px-4 rounded-full w-fit mx-auto">
                        <Clock size={14} className="text-orange-500" />
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                            Expires in {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>

                {/* OTP Inputs */}
                <div className="flex justify-center gap-3 mb-8 mx-3">
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
                            className="w-12 h-12 text-center bg-zinc-50 dark:bg-zinc-800 rounded-xl text-2xl font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                        />
                    ))}
                </div>

                <div className="space-y-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleVerify()}
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                <span>Verifying...</span>
                            </>
                        ) : (
                            <span>Verify & Continue</span>
                        )}
                    </motion.button>

                    <motion.button
                        whileHover={timeLeft === 0 ? { scale: 1.02 } : {}}
                        whileTap={timeLeft === 0 ? { scale: 0.98 } : {}}
                        onClick={handleResend}
                        disabled={resending || timeLeft > 0}
                        className={`w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${resending || timeLeft > 0
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                            : "bg-zinc-100 dark:bg-zinc-800 text-orange-600 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            }`}
                    >
                        {resending ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <>
                                <RefreshCw size={18} />
                                <span>Resend OTP</span>
                            </>
                        )}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
