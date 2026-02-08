"use client";

import React from "react";
import { usePathname } from "next/navigation";
import BottomNav from "../BottomNav";

export default function ConditionalBottomNav() {
  const pathname = usePathname();

  // Hide on auth pages
  const hideOnRoutes = [
    "/auth/signin",
    "/auth/signup",
    "/auth/verify-account",
    "/auth/forgot-password",
    "/auth/reset-password",
  ];

  const shouldHide = hideOnRoutes.some(route => pathname?.startsWith(route));

  if (shouldHide) return null;

  return <BottomNav />;
}
