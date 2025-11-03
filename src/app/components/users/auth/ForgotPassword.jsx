"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";

const LogoImage = () => (
  <img
    src="/logo.png"
    alt="ChowConnect Logo"
    className="w-[170px] object-contain"
  />
);

export default function ForgotPassword() {
  const { baseUrl } = useApi();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!email) {
      setMessage("⚠️ Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${baseUrl}/user/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Password reset OTP sent to your email!");
        // redirect to verify page with email in query param
        setTimeout(() => {
          router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
        }, 1200);
      } else {
        setMessage(data.message || "❌ Failed to send reset link.");
      }
    } catch (error) {
      console.error(error);
      setMessage("⚠️ Network error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center overflow-auto">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl flex-shrink-0">
        <div className="w-full flex justify-center items-center mb-5">
          <LogoImage />
        </div>

        <h2 className="text-2xl font-bold text-center text-[#FF6B00] mb-2">
          Forgot Password
        </h2>
        <p className="text-center text-gray-600 text-sm mb-6">
          Enter your registered email address and we’ll send you a 6-digit code
          to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-lg w-full p-3 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-semibold ${
              loading
                ? "bg-[#FF6B00]/70 cursor-not-allowed"
                : "bg-[#FF6B00] hover:bg-orange-600 transition"
            }`}
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>

        {message && (
          <p
            className={`text-center mt-4 text-sm ${
              message.includes("✅") ? "text-green-600" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        <p className="text-center text-gray-500 text-sm mt-6">
          Remembered your password?{" "}
          <a
            href="/auth/signin"
            className="text-[#FF6B00] font-medium hover:underline"
          >
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
