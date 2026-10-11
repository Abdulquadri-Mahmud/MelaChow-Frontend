"use client";

import dynamic from "next/dynamic";

// Keep the sign-in screen client rendered for the customer app.
const Signin = dynamic(
  () => import("@/app/components/users/auth/Signin"));

export default function SigninPage() {
  return (
    <div className="bg-zinc-50 font-display text-[#181410]">
      <Signin />
    </div>
  ) 
}
