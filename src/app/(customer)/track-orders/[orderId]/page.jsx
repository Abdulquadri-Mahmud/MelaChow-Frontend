"use client"; 

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic';
import OrderTrackingSkeleton from '@/app/components/skeleton/OrderTrackingSkeleton';

// Dynamically import ResetPassword with SSR disabled
const OrderTracking = dynamic(
  () => import("@/app/components/track/TrackOrder"));

export default function page() {
  return (
    <div className='bg-zinc-50 dark:bg-zinc-950 font-display text-[#181410] dark:text-zinc-100 transition-colors duration-300'>
      <Suspense fallback={<OrderTrackingSkeleton/>}>
        <OrderTracking/>
      </Suspense>
    </div>
  )
}
