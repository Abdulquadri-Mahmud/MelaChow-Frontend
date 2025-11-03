"use client";

import { useEffect } from "react";
import Image from "next/image";
import { RefreshCw } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("🔥 GrubDash Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 text-center px-6">
      {/* Logo / Illustration */}
      <div className="mb-6">
        <Image
          src="/logo.png" // 👈 replace with your actual GrubDash logo path
          alt="GrubDash Logo"
          width={80}
          height={80}
          className="rounded-full shadow-md"
        />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-extrabold text-orange-600 mb-3">
        Oops! Something went wrong
      </h1>

      {/* Message */}
      <p className="text-gray-600 max-w-md mb-6">
        {error?.message || "An unexpected issue occurred while fetching your meal. Please try again."}
      </p>

      {/* Retry Button */}
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-medium rounded-xl shadow hover:bg-orange-600 transition-transform hover:scale-105"
      >
        <RefreshCw size={18} />
        Try Again
      </button>

      {/* Optional Footer Tip */}
      <p className="mt-6 text-xs text-gray-400">
        If this keeps happening, please contact GrubDash support.
      </p>
    </div>
  );
}
