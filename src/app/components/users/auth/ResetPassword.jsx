"use client";

import React, { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import axios from "axios";

const LogoImage = () => (
  <div className="relative group mx-auto mb-6">
    <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full scale-125 transition-transform duration-700" />
    <img
      src="/logo.png"
      alt="GrubDash Logo"
      className="w-[160px] object-contain relative z-10"
    />
  </div>
);

export default function ResetPassword() {
  const { baseUrl } = useApi();
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [resending, setResending] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  // Handle OTP input
  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste functionality
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      setMessage("✅ OTP pasted successfully!");
    } else {
      setMessage("⚠️ Please paste a valid 6-digit OTP");
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setMessage("⚠️ Please enter a valid 6-digit OTP.");
      return;
    }
    if (!password || password.length < 8) {
      setMessage("⚠️ Password must be at least 8 characters long.");
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      // ✅ Explicit endpoint construction for clarity
      const endpoint = `${baseUrl}/user/auth/reset-password`;

      if (process.env.NODE_ENV === 'development') {
        console.log('[ResetPassword] Sending request to:', endpoint);
        console.log('[ResetPassword] Email:', email);
      }

      const { data } = await axios.post(
        endpoint,
        { email, otp: otpString, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('[ResetPassword] Response:', data);
      }

      if (data.status === false) {
        setMessage(data.message || "Reset failed. Please try again.");
        return;
      }

      setMessage("✅ Password reset successful! Redirecting...");
      setTimeout(() => router.push("/auth/signin"), 2000);
    } catch (error) {
      console.error('[ResetPassword] Reset error:', error);

      if (error.response) {
        const errorMessage = error.response.data.message || "Reset failed. Please try again.";
        setMessage(errorMessage);

        if (process.env.NODE_ENV === 'development') {
          console.error('[ResetPassword] Server error:', error.response.status, errorMessage);
        }
      } else if (error.request) {
        setMessage("Network error. Please check your connection.");

        if (process.env.NODE_ENV === 'development') {
          console.error('[ResetPassword] Network error - no response received');
        }
      } else {
        setMessage("Something went wrong. Try again later.");

        if (process.env.NODE_ENV === 'development') {
          console.error('[ResetPassword] Unexpected error:', error.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!email) return setMessage("⚠️ Email not found.");

    try {
      setResending(true);
      setMessage(null);

      // ✅ Explicit endpoint construction for clarity
      const endpoint = `${baseUrl}/user/auth/resend-otp`;

      if (process.env.NODE_ENV === 'development') {
        console.log('[ResetPassword] Resending OTP to:', endpoint);
        console.log('[ResetPassword] Email:', email);
      }

      const { data } = await axios.post(
        endpoint,
        { email },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('[ResetPassword] Resend response:', data);
      }

      if (data.status === false) {
        setMessage(data.message || "Failed to resend OTP.");
        return;
      }

      setMessage("✅ OTP resent successfully! Check your email.");
    } catch (error) {
      console.error('[ResetPassword] Resend error:', error);

      if (error.response) {
        const errorMessage = error.response.data.message || "Failed to resend OTP.";
        setMessage(errorMessage);

        if (process.env.NODE_ENV === 'development') {
          console.error('[ResetPassword] Server error:', error.response.status, errorMessage);
        }
      } else if (error.request) {
        setMessage("Network error. Please check your connection.");

        if (process.env.NODE_ENV === 'development') {
          console.error('[ResetPassword] Network error - no response received');
        }
      } else {
        setMessage("Something went wrong. Try again later.");

        if (process.env.NODE_ENV === 'development') {
          console.error('[ResetPassword] Unexpected error:', error.message);
        }
      }
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
            <Lock size={36} />
          </div>

          <h1 className="text-4xl font-black italic uppercase tracking-tight text-zinc-900 dark:text-white mb-3">
            Secure <span className="text-orange-600">Reset</span>
          </h1>
          <p className="text-xs font-semibold text-zinc-500 mb-4">
            Enter the 6-digit code sent to<br />
            <span className="text-zinc-700 dark:text-zinc-300 font-bold">{email}</span>
          </p>
        </div>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-3 mb-6">
          {otp.map((digit, index) => (
            <motion.input
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-14 h-16 text-center bg-zinc-50 dark:bg-zinc-800 rounded-xl text-2xl font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            />
          ))}
        </div>

        {/* New Password Input */}
        <div className="space-y-2 mb-6">
          <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">New Password</label>
          <input
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-base font-medium dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          />
        </div>

        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`text-center p-3 rounded-xl mb-6 text-sm font-semibold flex items-center justify-center gap-2 ${message.includes("✅") ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-rose-50 text-rose-500 dark:bg-rose-500/10"
                }`}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleResetPassword}
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span>Updating...</span>
              </>
            ) : (
              <span>Update Password</span>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleResendOTP}
            disabled={resending}
            className="w-full bg-zinc-100 dark:bg-zinc-800 text-orange-600 py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            {resending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Resending...</span>
              </>
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
