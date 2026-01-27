"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useUserStorage } from "../hooks/useUserStorage";

/**
 * AutoLogout Component
 * Automatically logs out user when JWT token expires.
 */
const AutoLogout = () => {
  const router = useRouter();
  const {user, clearUser } = useUserStorage(); 
  // ⬆️ token must come from context

  useEffect(() => {
    if (!user?.token) return;

    let logoutTimer;

    try {
      const decoded = jwtDecode(user?.token);
      const currentTime = Date.now() / 1000;
      const timeLeft = decoded.exp - currentTime;

      // user.token already expired
      if (timeLeft <= 0) {
        clearUser();
        router.replace("/auth/signin");
        return;
      }

      // Schedule auto logout
      logoutTimer = setTimeout(() => {
        clearUser();
        router.replace("/auth/signin");
      }, timeLeft * 1000);
    } catch (error) {
      console.error("Invalid token:", error);
      clearUser();
      router.replace("/auth/signin");
    }

    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
    };
  }, [user?.token, router, clearUser]);

  return null;
};

export default AutoLogout;
