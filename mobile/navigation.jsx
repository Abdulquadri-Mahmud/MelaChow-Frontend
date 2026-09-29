"use client";
import { useMemo } from "react";
import { useRouter as useNextRouter, usePathname as useNextPathname, useSearchParams } from "next/navigation";
import { toMobileHref, toPublicHref, paramsForRoute } from "./routes.mjs";
export * from "next/navigation";
export function useRouter() {
  const router = useNextRouter();
  return useMemo(() => {
    const navigate = (method, href, options) => {
      const mapped = toMobileHref(href);
      if (mapped.startsWith("/") && !mapped.startsWith("//")) return router[method](mapped, options);
      if (method !== "prefetch") window.__melachowNavigate?.(mapped);
    };
    return {
      ...router,
      push: (href, options) => navigate("push", href, options),
      replace: (href, options) => navigate("replace", href, options),
      prefetch: (href, options) => navigate("prefetch", href, options),
    };
  }, [router]);
}
export function useParams() {
  return paramsForRoute(useNextPathname(), useSearchParams());
}
export function usePathname() {
  const pathname = useNextPathname();
  const search = useSearchParams();
  // Preserve the website's pathname contract for auth guards and navigation highlighting.
  return new URL(toPublicHref(pathname + "?" + search)).pathname.replace(/\/$/, "") || "/";
}
