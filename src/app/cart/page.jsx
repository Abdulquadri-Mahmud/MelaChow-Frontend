"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CartRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the cart tab on the orders page
    router.replace("/orders?activeTab=cart");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-orange-500" size={32} />
        <p className="text-gray-500 font-medium">Loading your cart...</p>
      </div>
    </div>
  );
}
