"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function NavigationFeedback() {
  const pathname = usePathname();
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const settle = window.setTimeout(() => setNavigating(false), 0);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    return () => window.clearTimeout(settle);
  }, [pathname]);

  useEffect(() => {
    const start = (event) => {
      const anchor = event.target.closest?.("a[href]");
      if (!anchor || event.defaultPrevented || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === pathname) return;
      setNavigating(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setNavigating(false), 12000);
    };
    const prefetch = (event) => {
      const anchor = event.target.closest?.("a[href]");
      if (!anchor) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin === window.location.origin) router.prefetch(`${url.pathname}${url.search}`);
    };
    document.addEventListener("click", start, true);
    document.addEventListener("pointerover", prefetch, true);
    return () => {
      document.removeEventListener("click", start, true);
      document.removeEventListener("pointerover", prefetch, true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [pathname, router]);

  if (!navigating) return null;
  return <div aria-live="polite" aria-label="Opening page" className="fixed left-0 right-0 top-0 z-[10000] h-1 overflow-hidden bg-orange-100/80"><div className="h-full w-2/5 animate-[pulse_0.9s_ease-in-out_infinite] rounded-r-full bg-orange-500 shadow-[0_0_14px_rgba(249,115,22,.9)]" /></div>;
}