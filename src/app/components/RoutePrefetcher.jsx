"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const CUSTOMER_ROUTES = [
  "/home",
  "/search",
  "/cart",
  "/checkout",
  "/orders",
  "/profile",
  "/profile/address",
  "/notifications",
  "/all-restaurants",
  "/all-foods",
];

export default function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (connection?.saveData) {
      return undefined;
    }

    const prefetchRoutes = () => {
      CUSTOMER_ROUTES.forEach((route) => {
        try {
          router.prefetch(route);
        } catch {
          // Prefetch is a performance hint. Navigation should continue normally if it fails.
        }
      });
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(prefetchRoutes, { timeout: 2500 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const timer = window.setTimeout(prefetchRoutes, 1200);
    return () => window.clearTimeout(timer);
  }, [router]);

  return null;
}
