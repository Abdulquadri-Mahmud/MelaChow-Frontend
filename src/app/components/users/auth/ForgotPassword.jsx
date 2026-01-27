"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Mail, ArrowRight, Loader2, X, ShieldQuestion, ArrowLeft } from "lucide-react";

const LogoImage = () => (
  <div className="relative group">
    <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full scale-150 group-hover:scale-175 transition-transform duration-700" />
    <img
      src="/logo.png"
      alt="GrubDash Logo"
      className="w-[180px] object-contain relative z-10 mx-auto"
    />
  </div>
);

export default function ForgotPassword() {
  const { baseUrl } = useApi();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!email) {
      setMessage("⚠️ Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${baseUrl}/user/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Password reset OTP sent to your email!");
        setTimeout(() => {
          router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
        }, 1200);
      } else {
        setMessage(data.message || "❌ Failed to send reset link.");
      }
    } catch (error) {
      console.error(error);
      setMessage("⚠️ Network error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center  overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-orange-600/5 rounded-full blur-[120px] animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[40px] p-8 md:p-10 shadow-2xl shadow-zinc-200/50 dark:shadow-none border border-zinc-100 dark:border-zinc-800 relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <LogoImage />
          <div className="w-16 h-16 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-3xl flex items-center justify-center mt-8 mb-6">
            <ShieldQuestion size={32} />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white leading-none">
              Recovery <span className="text-orange-600">Mode</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
              Enter your registered email to reset your access
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5 group">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-4 pl-12 rounded-2xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-medium dark:text-white"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-black uppercase italic tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50 active:scale-95 group"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </form>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className={`text-center mt-6 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${message.includes("✅") ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-500 border border-rose-100"
                }`}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 pt-8 border-t border-zinc-50 dark:border-zinc-800 text-center">
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 text-[11px] font-black uppercase italic tracking-[0.2em] text-zinc-400 hover:text-orange-600 transition-all"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
