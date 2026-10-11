"use client";

import { useApi } from "@/app/context/ApiContext";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { TokenManager } from "@/app/lib/auth-token";
import AuthFrame, { authInputClass, authLabelClass } from "./AuthFrame";

export default function Signin() {
  const { baseUrl } = useApi();
  const router = useRouter();
  const { saveUser } = useUserStorage();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setErrorMessage("");
    setLoading(true);
    let navigating = false;

    try {
      const endpoint = `${baseUrl}/user/auth/login-password`;

      const { data } = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
        timeout: 12000,
      });

      if (!data?.user && !data?._id) {
        throw new Error("Sign in succeeded, but your account details were missing. Please try again.");
      }
      const { accessToken, token, ...userData } = data;
      const finalToken = accessToken || token;

      if (finalToken) {
        TokenManager.setToken(finalToken);
      }

      if (userData && (userData.user || userData._id)) {
        saveUser(userData.user || userData);
      }

      navigating = true;
      if (process.env.NEXT_PUBLIC_MOBILE_BUILD === "true") {
        window.location.replace("/");
      } else {
        router.replace("/");
      }

    } catch (err) {
      console.error('[Signin] Error:', err);
      const pendingAccount = err.response?.data?.requiresVerification || err.response?.data?.code === "ACCOUNT_VERIFICATION_REQUIRED";
      if (pendingAccount) {
        router.push(`/auth/verify-registration?email=${encodeURIComponent(err.response?.data?.email || formData.email)}&returnTo=signin`);
        return;
      }
      setErrorMessage(err.response?.data?.message || (err.code === "ECONNABORTED"
        ? "Sign in took too long. Check your connection and try again."
        : err.message === "Network Error"
          ? "Could not connect. Check your connection and try again."
          : err.message || "Sign in failed. Please try again."));
    } finally {
      if (!navigating) {
        submitting.current = false;
        setLoading(false);
      }
    }
  };

  return (
    <AuthFrame subtitle="Premium food experience">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <h2 className="mb-1 text-[clamp(22px,3dvh,27px)] font-semibold tracking-tight">Welcome back</h2>
        <p className="mb-4 text-sm text-slate-500">Sign in to order, pay, and track your rider in real time.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className={authLabelClass}>Email or phone</label>
            <input
              type="text"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="username"
              className={authInputClass}
              required
            />
          </div>

          <div className="space-y-1">
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
                autoComplete="current-password"
                className={`${authInputClass} pr-12`}
                required
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

          {errorMessage && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-base font-semibold text-white shadow-[0_8px_16px_rgba(249,115,22,0.2)] transition hover:bg-orange-600 disabled:opacity-50"
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

        <div className="mt-5 text-center">
          <p className="text-sm text-slate-500">
            New to MelaChow?
          </p>
            <Link
              href="/auth/signup"
              className="mt-2 inline-block font-semibold text-orange-700"
            >
              Create an account
            </Link>
        </div>
      </motion.div>

    </AuthFrame>
  );
}

