"use client";

import { usePathname } from "next/navigation";
import DashboardLayout from "../components/vendors_component/layout/DashboardLayout";

export default function VendorLayout({ children }) {
  const pathname = usePathname();

  // Don't apply DashboardLayout to auth routes
  const isAuthRoute = pathname?.startsWith("/vendors/auth");

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
