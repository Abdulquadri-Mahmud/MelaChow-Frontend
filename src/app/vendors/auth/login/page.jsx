"use client";
import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useApi } from "@/app/context/ApiContext";
import { Eye, EyeOff, X, Mail, Lock, ArrowRight, Loader2, Store } from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function VendorLoginPage() {
  const [formData, setFormData] = useState({
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { baseUrl } = useApi();
  const router = useRouter();

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post(`${baseUrl}/vendor/auth/login`, formData);
      if (res.status === 200) {
        setMessage("Signin successful! 🎉 Redirecting...");
        router.push(
          `/vendors/auth/verify-account?email=${encodeURIComponent(
            formData.email
          )}`
        );
      } else {
        setMessage(res.data.message || "Invalid email.");
      }
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Network error. Please try again."
      );
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
        className="w-full max-w-md flex flex-col h-full max-h-[40vh] justify-center"
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
            Don’t have a vendor account?{" "}
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
