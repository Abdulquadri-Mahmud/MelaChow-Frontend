"use client";


import VendorProfilePage from "@/app/components/vendors_component/profile/profile";
import { useVendorById } from "@/app/hooks/useVendorQueries";
import { getVendorId } from "@/app/lib/vendorId";
import VendorProfileSkeleton from "@/app/skeleton/VendorProfileSkeleton";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { vendor, isLoading } = useVendorById(getVendorId());
  const [localVendor, setLocalVendor] = useState(null);

  useEffect(() => {
    if (vendor) setLocalVendor(vendor); // only set when vendor is loaded
  }, [vendor]);
  
  // console.log(localVendor)
  if (isLoading || !localVendor) {
    return <VendorProfileSkeleton/>;
  }

  return (
    <div>
      <VendorProfilePage vendor={localVendor} />
    </div>
  );
}
