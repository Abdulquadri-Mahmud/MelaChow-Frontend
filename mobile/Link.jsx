"use client";
import Link from "next/link";
import { forwardRef } from "react";
import { toMobileHref } from "./routes.mjs";
export default forwardRef(function MobileLink({ href, ...props }, ref) {
  return <Link ref={ref} {...props} href={toMobileHref(href)} />;
});
