"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "../components/vendors_component/layout/DashboardLayout";
import { VendorProfileProvider } from "@/app/context/VendorProfileContext";
import VendorBootstrapper from "./components/VendorBootstrapper";
import { TokenManager } from "@/app/lib/auth-token";
import { registerServiceWorker } from "@/app/lib/pwa-utils";

export default function VendorLayout({ children }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Initialize token management
    TokenManager.initialize();

    // Register service worker for PWA functionality
    if (process.env.NODE_ENV === 'development') {
      console.log('[VendorLayout] TokenManager initialized');
    }
    registerServiceWorker();
  }, []);

  // ✅ Don't render until mounted to prevent hydration errors
  if (!isMounted) {
    return (
      <VendorProfileProvider>
        <div className="h-screen w-full bg-white dark:bg-zinc-900" />
      </VendorProfileProvider>
    );
  }

  // Don't apply DashboardLayout or Bootstrapper to auth routes
  const isAuthRoute = isMounted && pathname?.startsWith("/vendors/auth");

  return (
    <VendorProfileProvider>
      {isAuthRoute ? (
        children
      ) : (
        <VendorBootstrapper>
          <DashboardLayout>{children}</DashboardLayout>
        </VendorBootstrapper>
      )}
    </VendorProfileProvider>
  );
}
