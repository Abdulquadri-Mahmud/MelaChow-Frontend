import { TokenManager } from "@/app/lib/auth-token";
import { resolveApiUrl, isApiUrl } from "./api-url.mjs";
let installed = false;
export function installTransport() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  // CapacitorHttp has already installed its native fetch/XHR bridge.
  const fetch = window.fetch.bind(window);
  const origin = process.env.NEXT_PUBLIC_MOBILE_API_URL;
  window.fetch = (input, init) => {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = resolveApiUrl(raw, origin);
    if (!isApiUrl(url, origin)) return fetch(input, init);
    const request = input instanceof Request ? new Request(url, input) : url;
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    const token = TokenManager.getToken("user");
    if (token && !headers.has("Authorization")) headers.set("Authorization", "Bearer " + token);
    return fetch(request, { ...init, headers, credentials: "include" });
  };
}
