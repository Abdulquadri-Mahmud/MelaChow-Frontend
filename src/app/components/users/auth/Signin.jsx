"use client";

import { useApi } from "@/app/context/ApiContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const LogoImage = () => (
  <img
    src="/logo.png"
    alt="ChowConnect Logo"
    className="w-[170px] object-contain"
  />
);

export default function Signin() {
  const { baseUrl } = useApi();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${baseUrl}/user/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      console.log(data);

      if (res.ok) {
        setMessage("Signin successful! 🎉 Redirecting...");
        router.push(
          `/auth/verify-account?email=${encodeURIComponent(formData.email)}`
        );
      } else {
        setMessage(data.message || "Invalid email or password.");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center overflow-auto">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl flex-shrink-0">
        <div className="flex justify-center mb-4">
          <LogoImage />
        </div>
        <p className="text-center text-gray-600 text-sm mt-4 mb-6">
          Welcome back! Sign in to continue ordering
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              className="border border-gray-200 rounded-lg w-full p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] transition"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="border border-gray-200 rounded-lg w-full p-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#FF6B00] focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="py-2 w-full flex justify-end items-end">
            <Link
              href="/auth/forgot-password"
              className="underline text-red-500 text-sm text-right"
            >
              Forgot Password
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer bg-[#FF6B00] text-white py-3 rounded-lg hover:bg-orange-600 transition font-semibold"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {message && (
          <p
            className={`text-center mt-4 text-sm ${
              message.includes("successful") ? "text-green-600" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        <p className="text-center text-gray-500 text-sm mt-6">
          Don’t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-[#FF6B00] font-medium hover:underline"
          >
            Create one
          </Link>
        </p>
        <p className="text-sm text-center mt-4">
          Looking to grow your food business?{" "}
          <Link
            href="/vendors/auth/register"
            className="text-orange-500 font-medium hover:underline"
          >
            Join the GrubDash Vendor Network
          </Link>
        </p>
      </div>
    </div>
  );
}
