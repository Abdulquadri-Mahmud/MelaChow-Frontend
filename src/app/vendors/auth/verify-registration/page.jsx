"use client";

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic';

const VendorVerifyRegistration = dynamic(
    () => import("@/app/components/vendors_component/auth/VerifyRegistration"));

export default function page() {
    return (
        <div className='bg-zinc-50 font-display text-[#181410]'>
            <Suspense fallback={''}>
                <VendorVerifyRegistration />
            </Suspense>
        </div>
    )
}
