"use client";

import React from 'react'
import dynamic from 'next/dynamic';
import Header2 from '../components/App_Header/Header2';

const GetHelp = dynamic(() => import("../components/support_component/GetHelp"));

export default function page() {
  return (
    <div>
        <Header2 />
        <GetHelp/>
    </div>
  )
}
