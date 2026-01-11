"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUser } from "../lib/api";
import SplashScreen from "./SplashScreen";

export default function AuthLoader() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyUser = async () => {
      const startTime = Date.now();
      const token = localStorage.getItem("userToken");

      // 🚨 No token = not logged in
      if (!token) {
        // Ensure even if no token, we wait for the onboarding feel
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 5000 - elapsed);
        setTimeout(() => {
          router.push("/auth/signin");
          setLoading(false);
        }, remaining);
        return;
      }

      try {
        const data = await fetchUser(token);
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 5000 - elapsed);

        setTimeout(() => {
          if (data) router.push("/home");
          else router.push("/auth/signin");
          setLoading(false);
        }, remaining);
      } catch (err) {
        console.error("❌ Auth verification failed:", err);
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 5000 - elapsed);
        setTimeout(() => {
          router.push("/auth/signin");
          setLoading(false);
        }, remaining);
      }
    };

    verifyUser();
  }, [router]);

  if (loading) return <SplashScreen />;

  return null; // You can also render children if you want this as a layout wrapper
}
