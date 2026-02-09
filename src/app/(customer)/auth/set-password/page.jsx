"use client";

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic';

const SetPassword = dynamic(
    () => import("@/app/components/users/auth/SetPassword"));

export default function page() {
    return (
        <div className='bg-zinc-50 font-display text-[#181410]'>
            <Suspense fallback={''}>
                <SetPassword />
            </Suspense>
        </div>
    )
}
