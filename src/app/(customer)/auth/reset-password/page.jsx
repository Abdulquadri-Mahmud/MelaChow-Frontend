"use client"; 

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamically import ResetPassword
const ResetPassword = dynamic(
  () => import("@/app/components/users/auth/ResetPassword"));

export default function ResetPasswordPage() {
  return (
    <div className="bg-zinc-50 font-display text-[#181410]">
      {/* <Header2 /> */}
      <Suspense fallback={<div>Loading reset password...</div>}>
        <ResetPassword />
      </Suspense>
    </div>
  );
}

