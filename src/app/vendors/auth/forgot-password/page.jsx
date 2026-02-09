"use client";

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic';

const VendorForgotPassword = dynamic(
    () => import("@/app/components/vendors_component/auth/ForgotPassword"));

export default function page() {
    return (
        <div className='bg-zinc-50 font-display text-[#181410]'>
            <Suspense fallback={''}>
                <VendorForgotPassword />
            </Suspense>
        </div>
    )
}
