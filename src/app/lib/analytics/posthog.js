"use client";

import posthog from "posthog-js";
import {
  ANALYTICS_EVENTS,
  extractCoarseDeliveryArea,
  resolveCanonicalUserId,
  sanitizeProperties,
} from "./events";

const POSTHOG_KEY = (process.env.NEXT_PUBLIC_POSTHOG_KEY || "").trim();
const POSTHOG_HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").trim();
const POSTHOG_ENABLED_FLAG = (process.env.NEXT_PUBLIC_POSTHOG_ENABLED || "true").trim().toLowerCase();
const APP_ENVIRONMENT = (
  process.env.NEXT_PUBLIC_APP_ENV ||
  process.env.NEXT_PUBLIC_VERCEL_ENV ||
  process.env.NODE_ENV ||
  "development"
).trim();
const APP_VERSION = (process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0").trim();
const SESSION_RECORDING_ENABLED =
  (process.env.NEXT_PUBLIC_POSTHOG_SESSION_RECORDING || "false").trim().toLowerCase() === "true";

let initialized = false;
let initializing = false;
let lastIdentifiedUserId = null;
let lastIdentifiedFingerprint = null;

// Short-window dedupe map to prevent React Strict Mode or accidental double-renders
const recentEvents = new Map();
const MAX_DEDUPE_ENTRIES = 200;

export function detectCustomerPlatform() {
  if (typeof window === "undefined") return "server";
  try {
    const cap = window.Capacitor;
    const isNative =
      process.env.NEXT_PUBLIC_MOBILE_BUILD === "true" ||
      Boolean(cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform());

    if (isNative) {
      const nativePlatform =
        cap && typeof cap.getPlatform === "function" ? String(cap.getPlatform()).toLowerCase() : "";
      if (nativePlatform === "ios") return "ios_capacitor";
      if (nativePlatform === "android") return "android_capacitor";
      return /iphone|ipad|ipod/i.test(navigator.userAgent || "") ? "ios_capacitor" : "android_capacitor";
    }

    const isStandalone =
      Boolean(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      Boolean(window.navigator?.standalone);

    return isStandalone ? "pwa" : "web";
  } catch {
    return "web";
  }
}

export function isAnalyticsEnabled() {
  if (typeof window === "undefined") return false;
  if (!POSTHOG_KEY) return false;
  if (POSTHOG_ENABLED_FLAG === "false" || POSTHOG_ENABLED_FLAG === "0") return false;
  return true;
}

export function getAnalyticsBaseContext() {
  return {
    app: "melachow_customer",
    platform: detectCustomerPlatform(),
    environment: APP_ENVIRONMENT,
    app_version: APP_VERSION,
  };
}

export function initPostHog() {
  if (typeof window === "undefined") return false;
  if (initialized || initializing) return initialized;
  if (!isAnalyticsEnabled()) return false;

  initializing = true;
  try {
    const platform = detectCustomerPlatform();
    const isNativeOrigin = platform === "android_capacitor" || platform === "ios_capacitor";

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // Manual App Router pageviews so sensitive query params are stripped cleanly
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: true,
      // Native Capacitor WebViews run on http(s)://localhost or capacitor://localhost
      // where cookies can be restricted; localStorage persistence is reliable there.
      persistence: isNativeOrigin ? "localStorage" : "localStorage+cookie",
      person_profiles: "identified_only",
      disable_session_recording: !SESSION_RECORDING_ENABLED,
      respect_dnt: false,
      loaded: (client) => {
        try {
          client.register(getAnalyticsBaseContext());
          if (APP_ENVIRONMENT === "development" && process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "true") {
            client.debug(true);
          }
        } catch {
          // Never interrupt app startup
        }
      },
    });

    initialized = true;
    return true;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[PostHog] Initialization failed safely:", err?.message || err);
    }
    return false;
  } finally {
    initializing = false;
  }
}

