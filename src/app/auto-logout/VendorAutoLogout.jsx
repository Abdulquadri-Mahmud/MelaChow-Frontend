"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode"; // ✅ fixed import

/**
 * AutoLogout Component
 * Automatically logs out user when JWT token expires.
 */
const VendorsAutoLogout = () => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("vendorToken");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        localStorage.removeItem("vendorToken");
        router.push("/vendors/auth/login");
      }
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem("vendorToken");
      router.push("/login");
    }
  }, [router]);

  return null;
};

export default VendorsAutoLogout;
