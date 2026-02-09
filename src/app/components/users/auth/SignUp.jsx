"use client";

import { useApi } from "@/app/context/ApiContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  ArrowRight,
  Loader2,
  Store,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-zinc-100 dark:border-zinc-800 relative overflow-hidden"
        >
          {/* Decorative Background */}
          <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 ${type === 'success' ? 'bg-orange-500' : 'bg-rose-500'
            }`} />

          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-sm ${type === 'success' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-500'
              }`}>
              {type === 'success' ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
            </div>

            <h3 className="text-2xl font-black italic uppercase tracking-tight text-zinc-900 dark:text-white mb-2">
              {type === 'success' ? 'Success!' : 'Oops!'}
            </h3>

            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[240px]">
              {message}
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className={`mt-8 w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg ${type === 'success'
                  ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20'
                  : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-zinc-900/20'
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
    <div className="h-screen w-full bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md flex flex-col h-full max-h-[90vh] justify-center"
      >
        {/* Header Section */}
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-4xl font-black italic uppercase tracking-tight text-zinc-900 dark:text-white">
            Create <span className="text-orange-600">Account</span>
          </h2>
          <p className="text-xs font-semibold text-zinc-500">
            Start your gourmet journey today
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 ml-1">First Name</label>
              <input
                type="text"
                name="firstname"
                placeholder="John"
                value={formData.firstname}
                onChange={handleChange}
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-base font-medium dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm border border-transparent focus:border-orange-500/20"
                required
              />
            </div>
            {/* Last Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 ml-1">Last Name</label>
              <input
                type="text"
                name="lastname"
                placeholder="Doe"
                value={formData.lastname}
                onChange={handleChange}
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-base font-medium dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm border border-transparent focus:border-orange-500/20"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 ml-1">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-base font-medium dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm border border-transparent focus:border-orange-500/20"
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 ml-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="0800 000 0000"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-base font-medium dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm border border-transparent focus:border-orange-500/20"
              required
            />
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-xl shadow-orange-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight size={20} />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-6">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-orange-600 hover:text-orange-700 font-bold ml-1">
              Sign In
            </Link>
          </p>

          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <Link
              href="/vendors/auth/register"
              className="group inline-flex items-center gap-3 px-6 py-4 bg-orange-50/50 dark:bg-orange-500/5 rounded-[1.5rem] hover:bg-orange-100 dark:hover:bg-orange-500/10 transition-all duration-300 border border-transparent hover:border-orange-200"
            >
              <Store className="w-5 h-5 text-orange-600" />
              <div className="text-left">
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Restaurant Owner?</p>
                <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wider">Join as Vendor</p>
              </div>
              <ArrowRight className="w-4 h-4 text-orange-600 group-hover:translate-x-1 transition-transform ml-2" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Custom Status Modal */}
      <StatusModal
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        message={statusModal.message}
        onClose={closeModal}
      />
    </div>
  );
}
