"use client";

import React from 'react'
import dynamic from 'next/dynamic';
import Header2 from '@/app/components/App_Header/Header2';

const GetHelp = dynamic(() => import("@/app/components/support_component/GetHelp"));

export default function page() {
  return (
    <div>
      <GetHelp />
    </div>
  )
}
