"use client";

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic';

const VendorSetPassword = dynamic(
    () => import("@/app/components/vendors_component/auth/SetPassword"));

export default function page() {
    return (
        <div className='bg-zinc-50 font-display text-[#181410]'>
            <Suspense fallback={''}>
                <VendorSetPassword />
            </Suspense>
        </div>
    )
}
