"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useApi } from "@/app/context/ApiContext";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ArrowRight, Loader2, RefreshCw, X, Clock } from "lucide-react";

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
      toast.success("OTP pasted successfully!");
    } else {
      toast.error("Please paste a valid 6-digit OTP");
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/user/auth/verify-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });
      const data = await res.json();

      if (!res.ok || data.status === false) {
        toast.error(data.message || "OTP verification failed");
        return;
      }

      saveUser(data);

      if (data?.token) {
        localStorage.setItem("userToken", data.token);
      }

      toast.success("Verified Successfully! Redirecting...");
      setTimeout(() => router.push("/home"), 1000);
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong. Try again later.");
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center overflow-hidden relative">
      <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-orange-600/5 rounded-full blur-[120px] animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[40px] p-4 md:p-10 shadow-2xl border border-zinc-100 dark:border-zinc-800 relative z-10"
      >
        <div className="text-center">
          <LogoImage />
          <div className="w-16 h-16 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>

          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white leading-none mb-3">
            Verify <span className="text-orange-600">Account</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 leading-relaxed mb-6">
            A 6-digit code has been sent to<br />
            <span className="text-zinc-600 dark:text-zinc-200 mt-1 inline-block">{email || "your-email@example.com"}</span>
          </p>

          <div className="flex items-center justify-center gap-2 mb-8 bg-zinc-50 dark:bg-zinc-800/50 py-2 px-4 rounded-full w-fit mx-auto border border-zinc-100 dark:border-zinc-800">
            <Clock size={12} className="text-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Expires in {formatTime(timeLeft)}
            </span>
          </div>
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

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-black uppercase italic tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50 active:scale-95 group"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span>Complete Setup</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={timeLeft === 0 ? { scale: 1.01 } : {}}
            whileTap={timeLeft === 0 ? { scale: 0.98 } : {}}
            onClick={handleResend}
            disabled={resending || timeLeft > 0}
            className={`w-full py-4 rounded-2xl font-black uppercase italic tracking-widest flex items-center justify-center gap-3 transition-all ${resending || timeLeft > 0
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed border border-transparent"
                : "bg-white dark:bg-zinc-900 text-orange-600 border border-orange-100 dark:border-orange-500/20 hover:bg-orange-50 dark:hover:bg-orange-500/5 shadow-lg active:scale-95"
              }`}
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

        <div className="mt-4 pt-4 border-t border-zinc-50 dark:border-zinc-800 text-center">
          <button
            onClick={() => router.push("/auth/signin")}
            className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-orange-500 transition-colors"
          >
            Cancel and return to Sign In
          </button>
        </div>
      </motion.div>
    </div>
  );
}
