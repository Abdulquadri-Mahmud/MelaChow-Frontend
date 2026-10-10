"use client";

import SplashScreen from "@/app/components/SplashScreen";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const MINIMUM_SPLASH_MS = 500;

export default function RootPage() {
  const router = useRouter();
  const { user, hasCheckedSession, isLoading } = useUserStorage();
  const splashStartedAt = useRef(Date.now());

  useEffect(() => {
    // 1. Wait for session check to complete
    if (!hasCheckedSession || isLoading) return;

    const elapsed = Date.now() - splashStartedAt.current;
    const remainingDelay = Math.max(0, MINIMUM_SPLASH_MS - elapsed);

    const timer = setTimeout(() => {
      if (!user) {
        // The Capacitor app serves Next's static export from local assets. A
        // full document navigation avoids relying on an RSC route-data fetch
        // for the first screen after an expired session.
        window.location.replace("/auth/signin/");
        return;
      }

      // 3. Role-based Redirection
      const role = user.role?.toLowerCase();

      if (role === "admin" || role === "superadmin") {
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
        if (adminUrl) {
          window.location.href = `${adminUrl.replace(/\/$/, "")}/admin/dashboard`;
        } else {
          router.replace("/home");
        }
      } else if (role === "vendor") {
        window.location.href = "https://vendor.melachow.com/vendors/dashboard";
      } else if (role === "rider") {
        window.location.href = "https://rider.melachow.com/rider/dashboard";
      } else {
        // Default to customer home
        router.replace("/home");
      }
    }, remainingDelay);

    return () => clearTimeout(timer);
  }, [user, hasCheckedSession, isLoading, router]);

  return <SplashScreen user={user} />;
}
