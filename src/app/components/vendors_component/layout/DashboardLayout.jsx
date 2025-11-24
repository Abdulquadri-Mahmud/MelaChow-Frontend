"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useVendorStorage } from "@/app/hooks/vendorStorage";

export default function DashboardLayout({ children }) {
  const [active, setActive] = useState("My Foods");

  const { vendorDetails } = useVendorStorage();
  const vendor = vendorDetails?.vendor; 

  console.log("Vendor in DashboardLayout:", vendor);

  return (
    <div className="flex h-screen">
      {/* Sidebar - fixed */}
      {
        vendor && <Sidebar active={active} setActive={setActive} />
      }
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 bg-gray-50 min-h-screen overflow-hidden">
        {/* Sticky Header */}
        {
          vendor && <div className="sticky top-0 z-50 bg-white ">
            <Header vendorName="Vendor Joe" />
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
