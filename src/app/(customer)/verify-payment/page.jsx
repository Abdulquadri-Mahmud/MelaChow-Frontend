"use client";

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic';

// Dynamically import ResetPassword with SSR disabled
const OrderSuccessPage = dynamic(
  () => import("@/app/components/VerifyPayment"));


export default function page() {
  return (
    <div className='bg-zinc-50 font-display text-[#181410]'>
      <Suspense fallback={''}>
        <OrderSuccessPage />
      </Suspense>
    </div>
  )
}
