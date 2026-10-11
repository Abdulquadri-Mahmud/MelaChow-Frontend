"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Mail, ArrowRight, Loader2, X, ShieldQuestion, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
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
              {type === 'success' ? 'Email Sent!' : 'Oops!'}
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
              {type === 'success' ? 'Enter OTP' : 'Try Again'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function ForgotPassword() {
  const { baseUrl } = useApi();
  const [email, setEmail] = useState("");
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', message: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const closeModal = () => {
    const wasSuccess = statusModal.type === 'success';
    setStatusModal({ ...statusModal, isOpen: false });
    if (wasSuccess) {
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setStatusModal({
        isOpen: true,
        type: 'error',
        message: "Please enter your email address to recover your account."
      });
      return;
    }

    try {
      setLoading(true);
      const endpoint = `${baseUrl}/user/auth/forgot-password-new`;

      const { data } = await axios.post(
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
        message: "We've sent a 6-digit verification code to your email. Check your inbox to proceed."
      });

    } catch (error) {
      console.error('[ForgotPassword] Error:', error);
      const errorMessage = error.response?.data?.message || "We couldn't find an account with that email address. Please check and try again.";

      setStatusModal({
        isOpen: true,
        type: 'error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full overflow-y-auto bg-[#fffaf4] px-4 py-5 pb-[env(safe-area-inset-bottom)] text-slate-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex w-full max-w-md flex-col"
      >
        <div className="mb-5 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 shadow-sm">
            <ShieldQuestion size={36} />
          </div>
          <div className="text-center space-y-3">
            <h1 className="text-[27px] font-black uppercase tracking-tight text-slate-900">
              Recovery <span className="text-orange-600">Mode</span>
            </h1>
            <p className="text-xs font-semibold text-slate-500 max-w-[280px] mx-auto leading-relaxed">
              Lost your key? Enter your registered email and we'll help you reset your password.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-base font-medium dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm border border-transparent focus:border-orange-500/20"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight size={20} />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-5 text-center">
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-orange-600 transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Sign In
          </Link>
        </div>
      </motion.div>

      <StatusModal
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        message={statusModal.message}
        onClose={closeModal}
      />
    </div>
  );
}
