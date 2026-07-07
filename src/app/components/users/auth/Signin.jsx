"use client";

import { useApi } from "@/app/context/ApiContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Store, CheckCircle2, AlertCircle, X, Bike } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { TokenManager } from "@/app/lib/auth-token";

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
    <div className="min-h-screen w-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-y-auto p-3 md:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md flex flex-col justify-center py-6"
      >
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-4xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white">
            Welcome <span className="text-orange-600">Back</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            Sign in to continue ordering
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-2">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-base font-medium dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all border border-slate-200 focus:border-orange-500/20"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Password</label>
              <Link
                href="/auth/forgot-password"
                className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-base font-medium dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all pr-12 border border-slate-200 focus:border-orange-500/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600 transition-colors"
                tabIndex={-1}
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
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-xl shadow-orange-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={20} />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center space-y-6">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Don't have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-orange-600 hover:text-orange-700 font-bold ml-1"
            >
              Create One
            </Link>
          </p>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4 w-full">
            <Link
              href="/auth/partner"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex-1 flex items-center justify-between md:p-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-3xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform shadow-inner">
                  <Store size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Partner Portal</p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Vendors 
                    {/* & Riders */}
                  </p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors mr-2" />
            </Link>
          </div>
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

