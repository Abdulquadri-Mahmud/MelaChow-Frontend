"use client";

import React, { Suspense } from "react";
import VerifyPayment from "@/app/components/VerifyPayment";

export default function VerifyPaymentPage() {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 font-display text-[#181410] dark:text-zinc-100">
      <Suspense fallback={null}>
        <VerifyPayment />
      </Suspense>
    </div>
  );
}
