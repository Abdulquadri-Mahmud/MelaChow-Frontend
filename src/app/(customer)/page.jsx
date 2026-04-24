"use client";

import SplashScreen from "@/app/components/SplashScreen";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RootPage() {
  const router = useRouter();
  const { user, hasCheckedSession, isLoading } = useUserStorage();

  useEffect(() => {
    // 1. Wait for session check to complete
    if (!hasCheckedSession || isLoading) return;

    // 2. Short delay to ensure splash screen is seen (Premium feel)
    const timer = setTimeout(() => {
      if (!user) {
        // Unauthenticated -> Go to Login
        router.push("/auth/signin");
        return;
      }

      // 3. Role-based Redirection
      const role = user.role?.toLowerCase();

      if (role === "admin" || role === "superadmin") {
        router.push("/admin/dashboard");
      } else if (role === "vendor") {
        router.push("/vendors/dashboard");
      } else if (role === "rider") {
        router.push("/rider/dashboard");
      } else {
        // Default to customer home
        router.push("/home");
      }
    }, 2800); 

    return () => clearTimeout(timer);
  }, [user, hasCheckedSession, isLoading, router]);

  return <SplashScreen user={user} />;
}
