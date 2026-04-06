"use client";

import React, { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, Mail, ShieldCheck, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { TokenManager } from "@/app/lib/auth-token";
import axios from "axios";

/**
 * Enhanced Logo Component
 */
const LogoImage = () => (
  <div className="relative group mx-auto mb-6 w-fit">
    <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full scale-125 transition-transform duration-700" />
    <img
      src="/logo.png"
      alt="MelaChow Logo"
      className="w-[160px] object-contain relative z-10"
    />
  </div>
);

export default function VerifyAccount() {
  const { baseUrl } = useApi();
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState(null);

  const { saveVendor } = useVendorStorage();

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

      // Auto-submit if all fields are filled
      if (newOtp.every((digit) => digit !== "")) {
        handleVerify(newOtp);
      }
    }
  };

  // Handle backspace navigation
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
      // Auto-verify on paste
      handleVerify(newOtp);
    } else {
      setMessage("âš ï¸ Please paste a valid 6-digit OTP");
    }
  };

  // Verify OTP
  const handleVerify = async (val) => {
    // If called via button click, val is an event object. Use state 'otp' instead.
    const currentOtp = Array.isArray(val) ? val : otp;
    const otpString = currentOtp.join("");
    if (otpString.length !== 6) {
      setMessage("âš ï¸ Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      // âœ… Explicit endpoint construction for clarity
      const endpoint = `${baseUrl}/vendor/auth/verify-otp`;

      if (process.env.NODE_ENV === 'development') {
        console.log('[VendorVerify] Sending request to:', endpoint);
        console.log('[VendorVerify] Email:', email);
      }

      const { data } = await axios.post(
        endpoint,
        { email, otp: otpString },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,  // âœ… CRITICAL: Required to save vendorToken cookie
        }
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('[VendorVerify] Response:', data);
      }

      if (data.status === false) {
        setMessage(data.message || "OTP verification failed.");
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[VendorVerify] OTP verified successfully. Proceeding to set password.');
      }

      setMessage("âœ… Verified successfully! Now set your password...");
      setTimeout(() => router.push(`/vendors/auth/set-password?email=${encodeURIComponent(email)}`), 1500);
    } catch (error) {
      console.error('[VendorVerify] Verification error:', error);

      if (error.response) {
        const errorMessage = error.response.data.message || "OTP verification failed.";
        setMessage(errorMessage);

        if (process.env.NODE_ENV === 'development') {
          console.error('[VendorVerify] Server error:', error.response.status, errorMessage);
        }
      } else if (error.request) {
        setMessage("Network error. Please check your connection.");

        if (process.env.NODE_ENV === 'development') {
          console.error('[VendorVerify] Network error - no response received');
        }
      } else {
        setMessage("Something went wrong. Try again later.");

        if (process.env.NODE_ENV === 'development') {
          console.error('[VendorVerify] Unexpected error:', error.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!email) return setMessage("âš ï¸ Email not found.");

    try {
      setResending(true);
      setMessage(null);

      // âœ… Explicit endpoint construction for clarity
      const endpoint = `${baseUrl}/vendor/auth/resend-otp`;

      if (process.env.NODE_ENV === 'development') {
        console.log('[VendorVerify] Resending OTP to:', endpoint);
        console.log('[VendorVerify] Email:', email);
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
        console.log('[VendorVerify] Resend response:', data);
      }

      if (data.status === false) {
        setMessage(data.message || "Failed to resend OTP.");
        return;
      }

      setMessage("âœ… OTP resent successfully! Check your email.");
    } catch (error) {
      console.error('[VendorVerify] Resend error:', error);

      if (error.response) {
        const errorMessage = error.response.data.message || "Failed to resend OTP.";
        setMessage(errorMessage);

        if (process.env.NODE_ENV === 'development') {
          console.error('[VendorVerify] Server error:', error.response.status, errorMessage);
        }
      } else if (error.request) {
        setMessage("Network error. Please check your connection.");

        if (process.env.NODE_ENV === 'development') {
          console.error('[VendorVerify] Network error - no response received');
        }
      } else {
        setMessage("Something went wrong. Try again later.");

        if (process.env.NODE_ENV === 'development') {
          console.error('[VendorVerify] Unexpected error:', error.message);
        }
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden relative">
      {/* <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-orange-600/5 rounded-full blur-[120px] animate-pulse delay-700" /> */}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] p-2 md:p-6 relative z-10"
      >
        <div className="text-center">
          {/* <LogoImage /> */}
          <div className="w-16 h-16 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>

          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none mb-3">
            Verify <span className="text-orange-600">Account</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-relaxed mb-8">
            A 6-digit code has been sent to<br />
            <span className="text-slate-600 dark:text-slate-200 mt-1 inline-block">{email || "your-email@example.com"}</span>
          </p>
        </div>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-2 mb-3">
          {otp.map((digit, index) => (
            <motion.input
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-12 h-14 text-center bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-xl font-black text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`text-center p-3 rounded-xl mb-6 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${message.includes("âœ…") ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
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
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black uppercase italic tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify Securely</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleResendOTP}
            disabled={resending}
            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-4 rounded-2xl font-black uppercase italic tracking-widest flex items-center justify-center gap-3 hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Resending...</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                <span>Resend Code</span>
              </>
            )}
          </motion.button>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 text-center">
          <Link
            href="/vendors/auth/login"
            className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-orange-500 transition-colors"
          >
            Return to Login Screen
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

