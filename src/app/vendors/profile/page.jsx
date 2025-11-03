"use client";

import VendorProfileSkeleton from "@/app/components/skeletons/VendorProfileSkeleton";
import VendorProfilePage from "@/app/components/vendors_component/profile/profile";
import { useVendorById } from "@/app/hooks/useVendorQueries";
import { getVendorId } from "@/app/utils/vendor/api/vendorId";
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
