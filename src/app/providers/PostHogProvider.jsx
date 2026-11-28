"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useProfile } from "@/app/context/ProfileContext";
import {
  ANALYTICS_EVENTS,
  identifyCustomer,
  initPostHog,
  trackEvent,
  trackPageView,
} from "@/app/lib/analytics/posthog";
import {
  extractAttributionContext,
  sanitizeUrlForAnalytics,
} from "@/app/lib/analytics/events";

const APP_OPENED_SESSION_KEY = "melachow_ph_app_opened";
const LAST_ACTIVITY_STORAGE_KEY = "melachow_ph_last_activity_ts";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function PostHogLifecycleTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userProfile, hasCheckedSession } = useProfile();

  const lastTrackedUrlRef = useRef(null);
  const bootTrackedRef = useRef(false);

  // 1. Initialize PostHog once in browser & track cold app_opened + session_started
  useEffect(() => {
    const ok = initPostHog();
    if (!ok || bootTrackedRef.current) return;
    bootTrackedRef.current = true;

    const attribution = extractAttributionContext();
    const landingPage = sanitizeUrlForAnalytics(pathname, searchParams);
    const isAuthenticated = Boolean(userProfile?._id || userProfile?.id);

    try {
      const alreadyOpened = window.sessionStorage.getItem(APP_OPENED_SESSION_KEY) === "1";
      if (!alreadyOpened) {
        window.sessionStorage.setItem(APP_OPENED_SESSION_KEY, "1");
        trackEvent(
          ANALYTICS_EVENTS.APP_OPENED,
          {
            landing_page: landingPage,
            is_authenticated: isAuthenticated,
            ...attribution,
          },
          { dedupeKey: "app_opened_boot", dedupeWindowMs: 5000 }
        );
      }

      const now = Date.now();
      const lastActivity = Number(window.localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY) || 0);
      if (!lastActivity || now - lastActivity > SESSION_TIMEOUT_MS) {
        trackEvent(
          ANALYTICS_EVENTS.SESSION_STARTED,
          {
            landing_page: landingPage,
            is_authenticated: isAuthenticated,
            ...attribution,
          },
          { dedupeKey: "session_started_boot", dedupeWindowMs: 5000 }
        );
      }
      window.localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(now));
    } catch {
      // Non-fatal
    }
    // Only run once on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Keep last activity fresh for 30-min session boundary
  useEffect(() => {
    if (typeof window === "undefined") return;
    const touchActivity = () => {
      try {
        window.localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(Date.now()));
      } catch {
        // ignore
      }
    };
    window.addEventListener("visibilitychange", touchActivity);
    return () => window.removeEventListener("visibilitychange", touchActivity);
  }, []);

  // 3. Identify authenticated customer whenever profile resolves
  useEffect(() => {
    if (!hasCheckedSession && !userProfile) return;
    if (userProfile) {
      identifyCustomer(userProfile);
    }
  }, [userProfile, hasCheckedSession]);

  // 4. Track App Router $pageview on navigation with sanitized query parameters
  useEffect(() => {
    if (!pathname) return;
    const sanitizedUrl = sanitizeUrlForAnalytics(pathname, searchParams);
    if (lastTrackedUrlRef.current === sanitizedUrl) return;
    lastTrackedUrlRef.current = sanitizedUrl;
    trackPageView(sanitizedUrl, pathname);
  }, [pathname, searchParams]);

  return null;
}

export default function PostHogProvider({ children }) {
  return (
    <>
      <Suspense fallback={null}>
        <PostHogLifecycleTracker />
      </Suspense>
      {children}
    </>
  );
}
