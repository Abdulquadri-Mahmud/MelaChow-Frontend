export function validateApiOrigin(value) {
  if (!value) throw new Error("Set NEXT_PUBLIC_MOBILE_API_URL to the HTTPS API origin before building.");
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password ||
      url.search || url.hash || url.pathname !== "/") {
    throw new Error("NEXT_PUBLIC_MOBILE_API_URL must be an HTTPS origin without credentials, paths, query, or fragment.");
  }
  if (["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname)) {
    throw new Error("Use an API reachable from the phone, not localhost.");
  }
  return url.origin;
}
export function resolveApiUrl(value, origin) {
  if (typeof value !== "string") return value;
  return /^\/(api|v1)(\/|\?|$)/.test(value) ? origin + value : value;
}
export function isApiUrl(value, origin) {
  try {
    const url = new URL(value, origin);
    return url.origin === origin && /^\/(api|v1)(\/|$)/.test(url.pathname);
  } catch { return false; }
}