function shouldDedupe(dedupeKey, windowMs) {
  if (!dedupeKey || !windowMs || windowMs <= 0) return false;
  const now = Date.now();
  const prev = recentEvents.get(dedupeKey);
  if (prev && now - prev < windowMs) {
    return true;
  }
  if (recentEvents.size >= MAX_DEDUPE_ENTRIES) {
    const firstKey = recentEvents.keys().next().value;
    if (firstKey) recentEvents.delete(firstKey);
  }
  recentEvents.set(dedupeKey, now);
  return false;
}

/**
 * Safely capture a product analytics event.
 * Never throws; never blocks ordering, payment, or auth.
 */
export function trackEvent(eventName, properties = {}, options = {}) {
  if (typeof window === "undefined" || !eventName) return;
  if (!isAnalyticsEnabled()) return;

  try {
    if (!initialized) initPostHog();
    if (!initialized) return;

    const { dedupeKey, dedupeWindowMs = 800 } = options || {};
    if (dedupeKey && shouldDedupe(dedupeKey, dedupeWindowMs)) {
      return;
    }

    const sanitized = sanitizeProperties({
      ...getAnalyticsBaseContext(),
      ...properties,
    });

    posthog.capture(eventName, sanitized);
  } catch {
    // Analytics failure must never affect app functionality
  }
}

/**
 * Track a Next.js App Router pageview with sanitized URL.
 */
export function trackPageView(sanitizedUrl, pathname) {
  if (typeof window === "undefined" || !isAnalyticsEnabled()) return;
  try {
    if (!initialized) initPostHog();
    if (!initialized) return;

    const fullUrl = `${window.location.origin}${sanitizedUrl.startsWith("/") ? sanitizedUrl : `/${sanitizedUrl}`}`;
    posthog.capture("$pageview", sanitizeProperties({
      $current_url: fullUrl,
      pathname: pathname || "/",
      ...getAnalyticsBaseContext(),
    }));
  } catch {
    // Non-fatal
  }
}

/**
 * Identify an authenticated customer using their canonical stable user ID.
 * Links pre-login anonymous browsing to the customer profile without sending PII.
 */
export function identifyCustomer(user) {
  if (typeof window === "undefined" || !isAnalyticsEnabled()) return;
  const userId = resolveCanonicalUserId(user);
  if (!userId) return;

  try {
    if (!initialized) initPostHog();
    if (!initialized) return;

    const defaultAddress =
      user?.addresses?.find?.((addr) => addr.isDefault) || user?.addresses?.[0] || null;
    const coarseArea = extractCoarseDeliveryArea(defaultAddress);

    const safeTraits = sanitizeProperties({
      user_role: "customer",
      environment: APP_ENVIRONMENT,
      platform: detectCustomerPlatform(),
      has_default_address: Boolean(defaultAddress),
      is_verified: typeof user?.isVerified === "boolean" ? user.isVerified : undefined,
      account_created_at: user?.createdAt ? String(user.createdAt) : undefined,
      city: coarseArea.delivery_city,
      state: coarseArea.delivery_state,
    });

    const fingerprint = `${userId}:${JSON.stringify(safeTraits)}`;
    if (lastIdentifiedUserId === userId && lastIdentifiedFingerprint === fingerprint) {
      return;
    }

    posthog.identify(userId, safeTraits);
    lastIdentifiedUserId = userId;
    lastIdentifiedFingerprint = fingerprint;
  } catch {
    // Non-fatal
  }
}

/**
 * Reset analytics identity on logout so the next user/session gets a clean anonymous ID.
 */
export function resetAnalyticsIdentity() {
  lastIdentifiedUserId = null;
  lastIdentifiedFingerprint = null;
  if (typeof window === "undefined" || !isAnalyticsEnabled() || !initialized) return;
  try {
    posthog.reset();
    posthog.register(getAnalyticsBaseContext());
  } catch {
    // Non-fatal
  }
}

export function getPostHogDistinctId() {
  if (typeof window === "undefined" || !initialized) return null;
  try {
    return posthog.get_distinct_id?.() || null;
  } catch {
    return null;
  }
}

export { ANALYTICS_EVENTS };
