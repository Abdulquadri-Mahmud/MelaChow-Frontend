"use client"; 

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic';
import OrderTrackingSkeleton from '@/app/components/skeleton/OrderTrackingSkeleton';

// Dynamically import ResetPassword with SSR disabled
const OrderTracking = dynamic(
  () => import("@/app/components/track/TrackOrder"));

export default function page() {
  return (
    <div className='bg-zinc-50 font-display text-[#181410]'>
      <Suspense fallback={<OrderTrackingSkeleton/>}>
        <OrderTracking/>
      </Suspense>
    </div>
  )
}
