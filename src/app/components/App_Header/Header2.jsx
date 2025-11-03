"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function Header2() {
  const pathname = usePathname();
  const router = useRouter();

  // Extract route name from pathname (e.g. /auth/signin → "Signin")
  const routeName = pathname
    ?.split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/-/g, " ") // Handle kebab-case routes
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Home";

  return (
    <header className="flex items-center gap-3 px-4 py-3 bg-white shadow-xs sticky top-0 z-50">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="p-2 rounded-full hover:bg-gray-100 transition"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700" />
      </button>

      {/* Current Page Title */}
      <h1 className="text-lg font-semibold text-gray-800 capitalize">
        {routeName}
      </h1>
    </header>
  );
}
