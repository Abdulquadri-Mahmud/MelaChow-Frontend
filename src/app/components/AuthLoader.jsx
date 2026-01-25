"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStorage } from "../hooks/useUserStorage";
import SplashScreen from "./SplashScreen";

export default function AuthLoader() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, isLoading } = useUserStorage();

  useEffect(() => {
    // Wait for user data to load
    if (isLoading) return;

    const timer = setTimeout(() => {
      // If user is authenticated, go to home
      // If not authenticated (guest), also go to home (they can browse as guest)
      router.push("/home");
      setLoading(false);
    }, 2000); // Short delay for splash screen

    return () => clearTimeout(timer);
  }, [isLoading, user, router]);

  if (loading || isLoading) return <SplashScreen />;

  return null;
}
