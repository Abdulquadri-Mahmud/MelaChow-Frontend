export const detailRoutes = [
  { path: "/food-details", parameter: "foodId", client: "FoodDetailsClient" },
  { path: "/combo-details", parameter: "comboId", client: "ComboDetailsClient" },
  { path: "/restaurants", parameter: "vendorId", client: "RestaurantClient" },
  { path: "/track-orders", parameter: "orderId" },
  { path: "/get-help/tickets", parameter: "ticketId" },
];
const website = "https://www.melachow.com";
export function toMobileHref(href) {
  if (typeof href !== "string") {
    const { pathname = "/", query = {}, hash = "" } = href;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      for (const item of Array.isArray(value) ? value : [value]) {
        if (item != null) params.append(key, String(item));
      }
    }
    return toMobileHref(pathname + (params.size ? "?" + params : "") + hash);
  }
  // Only map local links or links to the customer website.
  if (!href.startsWith("/") && !/^https:\/\/(www\.)?melachow\.com(?:\/|$)/i.test(href)) return href;
  if (href.startsWith("//")) return href;
  const url = new URL(href, website);
  for (const route of detailRoutes) {
    const match = url.pathname.match(new RegExp("^" + route.path + "/([^/]+)/?$"));
    if (match) {
      url.pathname = route.path + "/";
      url.searchParams.set(route.parameter, decodeURIComponent(match[1]));
      break;
    }
  }
  return url.pathname + url.search + url.hash;
}
export function paramsForRoute(pathname, searchParams) {
  const route = detailRoutes.find(({ path }) => pathname.replace(/\/$/, "") === path);
  return route ? { [route.parameter]: searchParams.get(route.parameter) || undefined } : {};
}
export function toPublicHref(href) {
  const url = new URL(toMobileHref(href), website);
  const route = detailRoutes.find(({ path }) => url.pathname.replace(/\/$/, "") === path);
  if (route && url.searchParams.has(route.parameter)) {
    const id = url.searchParams.get(route.parameter);
    url.searchParams.delete(route.parameter);
    url.pathname = route.path + "/" + encodeURIComponent(id);
  }
  return url.toString();
}
export function fromAppUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === "melachow:" && url.hostname === "app") {
      return toMobileHref(url.pathname + url.search + url.hash);
    }
    if (url.protocol === "https:" && ["melachow.com", "www.melachow.com"].includes(url.hostname)) {
      return toMobileHref(url.pathname + url.search + url.hash);
    }
  } catch {}
  return null;
}
