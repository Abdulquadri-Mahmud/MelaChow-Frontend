"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "../BottomNav";

const subscribe = () => () => {};
const HIDE_ON_ROUTES = [
  "/auth/signin", "/auth/login", "/auth/signup", "/auth/register",
  "/auth/verify-account", "/auth/verify-registration", "/auth/set-password",
  "/auth/forgot-password", "/auth/reset-password", "/vendors/auth",
  "/admin/auth", "/combo-details", "/food-details", "/orders",
];

const isEditable = (element) =>
  element instanceof HTMLElement &&
  (["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName) || element.isContentEditable);

export default function ConditionalBottomNav() {
  const pathname = usePathname();
  const isMounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;

    let maximumViewportHeight = window.visualViewport?.height || window.innerHeight;
    let blurTimer;
    const updateFromViewport = () => {
      const height = window.visualViewport?.height || window.innerHeight;
      maximumViewportHeight = Math.max(maximumViewportHeight, height);
      setIsKeyboardOpen(maximumViewportHeight - height > 120 || isEditable(document.activeElement));
    };
    const handleFocusIn = (event) => {
      if (isEditable(event.target)) setIsKeyboardOpen(true);
    };
    const handleFocusOut = () => {
      clearTimeout(blurTimer);
      blurTimer = window.setTimeout(updateFromViewport, 120);
    };
    const handleOrientationChange = () => {
      maximumViewportHeight = window.visualViewport?.height || window.innerHeight;
      setIsKeyboardOpen(false);
    };

    window.visualViewport?.addEventListener("resize", updateFromViewport);
    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);
    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      clearTimeout(blurTimer);
      window.visualViewport?.removeEventListener("resize", updateFromViewport);
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, [isMounted]);

  if (!isMounted) return null;
  const shouldHide = pathname === "/" || HIDE_ON_ROUTES.some((route) => pathname?.startsWith(route));
  if (shouldHide || isKeyboardOpen) return null;
  return <BottomNav />;
}