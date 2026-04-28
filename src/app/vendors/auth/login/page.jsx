"use client";
import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useApi } from "@/app/context/ApiContext";
import { Eye, EyeOff, X, Mail, Lock, ArrowRight, Loader2, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import { TokenManager } from "@/app/lib/auth-token";

export default function VendorLoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { baseUrl } = useApi();
  const router = useRouter();
  const { saveVendor } = useVendorStorage();

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint = `${baseUrl}/vendor/auth/login-password`;

      if (process.env.NODE_ENV === 'development') {
        console.log('[VendorLogin] Sending request to:', endpoint);
      }

      const res = await axios.post(endpoint, formData, {
        withCredentials: true
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('[VendorLogin] Response:', res.data);
      }

      const data = res.data;

      // Handle successful login
      const { accessToken, token, vendor, ...rest } = data;
      const vendorData = vendor || rest;
      const finalToken = accessToken || token;

      // Clear any cached vendor object from previous sessions that may be missing isApproved
      if (typeof window !== 'undefined') {
        localStorage.removeItem("melachow_vendor_cache");
      }

      if (finalToken) {
        TokenManager.setToken(finalToken, 'vendor');
      }

      if (vendorData) {
        saveVendor(vendorData);
      }

      setMessage("Signin successful! 🎉 Redirecting...");
      setTimeout(() => {
        router.push("/vendors/dashboard");
      }, 1000);

    } catch (err) {
      console.error('[VendorLogin] Error:', err);

      const errorData = err.response?.data;
      const status = err.response?.status;

      if (status === 403 && errorData?.requiresApproval) {
        // Guide: Account verified but NOT yet approved.
        setMessage(errorData.message || "Your account is pending admin approval.");
        setTimeout(() => {
          router.push("/vendors/pending-approval");
        }, 2000);
      } else if (status === 401 && errorData?.requiresVerification) {
        // Guide: Email isn't verified.
        setMessage("Email not verified. Redirecting to verification center...");
        setTimeout(() => {
          router.push(`/vendors/auth/verify-registration?email=${encodeURIComponent(formData.email)}`);
        }, 2000);
      } else if (status === 423) {
        // Guide: Brute force lock.
        setMessage("🚨 Security Lock: Too many attempts. Please wait 15 minutes.");
      } else if (status === 401) {
        setMessage("Invalid credentials. Please check your email and password.");
      } else {
        setMessage(errorData?.message || "Login failed. Please check your network.");
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
        className="w-full max-w-md flex flex-col h-full max-h-[60vh] justify-center"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-black italic uppercase tracking-tight text-zinc-900 dark:text-white">
              Vendor <span className="text-orange-600">Login</span>
            </h1>
            <p className="text-xs font-semibold text-zinc-500">
              Access your restaurant dashboard
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col justify-center">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="vendor@restaurant.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-base font-medium dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Password</label>
              <Link
                href="/vendors/auth/forgot-password"
                className="text-xs font-bold text-orange-600 hover:text-orange-700"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-base font-medium dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-orange-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <span>Sign In</span>
            )}
          </motion.button>
        </form>

        <div className="mt-4 pt-4 border-t border-zinc-50 dark:border-zinc-800 text-center space-y-4">
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight">
            Don't have a vendor account?{" "}
            <Link
              href="/vendors/auth/register"
              className="text-orange-600 hover:text-orange-700 transition font-black tracking-widest italic"
            >
              REGISTER NOW
            </Link>
          </p>

          <Link
            href="/auth/signin"
            className="inline-block p-1 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 border border-zinc-100 dark:border-zinc-700 text-[9px] font-black uppercase text-zinc-400 hover:text-orange-500 hover:border-orange-500/20 transition-all tracking-[0.2em]"
          >
            Switch to Customer Login
          </Link>
        </div>
      </motion.div>

      {/* ✅ Premium Notification Modal */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 w-full max-w-sm text-center shadow-2xl relative "
            >
              <button
                onClick={() => setMessage("")}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-4 flex justify-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${message.includes("successful") ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                  }`}>
                  {message.includes("successful") ? <Store size={32} /> : <X size={32} />}
                </div>
              </div>

              <h2 className={`text-xl font-black uppercase italic tracking-tighter mb-2 ${message.includes("successful") ? "text-emerald-600" : "text-rose-500"
                }`}>
                {message.includes("successful") ? "Success" : "Notice"}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-tight leading-relaxed">{message}</p>

              <button
                onClick={() => setMessage("")}
                className="mt-8 w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-black uppercase italic tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
              >
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

