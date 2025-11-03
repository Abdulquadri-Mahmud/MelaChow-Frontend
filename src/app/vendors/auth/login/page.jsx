"use client";
import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useApi } from "@/app/context/ApiContext";
import { Eye, EyeOff, X } from "lucide-react";
import { useRouter } from "next/navigation";

const LogoImage = () => (
  <img
    src="/logo.png"
    alt="GrubDash Logo"
    className="w-[170px] object-contain mx-auto"
  />
);

export default function VendorLoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
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
      console.log(res);

      if (res.status === 200) {
        setMessage("Signin successful! 🎉 Redirecting...");
        router.push(
          `/vendors/auth/verify-account?email=${encodeURIComponent(
            formData.email
          )}`
        );
      } else {
        setMessage(res.data.message || "Invalid email or password.");
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
    <div className="min-h-screen fixed inset-0 bg-gray-50 flex items-center justify-center overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-xl md:p-6 p-3 relative"
      >
        <div className="flex flex-col items-center mb-6">
          <LogoImage />
          <h1 className="text-2xl font-bold text-gray-800 mt-3">
            Vendor Login
          </h1>
          <p className="text-sm text-gray-600">
            Sign in to manage your GrubDash store
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-sm text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              placeholder="vendor@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 p-3 w-full border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none text-sm"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                required
                className="mt-1 p-3 w-full border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-md transition disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* Forgot Password */}
        <div className="text-center mt-4">
          <Link
            href="/vendor/forgot-password"
            className="text-sm text-orange-600 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Register */}
        <div className="text-center mt-3 text-sm">
          Don’t have a vendor account?{" "}
          <Link
            href="/vendors/auth/register"
            className="text-orange-600 font-semibold hover:underline"
          >
            Register
          </Link>
        </div>
      </motion.div>

      {/* ✅ Notification Modal */}
      <AnimatePresence>
        {message && (
          <motion.div
            key="notification-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl p-6 w-[90%] max-w-sm text-center shadow-lg"
            >
              <button
                onClick={() => setMessage("")}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
              <h2
                className={`text-lg font-semibold mb-2 ${
                  message.includes("successful")
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {message.includes("successful") ? "Success" : "Notice"}
              </h2>
              <p className="text-gray-600 text-sm">{message}</p>
              <button
                onClick={() => setMessage("")}
                className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 text-sm"
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}