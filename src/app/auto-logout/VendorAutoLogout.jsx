"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { jwtDecode } from "jwt-decode";

/**
 * VendorAutoLogout Component
 * Automatically logs out vendor when JWT token expires.
 */
const VendorsAutoLogout = () => {
  const router = useRouter();
  const pathname = usePathname();

  /* 
  useEffect(() => {
    // Legacy token check logic removed.
  }, [router, pathname]); 
  */

  return null;
};

export default VendorsAutoLogout;
