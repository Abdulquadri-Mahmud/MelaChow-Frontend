"use client";

import React, { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

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

      const res = await fetch(`${baseUrl}/user/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString, password }),
      });

      const data = await res.json();

      if (!res.ok || data.status === false) {
        setMessage(data.message || "Reset failed. Please try again.");
        return;
      }

      setMessage("✅ Password reset successful! Redirecting...");
      setTimeout(() => router.push("/auth/signin"), 2000);
    } catch (error) {
      console.error("Reset error:", error);
      setMessage("Something went wrong. Try again later.");
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

      const res = await fetch(`${baseUrl}/user/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || data.status === false) {
        setMessage(data.message || "Failed to resend OTP.");
        return;
      }

      setMessage("✅ OTP resent successfully! Check your email.");
    } catch (error) {
      console.error("Resend error:", error);
      setMessage("Something went wrong. Try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[10%] right-[5%] w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[10%] left-[5%] w-96 h-96 bg-orange-600/5 rounded-full blur-[120px] animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[40px] p-8 md:p-10 shadow-2xl border border-zinc-100 dark:border-zinc-800 relative z-10"
      >
        <div className="text-center">
          <LogoImage />
          <div className="w-16 h-16 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock size={30} />
          </div>

          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white leading-none mb-3">
            Secure <span className="text-orange-600">Reset</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 leading-relaxed mb-8">
            Enter the 6-digit code sent to<br />
            <span className="text-zinc-600 dark:text-zinc-200 mt-1 inline-block">{email}</span>
          </p>
        </div>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-2 mb-8">
          {otp.map((digit, index) => (
            <motion.input
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-12 h-14 text-center bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-xl font-black text-zinc-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
            />
          ))}
        </div>

        {/* New Password Input */}
        <div className="space-y-1.5 group mb-8">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">New Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-4 pl-12 rounded-2xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium dark:text-white"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`text-center p-3 rounded-xl mb-6 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${message.includes("✅") ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-500 border border-rose-100"
                }`}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleResetPassword}
            disabled={loading}
            className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-black uppercase italic tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50 active:scale-95 group"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span>Update Password</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleResendOTP}
            disabled={resending}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase italic tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
          >
            {resending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                <RefreshCw size={16} />
                <span>Resend OTP</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
