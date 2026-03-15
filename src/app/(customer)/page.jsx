"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStorage } from "@/app/hooks/useUserStorage";

export default function Home() {
  const router = useRouter();
  const { user, hasCheckedSession } = useUserStorage(); // ✅ Use hasCheckedSession

  useEffect(() => {
    // ✅ Wait for session check to complete
    if (!hasCheckedSession) return;

    // ✅ Redirect to home after session is verified
    // AppBootstrapper will show splash screen
    router.push("/home");
  }, [hasCheckedSession, router]);

  // ✅ Show nothing while redirecting (AppBootstrapper handles splash)
  return null;
}
