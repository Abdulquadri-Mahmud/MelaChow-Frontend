"use client";

import { useApi } from "@/app/context/ApiContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { TokenManager } from "@/app/lib/auth-token";
import AuthFrame, { authInputClass, authLabelClass } from "./AuthFrame";

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
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${type === 'success' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-500'
              }`}>
              {type === 'success' ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
            </div>

            <h3 className="text-2xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white mb-2">
              {type === 'success' ? 'Welcome Back!' : 'Oops!'}
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
              {type === 'success' ? 'Enter MelaChow' : 'Try Again'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function Signin() {
  const { baseUrl } = useApi();
  const router = useRouter();
  const { saveUser } = useUserStorage();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', message: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Auto-redirect after 1 second on success
  useEffect(() => {
    let timeout;
    if (statusModal.isOpen && statusModal.type === 'success') {
      timeout = setTimeout(() => {
        router.push("/home");
      }, 1000);
    }
    return () => clearTimeout(timeout);
  }, [statusModal.isOpen, statusModal.type, router]);

  const closeModal = () => {
    const wasSuccess = statusModal.type === 'success';
    setStatusModal({ ...statusModal, isOpen: false });
    if (wasSuccess) {
      router.push("/home");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = `${baseUrl}/user/auth/login-password`;

      const { data } = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      const { accessToken, token, ...userData } = data;
      const finalToken = accessToken || token;

      if (finalToken) {
        TokenManager.setToken(finalToken);
      }

      if (userData && (userData.user || userData._id)) {
        saveUser(userData.user || userData);
      }

      setStatusModal({
        isOpen: true,
        type: 'success',
        message: "Login successful! Redirecting to your dashboard."
      });

    } catch (err) {
      console.error('[Signin] Error:', err);
      const pendingAccount = err.response?.data?.requiresVerification || err.response?.data?.code === "ACCOUNT_VERIFICATION_REQUIRED";
      if (pendingAccount) {
        router.push(`/auth/verify-registration?email=${encodeURIComponent(err.response?.data?.email || formData.email)}&returnTo=signin`);
        return;
      }
      const errorMessage = err.response?.data?.message || "Invalid email or password. Please try again.";

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
    <AuthFrame subtitle="Premium food experience">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <h2 className="mb-1 text-[29px] font-semibold tracking-tight">Welcome back</h2>
        <p className="mb-6 text-base text-slate-500">Sign in to order, pay, and track your rider in real time.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className={authLabelClass}>Email or phone</label>
            <input
              type="text"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className={authInputClass}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className={authLabelClass}>Password</label>
              <Link
                href="/auth/forgot-password"
                className="text-xs font-semibold text-orange-700"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Your password"
                value={formData.password}
                onChange={handleChange}
                className={`${authInputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-orange-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full rounded-[20px] bg-orange-500 py-5 text-base font-semibold text-white shadow-[0_10px_20px_rgba(249,115,22,0.25)] transition hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-7 text-center">
          <p className="text-sm text-slate-500">
            New to MelaChow?
          </p>
            <Link
              href="/auth/signup"
              className="mt-4 inline-block font-semibold text-orange-700"
            >
              Create an account
            </Link>
        </div>
      </motion.div>

      <StatusModal
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        message={statusModal.message}
        onClose={closeModal}
      />
    </AuthFrame>
  );
}

