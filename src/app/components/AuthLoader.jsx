"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUser } from "../lib/api";
import SplashScreen from "./SplashScreen/SplashScreen";

export default function AuthLoader() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("userToken");
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const data = await fetchUser(token);
        if (data) {
          setIsAuthenticated(true);
          router.push("/home"); // ✅ Navigate to home
        }
      } catch (err) {
        console.error("❌ Auth verification failed:", err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [router]);

  if (loading) return <SplashScreen />;

  return (
    isAuthenticated ? null : <div>Please sign in.</div>
  );
}
