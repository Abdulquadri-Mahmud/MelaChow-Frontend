"use client";

import SplashScreen from "@/app/components/SplashScreen";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const MINIMUM_SPLASH_MS = process.env.NEXT_PUBLIC_MOBILE_BUILD === "true" ? 0 : 300;
const LOGOUT_SPLASH_MS = 1200;

export default function RootPage() {
  const router = useRouter();
  const { user, hasCheckedSession, hasCachedSession, isLoading, isFetching, error, refetchProfile } = useUserStorage();
  const splashStartedAt = useRef(Date.now());

  useEffect(() => {
    const elapsed = Date.now() - splashStartedAt.current;
    const remainingDelay = Math.max(0, MINIMUM_SPLASH_MS - elapsed);
    if (sessionStorage.getItem("melachow_logout_transition") === "1") {
      const logoutDelay = Math.max(0, LOGOUT_SPLASH_MS - elapsed);
      const timer = setTimeout(() => {
        sessionStorage.removeItem("melachow_logout_transition");
        window.location.replace("/auth/signin/");
      }, logoutDelay);
      return () => clearTimeout(timer);
    }

    // 1. Returning users with a saved token + cached profile navigate immediately
    // while ProfileContext revalidates (and redirects on 401) in the background.
    const canFastBoot = hasCachedSession && Boolean(user);
    if (!canFastBoot && (!hasCheckedSession || isLoading || isFetching || error)) return;

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
  }, [user, hasCheckedSession, hasCachedSession, isLoading, isFetching, error, router]);

  return <SplashScreen startupError={hasCheckedSession && !isFetching && Boolean(error)} onRetry={() => refetchProfile()} />;
}
