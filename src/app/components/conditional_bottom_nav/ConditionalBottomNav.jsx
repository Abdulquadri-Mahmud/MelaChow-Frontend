"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "../BottomNav";

export default function ConditionalBottomNav() {
  const pathname = usePathname();
  const [shouldShow, setShouldShow] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Routes where bottom nav should NEVER appear
  const hideOnRoutes = [
    "/auth/signin",
    "/auth/login",
    "/auth/signup",
    "/auth/register",
    "/auth/verify-account",
    "/auth/verify-registration",
    "/auth/set-password",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/vendors/auth",
    "/admin/auth",
    "/search",
  ];

  // ✅ First, set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ Then, check visibility based on pathname
  useEffect(() => {
    if (!isMounted) return;

    // Check if current route is in hide list
    const shouldHide = hideOnRoutes.some(route => pathname?.startsWith(route));

    // ✅ IMPORTANT: Show bottom nav on "/" root route for logged-in users
    // Only hide on auth routes
    setShouldShow(!shouldHide);

    if (process.env.NODE_ENV === 'development') {
      console.log('[ConditionalBottomNav] Visibility check:', {
        pathname,
        shouldHide,
        shouldShow: !shouldHide
      });
    }
  }, [pathname, isMounted]);

  // ✅ Don't render anything until mounted (prevents hydration mismatch)
  if (!isMounted) return null;

  // ✅ Don't render if should be hidden
  if (!shouldShow) return null;

  return <BottomNav />;
}
