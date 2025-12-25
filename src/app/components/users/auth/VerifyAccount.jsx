"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { useApi } from "@/app/context/ApiContext";
import { useUserStorage } from "@/app/hooks/useUserStorage";

// GrubDash Logo Component
const LogoImage = () => (
  <img
    src="/logo.png"
    alt="GrubDash Logo"
    className="w-[170px] mx-auto mb-4 object-contain"
  />
);

export default function VerifyAccount() {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes countdown
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const { baseUrl } = useApi();
  const { saveUser } = useUserStorage();

  // Start timer immediately on page load
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/user/auth/verify-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });
      const data = await res.json();

      if (!res.ok || data.status === false) {
        toast.error(data.message || "OTP verification failed");
        return;
      }

      saveUser(data);

      // ✅ Extract token and save to localStorage
      if (data?.token) {
        localStorage.setItem("userToken", data.token);
      }

      toast.success("Verified Successfully! Redirecting...");
      setTimeout(() => router.push("/home"), 1000);
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || timeLeft > 0) return; // allow resend only if timer reached 0

    try {
      setResending(true);
      const res = await fetch(`${baseUrl}/user/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok || data.status === false) {
        toast.error(data.message || "Could not resend OTP");
        return;
      }

      toast.success("OTP Sent! Check your email.");
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();

      // Reset countdown after resend
      setTimeLeft(600);

      // Start countdown again
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      toast.error("Something went wrong. Try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center overflow-auto">
      <div className="bg-white text-center p-6 w-full max-w-md rounded-2xl flex-shrink-0">
        {/* <LogoImage /> */}
        <h2 className="text-2xl font-bold text-orange-500 mb-2">Email Verification</h2>
        <p className="text-sm text-gray-600 mb-2">
          Enter the 6-digit OTP sent to your email: <strong>{email || "example@example.com"}</strong>
        </p>
        <p className="text-sm text-gray-500 mb-4">
          OTP expires in {formatTime(timeLeft)}
        </p>

        <div className="flex justify-center gap-2 mb-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-12 h-12 text-xl text-center border-2 border-orange-500 rounded-md focus:outline-none focus:border-orange-600 focus:shadow-md"
            />
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleVerify}
            disabled={loading}
            className="bg-orange-500 cursor-pointer text-white py-2 rounded hover:bg-orange-600 transition"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <button
            onClick={handleResend}
            disabled={resending || timeLeft > 0} // only clickable if timer = 0
            className={`border-2 border-orange-500 text-orange-500 py-2 rounded hover:bg-orange-100 transition ${
              resending || timeLeft > 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {resending ? "Resending..." : "Resend OTP"}
          </button>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
