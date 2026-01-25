"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import VendorDashboardHeader from "../VendorDashboardHeader";
import { useVendorStorage } from "@/app/hooks/vendorStorage";

export default function DashboardLayout({ children }) {
  const [active, setActive] = useState("My Foods");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { vendorDetails, isLoading } = useVendorStorage();
  const vendor = vendorDetails?.vendor;

  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.push("/vendors/auth/login");
    }
  }, [isLoading, vendor, router]);

  // Show loading state while fetching vendor data
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="flex h-screen">
      {/* Sidebar - fixed */}
      {vendor && <Sidebar
        active={active}
        setActive={setActive}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 bg-gray-50 dark:bg-zinc-950 min-h-screen overflow-hidden">
        {/* Sticky Header */}
        {vendor && <div className="sticky top-0 z-50">
          <VendorDashboardHeader
            vendor={vendor}
            onMenuClick={() => setMobileMenuOpen(true)}
          />
        </div>}

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto scroll md:p-4 p-2">
          {children}
          {/* <ScrollToTopButton/> */}
        </main>
      </div>
    </div>
  );
}
