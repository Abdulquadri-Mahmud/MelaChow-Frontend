"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUser } from "../lib/api";
import SplashScreen from "./SplashScreen/SplashScreen";

export default function AuthLoader() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("userToken");

      // 🚨 No token = not logged in
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const data = await fetchUser(token);

        if (data) {
          // ✅ Valid token → proceed to home/dashboard
          router.push("/home");
        } else {
          // 🚫 Invalid token → redirect to login
          router.push("/auth/signin");
        }
      } catch (err) {
        console.error("❌ Auth verification failed:", err);
        router.push("/auth/signin");
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [router]);

  if (loading) return <SplashScreen />;

  return null; // You can also render children if you want this as a layout wrapper
}
