import test from "node:test";
import assert from "node:assert/strict";
import {
  ANALYTICS_EVENTS,
  extractCoarseDeliveryArea,
  resolveCanonicalUserId,
  sanitizeProperties,
  sanitizeUrlForAnalytics,
  toNumericAmount,
} from "../src/app/lib/analytics/events.js";
import {
  getFoodDiscoveryContext,
  getRestaurantDiscoveryContext,
  setFoodDiscoveryContext,
  setRestaurantDiscoveryContext,
} from "../src/app/lib/analytics/discoveryAttribution.js";

test("all analytics event names follow lowercase snake_case convention", () => {
  const snakeCase = /^[a-z][a-z0-9_]*$/;
  for (const [key, value] of Object.entries(ANALYTICS_EVENTS)) {
    assert.match(value, snakeCase, `Event ${key} (${value}) must be lowercase snake_case`);
  }
});

test("sanitizeProperties removes PII, credentials, and exact addresses while keeping numeric prices", () => {
  const result = sanitizeProperties({
    restaurant_id: "rest-1",
    item_price: toNumericAmount("2500.5"),
    email: "customer@melachow.com",
    phone: "+2348011112222",
    addressLine: "14 Allen Avenue, Ikeja",
    password: "secret",
    otp: "123456",
    cardNumber: "4242424242424242",
    cvv: "999",
    city: "Lagos",
    search_query: "jollof rice",
    rawEmailLeak: "someone@example.com",
  });

  assert.deepEqual(result, {
    restaurant_id: "rest-1",
    item_price: 2500.5,
    city: "Lagos",
    search_query: "jollof rice",
  });
});

test("sanitizeUrlForAnalytics strips sensitive auth query parameters", () => {
  const params = new URLSearchParams({
    email: "user@example.com",
    token: "abc123",
    passwordSetupToken: "setup-secret",
    restaurantId: "vendor-42",
    q: "suya",
  });

  const clean = sanitizeUrlForAnalytics("/search", params);
  assert.equal(clean, "/search?restaurantId=vendor-42&q=suya");
});

test("resolveCanonicalUserId returns stable user ID and refuses emails", () => {
  assert.equal(resolveCanonicalUserId({ _id: "65f0abc123", email: "user@example.com" }), "65f0abc123");
  assert.equal(resolveCanonicalUserId({ id: "uuid-999" }), "uuid-999");
  assert.equal(resolveCanonicalUserId({ id: "user@example.com" }), null);
  assert.equal(resolveCanonicalUserId(null), null);
});

test("extractCoarseDeliveryArea only exposes city and state", () => {
  const area = extractCoarseDeliveryArea({
    addressLine: "House 5 Banana Island",
    city: "Lagos",
    state: "Lagos",
    coordinates: { lat: 6.46, lng: 3.45 },
  });
  assert.deepEqual(area, { delivery_city: "Lagos", delivery_state: "Lagos" });
});

test("discoveryAttribution stores and retrieves restaurant and food attribution", () => {
  setRestaurantDiscoveryContext("vendor-77", {
    discovery_source: "search",
    position: 2,
    arrived_via_search: true,
    search_query: "amala",
  });
  const restCtx = getRestaurantDiscoveryContext("vendor-77");
  assert.equal(restCtx.discovery_source, "search");
  assert.equal(restCtx.position, 2);
  assert.equal(restCtx.arrived_via_search, true);

  setFoodDiscoveryContext("food-88", {
    discovery_source: "home_popular_nearby",
    position: 1,
    is_popular: true,
  });
  const foodCtx = getFoodDiscoveryContext("food-88");
  assert.equal(foodCtx.discovery_source, "home_popular_nearby");
  assert.equal(foodCtx.is_popular, true);
});
