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
    "/vendors/auth/verify-account",
    "/vendors/dashboard",
    "/vendors/profile",
    "/vendors/my-foods",
    "/vendors/create-food",
    "/vendors/transactions",
    "/vendors/order",
    "/vendors/reviews",
    "/admin/login",
    "/admin/dashboard",
    "/admin/categories",
    "/admin/locations",
    "/admin/settings",
  ];

  // ✅ Hide nav also on dynamic routes
  const shouldHideNav =
    noNavRoutes.includes(pathname) ||
    pathname.startsWith("/vendors/update-food/") ||
    pathname.startsWith("/vendors/orders/") ||
    pathname.startsWith("/vendors/order/") ||
    pathname.startsWith("/vendors/food-details/");

  const showNav = !shouldHideNav;

  return showNav ? <BottomBar /> : null;
}
