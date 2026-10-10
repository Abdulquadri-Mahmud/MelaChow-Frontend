"use client";

import { useApi } from "@/app/context/ApiContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
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
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-sm ${type === 'success' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-500'
              }`}>
              {type === 'success' ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
            </div>

            <h3 className="text-2xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white mb-2">
              {type === 'success' ? 'Success!' : 'Oops!'}
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
              {type === 'success' ? 'Continue' : 'Try Again'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function Signup() {
  const { baseUrl } = useApi();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    avatar: "",
  });

  const [loading, setLoading] = useState(false);
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const closeModal = () => {
    setStatusModal({ ...statusModal, isOpen: false });
    // ❌ REMOVED: Don't redirect on modal close
    // The redirect now happens automatically in handleSubmit after API success
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Using the new registration endpoint
      const endpoint = `${baseUrl}/user/auth/register`;

      if (process.env.NODE_ENV === 'development') {
        console.log('[SignUp] Dispatching registration to:', endpoint);
      }

      const { data } = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      // Show success message briefly, then redirect
      setStatusModal({
        isOpen: true,
        type: 'success',
        message: "Account created! We've sent a verification code to your email. Redirecting..."
      });

      // ✅ Auto-redirect after 2 seconds (don't wait for modal close)
      setTimeout(() => {
        setStatusModal({ ...statusModal, isOpen: false });
        router.push(`/auth/verify-registration?email=${encodeURIComponent(formData.email)}`);
      }, 1000);

    } catch (err) {
      console.error('[SignUp] Registration failed:', err);
      const errorMessage = err.response?.data?.message || "Signup failed. Please check your network or try again.";

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
    <AuthFrame subtitle="Join the food community">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 inline-flex rounded-full bg-orange-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700">Step 1 of 3 · Account info</div>
        <h2 className="mb-2 text-[28px] font-semibold tracking-tight">Create account</h2>
        <p className="mb-6 text-base leading-relaxed text-slate-500">Fill in your details. We&apos;ll send a verification code to your email.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1">
            {/* First Name */}
            <div className="space-y-2">
              <label className={authLabelClass}>First name</label>
              <input
                type="text"
                name="firstname"
                placeholder="Ada"
                value={formData.firstname}
                onChange={handleChange}
                className={authInputClass}
                required
              />
            </div>
            {/* Last Name */}
            <div className="space-y-2">
              <label className={authLabelClass}>Last name</label>
              <input
                type="text"
                name="lastname"
                placeholder="Okafor"
                value={formData.lastname}
                onChange={handleChange}
                className={authInputClass}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className={authLabelClass}>Email address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className={authInputClass}
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className={authLabelClass}>Phone number</label>
            <input
              type="tel"
              name="phone"
              placeholder="+234 800 000 0000"
              value={formData.phone}
              onChange={handleChange}
              className={authInputClass}
              required
            />
          </div>

          {/* Submit Button */}
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create account &amp; get code</span>
              </>
            )}
          </motion.button>
        </form>

        {/* Footer Links */}
        <div className="mt-7 text-center">
          <p className="text-sm text-slate-500">Already have an account?</p>
            <Link href="/auth/signin" className="text-orange-600 hover:text-orange-700 font-bold ml-1">
              Sign in instead
            </Link>
        </div>
      </motion.div>

      {/* Custom Status Modal */}
      <StatusModal
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        message={statusModal.message}
        onClose={closeModal}
      />
    </AuthFrame>
  );
}
