"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "../components/vendors_component/layout/DashboardLayout";
import { VendorProfileProvider } from "@/app/context/VendorProfileContext";
import VendorBootstrapper from "./components/VendorBootstrapper";
import { TokenManager } from "@/app/lib/auth-token";
import { registerServiceWorker } from "@/app/lib/pwa-utils";
import PWAUpdateManager from "@/app/components/PWA/PWAUpdateManager";
import PWAInstallPrompt from "@/app/components/PWA/PWAInstallPrompt";
import PushNotificationPrompt from "@/app/components/notifications/PushNotificationPrompt";
import RealtimeNotificationListener from "@/app/components/notifications/RealtimeNotificationListener";
import VendorSocketManager from "./components/VendorSocketManager";

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
        <div className="h-screen w-full bg-white dark:bg-slate-900" />
      </VendorProfileProvider>
    );
  }

  // Don't apply DashboardLayout or Bootstrapper to auth or pending status routes
  const isExcludedRoute = isMounted && (pathname?.startsWith("/vendors/auth") || pathname === "/vendors/pending-approval");

  return (
    <VendorProfileProvider>
      {isExcludedRoute ? (
        <>
          {children}
          <RealtimeNotificationListener />
          <VendorSocketManager />
        </>
      ) : (
        <VendorBootstrapper>
          <DashboardLayout>{children}</DashboardLayout>
          <PWAUpdateManager />
          <PWAInstallPrompt />
          <PushNotificationPrompt />
          <RealtimeNotificationListener />
          <VendorSocketManager />
        </VendorBootstrapper>
      )}
    </VendorProfileProvider>
  );
}
