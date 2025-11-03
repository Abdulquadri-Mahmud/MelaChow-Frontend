"use client";

import dynamic from "next/dynamic";

// Dynamically import ResetPassword 
const Signin = dynamic(
  () => import("@/app/components/users/auth/Signin"));

export default function SigninPage() {
  return (
    <div className="bg-zinc-50 font-display text-[#181410]">
      {/* <Header2 /> */}
      <Signin/>;
    </div>
  ) 
}
