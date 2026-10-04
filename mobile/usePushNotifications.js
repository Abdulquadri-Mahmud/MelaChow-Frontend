"use client";
import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { requestNativePush } from "@/app/lib/native-push-client";
import { nativePushTokenKey, removeNativePushToken } from "@/app/lib/push-notification-service";

export function usePushNotifications(role = "user") {
  const [permission, setPermission] = useState("default");
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    PushNotifications.checkPermissions().then((status) => {
      if (!active) return;
      setPermission(status.receive === "granted" ? "granted" : status.receive === "denied" ? "denied" : "default");
      const token = localStorage.getItem(nativePushTokenKey(role));
      if (token) setSubscription({ token });
      setLoading(false);
    }).catch((err) => { if (active) { setError(err.message); setLoading(false); } });
    return () => { active = false; };
  }, [role]);
  const subscribe = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = await requestNativePush(role);
      setPermission("granted"); setSubscription({ token });
      localStorage.setItem("melachow_" + role + "_push_notifications_enabled", "true");
      return true;
    } catch (err) { setError(err.message); return false; }
    finally { setLoading(false); }
  }, [role]);
  const unsubscribe = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const key = nativePushTokenKey(role), token = localStorage.getItem(key);
      if (token) await removeNativePushToken(token, role);
      localStorage.removeItem(key);
      localStorage.setItem("melachow_" + role + "_push_notifications_enabled", "false");
      setSubscription(null); return true;
    } catch (err) { setError(err.message); return false; }
    finally { setLoading(false); }
  }, [role]);
  return { isSupported: Capacitor.isNativePlatform(), permission, subscription, loading, error, subscribe, unsubscribe, shouldShowPrompt: () => Capacitor.isNativePlatform() && permission !== "granted" && permission !== "denied", dismissPrompt: () => {} };
}
