"use client";

import React, { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Loader2, Store, RefreshCw } from "lucide-react";
import axios from "axios";

export default function VendorResetPassword() {
    const { baseUrl } = useApi();
    const [otp, setOtp] = useState(Array(6).fill(""));
    const [password, setPassword] = useState("");
    const inputRefs = useRef([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    const handleChange = (value, index) => {
        if (/^[0-9]?$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);
            if (value && index < 5) inputRefs.current[index + 1]?.focus();
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
        }
    };

    const handleResetPassword = async () => {
        const otpString = otp.join("");
        if (otpString.length !== 6 || password.length < 8) {
            setMessage("⚠️ Check OTP or Password length (min 8).");
            return;
        }

        try {
            setLoading(true);
            setMessage(null);

            // Step 1: Verify Code
            const verifyEndpoint = `${baseUrl}/vendor/auth/verify-reset-code`;

            const verifyRes = await axios.post(
                verifyEndpoint,
                { email, otp: otpString },
                { headers: { "Content-Type": "application/json" }, withCredentials: true }
            );

            if (!verifyRes.data.success && !verifyRes.data.status) {
                throw new Error(verifyRes.data.message || "Invalid OTP");
            }

            const resetToken = verifyRes.data.resetToken || verifyRes.data.token;

            // Step 2: Reset Password
            const resetEndpoint = `${baseUrl}/vendor/auth/reset-password`;

            const { data } = await axios.post(
                resetEndpoint,
                { email, resetToken, newPassword: password },
                { headers: { "Content-Type": "application/json" }, withCredentials: true }
            );

            setMessage("✅ Password reset successful! Redirecting...");
            setTimeout(() => router.push("/vendors/auth/login"), 2000);

        } catch (error) {
            console.error('[VendorResetPassword] Error:', error);
            if (error.response) {
                setMessage(error.response.data.message || "Reset failed.");
            } else {
                setMessage("Network error.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Lock size={36} />
                    </div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tight text-zinc-900 dark:text-white mb-2">
                        Vendor <span className="text-orange-600">Reset</span>
                    </h1>
                    <p className="text-xs font-semibold text-zinc-500">
                        Enter OTP and new password for {email}
                    </p>
                </div>

                <div className="flex justify-center gap-3 mb-6">
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

                <div className="mb-6">
                    <input
                        type="password"
                        placeholder="New Password (min 8 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-base font-medium dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                </div>

                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-center p-3 rounded-xl mb-6 text-sm font-bold ${message.includes("✅") ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}
                        >
                            {message}
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : "Update Password"}
                </motion.button>
            </motion.div>
        </div>
    );
}
