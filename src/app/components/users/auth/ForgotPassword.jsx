"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Mail, ArrowRight, Loader2, X, ShieldQuestion, ArrowLeft } from "lucide-react";
import axios from "axios";

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

      // ✅ Explicit endpoint construction for clarity
      const endpoint = `${baseUrl}/user/auth/forgot-password`;

      if (process.env.NODE_ENV === 'development') {
        console.log('[ForgotPassword] Sending request to:', endpoint);
        console.log('[ForgotPassword] Email:', email);
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
        console.log('[ForgotPassword] Response:', data);
      }

      setMessage("✅ Password reset OTP sent to your email!");
      setTimeout(() => {
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
      }, 1200);
    } catch (error) {
      console.error('[ForgotPassword] Error:', error);

      if (error.response) {
        const errorMessage = error.response.data.message || "❌ Failed to send reset link.";
        setMessage(errorMessage);

        if (process.env.NODE_ENV === 'development') {
          console.error('[ForgotPassword] Server error:', error.response.status, errorMessage);
        }
      } else if (error.request) {
        setMessage("⚠️ Network error. Please check your connection.");

        if (process.env.NODE_ENV === 'development') {
          console.error('[ForgotPassword] Network error - no response received');
        }
      } else {
        setMessage("⚠️ Network error. Try again later.");

        if (process.env.NODE_ENV === 'development') {
          console.error('[ForgotPassword] Unexpected error:', error.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md flex flex-col h-full max-h-[90vh] justify-center"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-3xl flex items-center justify-center mb-6">
            <ShieldQuestion size={36} />
          </div>
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-black italic uppercase tracking-tight text-zinc-900 dark:text-white">
              Recovery <span className="text-orange-600">Mode</span>
            </h1>
            <p className="text-xs font-semibold text-zinc-500 max-w-[280px] mx-auto">
              Enter your registered email to reset your access
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col justify-center">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-base font-medium dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span>Sending...</span>
              </>
            ) : (
              <span>Send Reset Link</span>
            )}
          </motion.button>
        </form>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className={`text-center mt-4 p-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${message.includes("✅") ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-rose-50 text-rose-500 dark:bg-rose-500/10"
                }`}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 text-center">
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-orange-600 transition-all"
          >
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
