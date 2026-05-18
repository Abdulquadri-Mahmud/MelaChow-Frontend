"use client";

import React, { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, Loader2, RefreshCw, ShieldCheck, CheckCircle2, AlertCircle, X, Eye, EyeOff } from "lucide-react";
import axios from "axios";

// --- Custom Status Modal Component ---
const StatusModal = ({ isOpen, type, message, buttonText, onClose }) => {
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
              {type === 'success' ? (buttonText || 'Continue') : 'Try Again'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function ResetPassword() {
  const { baseUrl } = useApi();
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', message: '', buttonText: 'Continue', redirectOnClose: false });
  const [resending, setResending] = useState(false);
  const [step, setStep] = useState(1);
  const [resetToken, setResetToken] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const closeModal = () => {
    const redirect = statusModal.redirectOnClose;
    setStatusModal({ ...statusModal, isOpen: false });
    if (redirect) {
      router.push("/auth/signin");
    }
  };

  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      setStatusModal({
        isOpen: true,
        type: 'success',
        message: "Verification code pasted! Now enter your new password.",
        buttonText: "Continue",
        redirectOnClose: false
      });
    } else {
      setStatusModal({
        isOpen: true,
        type: 'error',
        message: "Please paste a valid 6-digit verification code."
      });
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setStatusModal({ isOpen: true, type: 'error', message: "Please enter the 6-digit code we sent you." });
      return;
    }

    try {
      setLoading(true);
      const verifyEndpoint = `${baseUrl}/user/auth/verify-reset-code`;
      const verifyRes = await axios.post(
        verifyEndpoint,
        { email, otp: otpString },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );

      const isSuccess = verifyRes.status === 200 || verifyRes.data.success || verifyRes.data.status;
      if (!isSuccess) {
        throw new Error(verifyRes.data.message || "Invalid or expired code.");
      }

      const token = verifyRes.data.resetToken || verifyRes.data.token;
      setResetToken(token);
      setStep(2);
      
      setStatusModal({
        isOpen: true,
        type: 'success',
        message: "Code verified successfully! You can now securely set your new password.",
        buttonText: "Set New Password",
        redirectOnClose: false
      });

    } catch (error) {
      console.error('[VerifyOTP] Error:', error);
      const errorMessage = error.response?.data?.message || "Invalid code or connection error. Please try again.";
      setStatusModal({ isOpen: true, type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (!password || password.length < 8) {
      setStatusModal({ isOpen: true, type: 'error', message: "Your new password must be at least 8 characters long." });
      return;
    }

    try {
      setLoading(true);
      const endpoint = `${baseUrl}/user/auth/reset-password-new`;
      const { data } = await axios.post(
        endpoint,
        { email, resetToken, newPassword: password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (data.status === false) {
        setStatusModal({ isOpen: true, type: 'error', message: data.message || "Reset failed. Please try again." });
        return;
      }

      setStatusModal({
        isOpen: true,
        type: 'success',
        message: "Your password has been successfully updated! You can now log in with your new credentials.",
        buttonText: "Login Now",
        redirectOnClose: true
      });

    } catch (error) {
      console.error('[ResetPassword] Reset error:', error);
      const errorMessage = error.response?.data?.message || "Failed to reset password. Please try again.";
      setStatusModal({ isOpen: true, type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      setStatusModal({ isOpen: true, type: 'error', message: "We couldn't find your email address. Please go back and try again." });
      return;
    }

    try {
      setResending(true);
      const endpoint = `${baseUrl}/user/auth/resend-otp`;

      const { data } = await axios.post(
        endpoint,
        { email },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (data.status === false) {
        setStatusModal({ isOpen: true, type: 'error', message: data.message || "Failed to resend code." });
        return;
      }

      setStatusModal({
        isOpen: true,
        type: 'success',
        message: "A fresh 6-digit code has been sent to your email. Please check your inbox.",
        buttonText: "Got it",
        redirectOnClose: false
      });
    } catch (error) {
      console.error('[ResetPassword] Resend error:', error);
      setStatusModal({ isOpen: true, type: 'error', message: "Could not resend code. Please check your internet connection." });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md flex flex-col h-full max-h-[90vh] justify-center"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Lock size={36} />
          </div>

          <h1 className="text-4xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white mb-3">
            {step === 1 ? (
              <>Secure <span className="text-orange-600">Verify</span></>
            ) : (
              <>Set <span className="text-orange-600">Password</span></>
            )}
          </h1>
          <p className="text-xs font-semibold text-slate-500 mb-6 leading-relaxed">
            {step === 1 ? (
              <>
                Enter the 6-digit code sent to<br />
                <span className="text-slate-700 dark:text-slate-300 font-bold">{email}</span>
              </>
            ) : (
              <>Please enter your new strong password below.</>
            )}
          </p>
        </div>

        {step === 1 ? (
          <>
            {/* OTP Inputs */}
            <div className="flex justify-center gap-3 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl text-2xl font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all border border-transparent focus:border-orange-500/20 shadow-sm"
                />
              ))}
            </div>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleVerifyOTP}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-orange-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </motion.button>

              <button
                onClick={handleResendOTP}
                disabled={resending}
                className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-orange-100 dark:border-orange-900/30 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/5 shadow-sm disabled:opacity-50"
              >
                {resending ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Resending...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    <span>Resend Code</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* New Password Input */}
            <div className="space-y-2 mb-8">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 pr-12 rounded-xl text-base font-medium dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm border border-transparent focus:border-orange-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSetNewPassword}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-orange-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </motion.button>
            </div>
          </>
        )}
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
