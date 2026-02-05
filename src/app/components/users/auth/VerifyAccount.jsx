"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useApi } from "@/app/context/ApiContext";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, Loader2, RefreshCw, X, Clock } from "lucide-react";
import { TokenManager } from "@/app/lib/auth-token";

const LogoImage = () => (
  <div className="relative group mx-auto mb-6 w-fit">
    <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full scale-125 transition-transform duration-700" />
    <img
      src="/logo.png"
      alt="GrubDash Logo"
      className="w-[160px] object-contain relative z-10"
    />
  </div>
);

export default function VerifyAccount() {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes countdown
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const { baseUrl } = useApi();
  const { saveUser } = useUserStorage();

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
  }, []);

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
      // Auto-submit on paste
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
      const res = await fetch(`${baseUrl}/user/auth/verify-account`, {
        method: "POST",
        credentials: "include", // ✅ CRITICAL: Save userToken cookie
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });
      const data = await res.json();

      if (!res.ok || data.status === false) {
        toast.error(data.message || "OTP verification failed");
        return;
      }

      // Filter out token if present, just in case
      // standardizing on 'accessToken' but keeping 'token' for backward compat
      const { accessToken, token, ...userData } = data;
      const finalToken = accessToken || token;

      // ✅ Save token for iOS fallback (Secure TokenManager)
      if (finalToken) {
        TokenManager.setToken(finalToken);
      }

      saveUser(userData);

      // Token is now handled by HttpOnly cookie automatically (primary)
      // TokenManager handles fallback (secondary)

      toast.success("Verified Successfully! Redirecting...");
      setTimeout(() => router.push("/home"), 1000);
    } catch (error) {
      console.error('[VerifyAccount] Verification error:', error);
      toast.error(error.message || "Something went wrong. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || timeLeft > 0) return;

    try {
      setResending(true);
      const res = await fetch(`${baseUrl}/user/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok || data.status === false) {
        toast.error(data.message || "Could not resend OTP");
        return;
      }

      toast.success("OTP Sent! Check your email.");
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
      setTimeLeft(600);
    } catch (error) {
      toast.error("Something went wrong. Try again later.");
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

          <h1 className="text-4xl font-black italic uppercase tracking-tight text-zinc-900 dark:text-white mb-3">
            Verify <span className="text-orange-600">Account</span>
          </h1>
          <p className="text-xs font-semibold text-zinc-500 mb-4">
            A 6-digit code has been sent to<br />
            <span className="text-zinc-700 dark:text-zinc-300 font-bold">{email || "your-email@example.com"}</span>
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
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <span>Complete Setup</span>
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

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/auth/signin")}
            className="text-sm font-medium text-zinc-500 hover:text-orange-600 transition-colors"
          >
            Cancel and return to Sign In
          </button>
        </div>
      </motion.div>
    </div>
  );
}
