import test from "node:test";
import assert from "node:assert/strict";
import { toMobileHref, paramsForRoute, toPublicHref, fromAppUrl } from "../mobile/routes.mjs";
import { validateApiOrigin, resolveApiUrl, isApiUrl } from "../mobile/api-url.mjs";
test("detail routes retain IDs, query parameters and fragments without build-time data", () => {
  assert.equal(toMobileHref("/combo-details/new-id?vendorId=v1#menu"), "/combo-details/?vendorId=v1&comboId=new-id#menu");
  assert.equal(toMobileHref("/get-help/tickets/t%20one"), "/get-help/tickets/?ticketId=t+one");
  assert.deepEqual(paramsForRoute("/track-orders/", new URLSearchParams("orderId=MC-123")), { orderId: "MC-123" });
  assert.equal(toPublicHref("/food-details/?foodId=abc"), "https://www.melachow.com/food-details/abc");
});
test("internal object links and public URLs resolve while external URLs stay external", () => {
  assert.equal(toMobileHref({ pathname: "/restaurants/a", query: { tab: "menu" } }), "/restaurants/?tab=menu&vendorId=a");
  assert.equal(toMobileHref("https://www.melachow.com/restaurants/a"), "/restaurants/?vendorId=a");
  assert.equal(toMobileHref("https://checkout.paystack.com/abc"), "https://checkout.paystack.com/abc");
  assert.equal(toMobileHref("//example.com/path"), "//example.com/path");
});
test("deep links accept only the customer website and our app scheme", () => {
  assert.equal(fromAppUrl("melachow://app/track-orders/123"), "/track-orders/?orderId=123");
  assert.equal(fromAppUrl("https://evil.example/verify-payment?reference=x"), null);
  assert.equal(fromAppUrl("javascript:alert(1)"), null);
});
test("mobile API configuration fails closed and credentials remain on the API origin", () => {
  assert.equal(validateApiOrigin("https://api.example.com/"), "https://api.example.com");
  for (const value of [undefined, "http://api.example.com", "https://localhost", "https://u:p@api.example.com", "https://api.example.com/api"]) {
    assert.throws(() => validateApiOrigin(value));
  }
  const origin = "https://api.example.com";
  assert.equal(resolveApiUrl("/api/user/auth/profile", origin), origin + "/api/user/auth/profile");
  assert.equal(resolveApiUrl("/v1/menu", origin), origin + "/v1/menu");
  assert.equal(resolveApiUrl("/_next/static/test.js", origin), "/_next/static/test.js");
  assert.equal(isApiUrl("https://api.cloudinary.com/v1_1/upload", origin), false);
  assert.equal(isApiUrl("https://evil.example/api/user", origin), false);
  assert.equal(isApiUrl(origin + "/api/user/auth/refresh", origin), true);
});
