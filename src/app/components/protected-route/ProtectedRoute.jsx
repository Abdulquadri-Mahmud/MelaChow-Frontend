"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStorage } from "@/app/hooks/useUserStorage";

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const { user, isLoading } = useUserStorage();

  useEffect(() => {
    // wait for hydration
    if (isLoading) return;

    if (!user?.token) {
      router.replace("/auth/signin");
    }
  }, [user, isLoading, router]);

  // While checking auth
  if (isLoading || !user?.token) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-gray-500">Checking authentication…</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
