"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import DashboardLayout from "../components/vendors_component/layout/DashboardLayout";
import { VendorProfileProvider } from "@/app/context/VendorProfileContext";
import VendorBootstrapper from "./components/VendorBootstrapper";
import { TokenManager } from "@/app/lib/auth-token";
import { registerServiceWorker } from "@/app/lib/pwa-utils";

export default function VendorLayout({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize token management
    TokenManager.initialize();

    // Register service worker for PWA functionality
    registerServiceWorker();
  }, []);

  // Don't apply DashboardLayout to auth routes
  const isAuthRoute = pathname?.startsWith("/vendors/auth");

  return (
    <VendorProfileProvider>
      <VendorBootstrapper>
        {isAuthRoute ? (
          children
        ) : (
          <DashboardLayout>{children}</DashboardLayout>
        )}
      </VendorBootstrapper>
    </VendorProfileProvider>
  );
}
