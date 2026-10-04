"use client";
import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import toast from "react-hot-toast";
import { TokenManager } from "@/app/lib/auth-token";
import { nativePushTokenKey, registerNativePushToken, removeNativePushToken } from "@/app/lib/push-notification-service";

export default function NativePushRuntime({ role = "user" }) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let disposed = false;
    const handles = [];
    const add = async (event, callback) => {
      const handle = await PushNotifications.addListener(event, callback);
      if (disposed) await handle.remove(); else handles.push(handle);
    };
    const sync = async (token) => {
      if (!token) return;
      localStorage.setItem(nativePushTokenKey(role), token);
      if (TokenManager.getToken(role)) {
        try { await registerNativePushToken(token, role, Capacitor.getPlatform()); }
        catch (error) { console.warn("FCM token sync deferred until sign-in.", error.response?.status || error.message); }
      }
    };
    const clear = (event) => {
      if (event.detail?.role !== role) return;
      const token = localStorage.getItem(nativePushTokenKey(role));
      const authToken = TokenManager.getToken(role);
      if (token && authToken) removeNativePushToken(token, role, authToken).catch(() => {});
      localStorage.removeItem(nativePushTokenKey(role));
    };
    const tokenChanged = () => {
      const token = localStorage.getItem(nativePushTokenKey(role));
      if (token) void sync(token);
    };
    const openNotification = ({ notification }) => {
      const target = notification?.data?.url || notification?.data?.route;
      if (typeof target === "string" && target.startsWith("/") && !target.startsWith("//")) window.__melachowNavigate?.(target);
    };
    const showNotification = (notification) => toast(notification.body || notification.title || "You have a new MelaChow update.", { duration: 7000 });
    window.addEventListener("melachow:auth-token-set", tokenChanged);
    window.addEventListener("melachow:auth-token-clearing", clear);
    const setup = async () => {
      await add("registration", ({ value }) => { void sync(value); });
      await add("registrationError", ({ error }) => console.error("FCM registration failed", error));
      await add("pushNotificationReceived", showNotification);
      await add("pushNotificationActionPerformed", openNotification);
      const saved = localStorage.getItem(nativePushTokenKey(role));
      if (saved && TokenManager.getToken(role)) await sync(saved);
      const permission = await PushNotifications.checkPermissions();
      if (permission.receive === "granted") {
        if (Capacitor.getPlatform() === "android") await PushNotifications.createChannel({ id: "melachow_orders", name: "MelaChow updates", description: "Order updates and account notifications", importance: 5, visibility: 1, vibration: true });
        await PushNotifications.register();
      }
    };
    void setup().catch((error) => console.error("Native push setup failed", error));
    const appState = App.addListener("appStateChange", ({ isActive }) => { if (isActive) tokenChanged(); });
    return () => {
      disposed = true;
      window.removeEventListener("melachow:auth-token-set", tokenChanged);
      window.removeEventListener("melachow:auth-token-clearing", clear);
      handles.forEach((handle) => handle.remove());
      appState.then((handle) => handle.remove());
    };
  }, [role]);
  return null;
}
