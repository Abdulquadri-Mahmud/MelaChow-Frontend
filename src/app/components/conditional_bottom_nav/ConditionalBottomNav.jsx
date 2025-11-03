"use client";

import { usePathname } from "next/navigation";
import BottomBar from "../BottomNav";

export default function ConditionalBottomNav() {
  const pathname = usePathname();

  // Routes where BottomNav should NOT show
  const noNavRoutes = [
    "/",
    "/auth/signin",
    "/auth/verify-account",
    "/auth/signup",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/vendors/auth/register",
    "/vendors/auth/login",
    "/vendors/dashboard",
    "/vendors/profile",
    "/vendors/my-foods",
    "/vendors/create-food",
  ];

  // ✅ Hide nav also on dynamic edit routes like /vendors/update-food/[id]
  const shouldHideNav =
    noNavRoutes.includes(pathname) ||
    pathname.startsWith("/vendors/update-food/");

  const showNav = !shouldHideNav;

  return showNav ? <BottomBar /> : null;
}
