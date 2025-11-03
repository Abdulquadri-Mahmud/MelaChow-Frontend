"use client"; 

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic';


// Dynamically import ResetPassword with SSR disabled
const VerifyAccount = dynamic(
  () => import("@/app/components/vendors_component/auth/VerifyAccount"));

export default function page() {
  return (
    <div className='bg-zinc-50 font-display text-[#181410]'>
      <Suspense fallback={<div>Loading verify account...</div>}>
        <VerifyAccount/>
      </Suspense>
    </div>
  )
}
