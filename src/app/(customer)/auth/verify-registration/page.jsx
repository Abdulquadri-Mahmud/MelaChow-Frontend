"use client";

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic';

const VerifyRegistration = dynamic(
    () => import("@/app/components/users/auth/VerifyRegistration"));

export default function page() {
    return (
        <div className='bg-zinc-50 font-display text-[#181410]'>
            <Suspense fallback={''}>
                <VerifyRegistration />
            </Suspense>
        </div>
    )
}
