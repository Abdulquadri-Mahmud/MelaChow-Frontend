"use client";

import React, { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import { useVendorStorage } from "@/app/hooks/vendorStorage";

const LogoImage = () => (
  <img
    src="/logo.png"
    alt="ChowConnect Logo"
    className="w-[170px] object-contain"
  />
);

export default function VerifyAccount() {
  const { baseUrl } = useApi();
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState(null);

  const { saveVendor } = useVendorStorage();

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  // Handle OTP input
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

  // Handle backspace navigation
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setMessage("⚠️ Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const res = await fetch(`${baseUrl}/vendor/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await res.json();

      if (!res.ok || data.status === false) {
        setMessage(data.message || "OTP verification failed.");
        return;
      }

      // Save token and user
      if (data?.token) {
        localStorage.setItem("vendorToken", data.token);
        saveVendor(data);
        console.log("✅ Token saved:", localStorage.getItem("vendorToken"));
      }

      setMessage("✅ Verified successfully! Redirecting...");
      router.push("/vendors/dashboard")
    } catch (error) {
      console.error("Verification error:", error);
      setMessage("Something went wrong. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!email) return setMessage("⚠️ Email not found.");

    try {
      setResending(true);
      setMessage(null);

      const res = await fetch(`${baseUrl}/vendor/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok || data.status === false) {
        setMessage(data.message || "Failed to resend OTP.");
        return;
      }

      setMessage("✅ OTP resent successfully! Check your email.");
    } catch (error) {
      console.error("Resend error:", error);
      setMessage("Something went wrong. Try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center overflow-auto">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl flex-shrink-0">
        <div className="w-full mb-5 flex justify-center items-center">
          <LogoImage />
        </div>

        <h1 className="text-2xl font-bold text-center text-orange-500 mb-3">
          Email Verification
        </h1>

        <p className="text-center text-gray-600 text-sm mb-6">
          Enter the 6-digit OTP sent to your email:{" "}
          <strong>{email || "unknown@example.com"}</strong>
        </p>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-3 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-10 h-10 text-center border-2 border-orange-500 rounded-md text-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          ))}
        </div>

        {message && (
          <p className="text-center text-sm mb-3 text-gray-700">{message}</p>
        )}

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading}
          className={`w-full py-2 rounded-md text-white font-medium ${
            loading
              ? "bg-orange-400 cursor-not-allowed"
              : "bg-orange-500 hover:bg-orange-600 transition"
          }`}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        {/* Resend OTP */}
        <button
          onClick={handleResendOTP}
          disabled={resending}
          className="w-full mt-4 py-2 text-orange-500 font-medium border border-orange-500 rounded-md hover:bg-orange-50 transition"
        >
          {resending ? "Resending..." : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}