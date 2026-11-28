/**
 * Lightweight session-scoped discovery attribution store.
 *
 * Captures where a customer discovered a restaurant or food item (home_top_rated,
 * home_nearby, all_restaurants, search, category, recommendation, promo_banner,
 * restaurant_menu, direct) so downstream restaurant_viewed, food_item_viewed,
 * and add-to-cart events carry accurate attribution without brittle URL params.
 */

const STORAGE_KEY = "melachow_analytics_discovery_v1";
const TTL_MS = 30 * 60 * 1000; // 30 minutes

const memoryStore = {
  restaurants: {},
  foods: {},
};

function readStore() {
  if (typeof window === "undefined") return memoryStore;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return memoryStore;
    const parsed = JSON.parse(raw);
    return {
      restaurants: parsed?.restaurants && typeof parsed.restaurants === "object" ? parsed.restaurants : {},
      foods: parsed?.foods && typeof parsed.foods === "object" ? parsed.foods : {},
    };
  } catch {
    return memoryStore;
  }
}

function writeStore(next) {
  memoryStore.restaurants = next.restaurants;
  memoryStore.foods = next.foods;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Non-fatal in private browsing / quota limits
  }
}

function pruneEntries(map) {
  const now = Date.now();
  const entries = Object.entries(map || {}).filter(([, v]) => v && now - (v.ts || 0) < TTL_MS);
  // Cap at 40 entries to keep sessionStorage tiny
  return Object.fromEntries(entries.slice(-40));
}

export function setRestaurantDiscoveryContext(restaurantId, context = {}) {
  if (!restaurantId) return;
  const id = String(restaurantId);
  const store = readStore();
  store.restaurants = pruneEntries(store.restaurants);
  store.restaurants[id] = {
    discovery_source: context.discovery_source || "direct",
    position: typeof context.position === "number" ? context.position : undefined,
    is_featured: Boolean(context.is_featured),
    is_recommended: Boolean(context.is_recommended),
    arrived_via_search: Boolean(context.arrived_via_search),
    arrived_via_category: Boolean(context.arrived_via_category),
    arrived_via_promo: Boolean(context.arrived_via_promo),
    category_name: context.category_name || undefined,
    search_query: context.search_query || undefined,
    ts: Date.now(),
  };
  writeStore(store);
}

export function getRestaurantDiscoveryContext(restaurantId) {
  if (!restaurantId) return null;
  const store = readStore();
  const entry = store.restaurants[String(restaurantId)];
  if (!entry || Date.now() - (entry.ts || 0) >= TTL_MS) return null;
  const { ts, ...rest } = entry;
  return rest;
}

export function setFoodDiscoveryContext(foodId, context = {}) {
  if (!foodId) return;
  const id = String(foodId);
  const store = readStore();
  store.foods = pruneEntries(store.foods);
  store.foods[id] = {
    discovery_source: context.discovery_source || "direct",
    position: typeof context.position === "number" ? context.position : undefined,
    is_recommended: Boolean(context.is_recommended),
    is_featured: Boolean(context.is_featured),
    is_popular: Boolean(context.is_popular),
    category_name: context.category_name || undefined,
    search_query: context.search_query || undefined,
    ts: Date.now(),
  };
  writeStore(store);
}

export function getFoodDiscoveryContext(foodId) {
  if (!foodId) return null;
  const store = readStore();
  const entry = store.foods[String(foodId)];
  if (!entry || Date.now() - (entry.ts || 0) >= TTL_MS) return null;
  const { ts, ...rest } = entry;
  return rest;
}
