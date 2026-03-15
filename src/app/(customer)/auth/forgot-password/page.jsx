"use client";

import dynamic from "next/dynamic";
// Dynamically import ResetPassword 
const ForgotPassword = dynamic(
  () => import("@/app/components/users/auth/ForgotPassword"));

export default function page() {
  return (
    <div className="bg-zinc-50 font-display text-[#181410]">
        {/* <Header2 /> */}
        <ForgotPassword />
    </div>
  )
}
