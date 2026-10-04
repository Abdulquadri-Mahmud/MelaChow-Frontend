"use client";

import SplashScreen from "@/app/components/SplashScreen";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const MINIMUM_SPLASH_MS = 800;

export default function RootPage() {
  const router = useRouter();
  const { user, hasCheckedSession, isLoading } = useUserStorage();
  const splashStartedAt = useRef(Date.now());

  useEffect(() => {
    router.prefetch("/home");
    router.prefetch("/auth/signin");
  }, [router]);

  useEffect(() => {
    // 1. Wait for session check to complete
    if (!hasCheckedSession || isLoading) return;

    const elapsed = Date.now() - splashStartedAt.current;
    const remainingDelay = Math.max(0, MINIMUM_SPLASH_MS - elapsed);

    const timer = setTimeout(() => {
      if (!user) {
        router.replace("/auth/signin");
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
