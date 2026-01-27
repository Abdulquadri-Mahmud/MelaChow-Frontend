"use client";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import VendorDashboardHeader from "../VendorDashboardHeader";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import { getVendorDetails } from "@/app/lib/vendorApi";

export default function DashboardLayout({ children }) {
  const [active, setActive] = useState("My Foods");
  const [vendorData, setVendorData] = useState(null);

  const { vendorDetails } = useVendorStorage();
  const vendor = vendorDetails?.vendor;

  useEffect(() => {
    const fetchVendorData = async () => {
      if (vendor?.id) {
        try {
          const res = await getVendorDetails(vendor.id);
          setVendorData(res.data || res);
        } catch (error) {
          console.error("Failed to fetch vendor details for header:", error);
        }
      }
    };

    fetchVendorData();
  }, [vendor]);

  // console.log("Vendor in DashboardLayout:", vendor);

  return (
    <div className="flex h-screen">
      {/* Sidebar - fixed */}
      {
        vendor && <Sidebar active={active} setActive={setActive} />
      }

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 bg-gray-50 dark:bg-zinc-950 min-h-screen overflow-hidden">
        {/* Sticky Header */}
        {
          vendor && <div className="sticky top-0 z-50">
            <VendorDashboardHeader vendor={vendorData || vendor} />
          </div>
        }

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto scroll md:p-4 p-2">
          {children}
          {/* <ScrollToTopButton/> */}
        </main>
      </div>
    </div>
  );
}
