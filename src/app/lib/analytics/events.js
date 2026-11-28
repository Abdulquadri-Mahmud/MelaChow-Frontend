/**
 * Centralized MelaChow Customer Product Analytics Event Taxonomy & Sanitizer
 *
 * Naming convention: lowercase snake_case.
 * All customer-facing frontend events MUST be referenced through ANALYTICS_EVENTS.
 */

export const ANALYTICS_EVENTS = Object.freeze({
  // A. Application & Customer Entry
  APP_OPENED: "app_opened",
  SESSION_STARTED: "session_started",
  SIGNUP_STARTED: "signup_started",
  SIGNUP_COMPLETED: "signup_completed",
  LOGIN_COMPLETED: "login_completed",
  LOGOUT_COMPLETED: "logout_completed",

  // B. Restaurant Discovery & Browsing
  RESTAURANT_LIST_VIEWED: "restaurant_list_viewed",
  RESTAURANT_VIEWED: "restaurant_viewed",
  RESTAURANT_SEARCH_PERFORMED: "restaurant_search_performed",
  RESTAURANT_SEARCH_RESULT_CLICKED: "restaurant_search_result_clicked",
  RESTAURANT_CATEGORY_SELECTED: "restaurant_category_selected",
  RESTAURANT_FILTER_APPLIED: "restaurant_filter_applied",

  // C. Food & Menu Discovery
  MENU_VIEWED: "menu_viewed",
  FOOD_ITEM_VIEWED: "food_item_viewed",
  FOOD_ITEM_ADDED_TO_CART: "food_item_added_to_cart",
  FOOD_ITEM_REMOVED_FROM_CART: "food_item_removed_from_cart",
  FOOD_ITEM_QUANTITY_UPDATED: "food_item_quantity_updated",
  FOOD_ITEM_SEARCH_PERFORMED: "food_item_search_performed",
  FOOD_CATEGORY_SELECTED: "food_category_selected",

  // D. Cart Behaviour
  CART_VIEWED: "cart_viewed",
  CART_ITEM_ADDED: "cart_item_added",
  CART_ITEM_REMOVED: "cart_item_removed",
  CART_QUANTITY_UPDATED: "cart_quantity_updated",
  CART_CLEARED: "cart_cleared",
  CART_CHECKOUT_CLICKED: "cart_checkout_clicked",

  // E. Checkout & Payment Intent (Client-Side)
  CHECKOUT_STARTED: "checkout_started",
  CHECKOUT_DELIVERY_ADDRESS_SELECTED: "checkout_delivery_address_selected",
  CHECKOUT_DELIVERY_ADDRESS_CHANGED: "checkout_delivery_address_changed",
  CHECKOUT_PAYMENT_METHOD_SELECTED: "checkout_payment_method_selected",
  CHECKOUT_PAYMENT_INITIATED: "checkout_payment_initiated",
  CHECKOUT_PAYMENT_FAILED: "checkout_payment_failed",
  CHECKOUT_COMPLETED: "checkout_completed",
  PAYMENT_METHOD_SELECTED: "payment_method_selected",
});

// Keys that must NEVER be sent to PostHog (PII, exact addresses, credentials, payment secrets)
const FORBIDDEN_KEY_PATTERN =
  /^(email|e_mail|phone|phone_?number|mobile|address_?line|street|street_?address|formatted_?address|coordinates|lat|lng|latitude|longitude|password|passcode|pin|otp|cvv|cvc|card_?number|pan|bank_?account|account_?number|bvn|nin|token|access_?token|refresh_?token|password_?setup_?token|secret|authorization|cookie|full_?name|first_?name|last_?name|firstname|lastname)$/i;

const SENSITIVE_QUERY_PARAMS = new Set([
  "email",
  "phone",
  "token",
  "otp",
  "code",
  "passwordSetupToken",
  "accessToken",
  "refreshToken",
]);

export function toNumericAmount(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const num = Number(value);
  if (!Number.isFinite(num)) return undefined;
  return Number(num.toFixed(2));
}

export function normalizeId(value) {
  if (!value) return undefined;
  if (typeof value === "object") {
    const id = value._id || value.id;
    return id ? String(id) : undefined;
  }
  const str = String(value).trim();
  return str || undefined;
}

export function resolveCanonicalUserId(user) {
  if (!user || typeof user !== "object") return null;
  const id = user._id || user.id || user.userId;
  if (!id) return null;
  const normalized = String(id).trim();
  // Never allow an email address to be used as distinct_id
  if (!normalized || normalized.includes("@")) return null;
  return normalized;
}

export function sanitizeProperties(rawProps = {}) {
  if (!rawProps || typeof rawProps !== "object") return {};
  const clean = {};

  for (const [key, value] of Object.entries(rawProps)) {
    if (value === undefined || value === null) continue;
    if (FORBIDDEN_KEY_PATTERN.test(key)) continue;

    if (typeof value === "number") {
      if (!Number.isFinite(value)) continue;
      clean[key] = value;
      continue;
    }

    if (typeof value === "boolean") {
      clean[key] = value;
      continue;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) continue;
      // Redact accidental emails outside explicit search query strings
      if (key !== "search_query" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        continue;
      }
      clean[key] = trimmed.length > 500 ? trimmed.slice(0, 500) : trimmed;
      continue;
    }

    if (Array.isArray(value)) {
      const sanitizedArray = value
        .slice(0, 25)
        .filter((item) => ["string", "number", "boolean"].includes(typeof item))
        .map((item) => (typeof item === "string" ? item.trim().slice(0, 120) : item));
      if (sanitizedArray.length > 0) {
        clean[key] = sanitizedArray;
      }
      continue;
    }

    if (typeof value === "object") {
      const nested = sanitizeProperties(value);
      if (Object.keys(nested).length > 0) {
        clean[key] = nested;
      }
    }
  }

  return clean;
}

export function sanitizeUrlForAnalytics(pathname, searchParams) {
  const safePath = pathname || "/";
  if (!searchParams) return safePath;

  const params = new URLSearchParams();
  const entries =
    typeof searchParams.entries === "function"
      ? Array.from(searchParams.entries())
      : Object.entries(searchParams);

  for (const [key, val] of entries) {
    if (SENSITIVE_QUERY_PARAMS.has(key) || FORBIDDEN_KEY_PATTERN.test(key)) continue;
    if (val) params.set(key, String(val).slice(0, 120));
  }

  const queryString = params.toString();
  return queryString ? `${safePath}?${queryString}` : safePath;
}

export function extractAttributionContext() {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search || "");
    const context = {};

    const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    for (const key of utmKeys) {
      const val = params.get(key);
      if (val) context[key] = val.trim().slice(0, 120);
    }

    const ref = params.get("ref") || params.get("referralCode");
    if (ref) {
      context.referral_source = "referral_link";
      context.has_referral_code = true;
    }

    if (document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.origin !== window.location.origin) {
          context.referring_domain = refUrl.hostname;
          if (!context.referral_source) context.referral_source = refUrl.hostname;
        }
      } catch {
        // Ignore malformed referrer URLs
      }
    }

    return sanitizeProperties(context);
  } catch {
    return {};
  }
}

export function extractCoarseDeliveryArea(address) {
  if (!address || typeof address !== "object") return {};
  return sanitizeProperties({
    delivery_city: address.city || address.cityName,
    delivery_state: address.state || address.stateName,
  });
}
