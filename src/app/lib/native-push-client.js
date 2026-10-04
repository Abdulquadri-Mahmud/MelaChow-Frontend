import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { registerNativePushToken, nativePushTokenKey } from "@/app/lib/push-notification-service";

export async function requestNativePush(role = "user") {
  let permission = await PushNotifications.checkPermissions();
  if (permission.receive !== "granted") permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") throw new Error("Notifications are blocked. Enable them in your device settings.");

  if (Capacitor.getPlatform() === "android") {
    await PushNotifications.createChannel({ id: "melachow_orders", name: "MelaChow updates", description: "Order updates and account notifications", importance: 5, visibility: 1, vibration: true });
  }

  const tokenKey = nativePushTokenKey(role);
  const existing = localStorage.getItem(tokenKey);
  if (existing) {
    await registerNativePushToken(existing, role, Capacitor.getPlatform());
    await PushNotifications.register();
    return existing;
  }

  return new Promise((resolve, reject) => {
    let registrationHandle;
    let errorHandle;
    const timeout = window.setTimeout(() => finish(new Error("Firebase did not return a device token. Try again.")), 20000);
    const cleanup = async () => { window.clearTimeout(timeout); await registrationHandle?.remove(); await errorHandle?.remove(); };
    const finish = async (error, token) => { await cleanup(); error ? reject(error) : resolve(token); };
    Promise.all([
      PushNotifications.addListener("registration", async ({ value }) => {
        localStorage.setItem(tokenKey, value);
        try { await registerNativePushToken(value, role, Capacitor.getPlatform()); await finish(null, value); }
        catch (error) { await finish(error); }
      }).then((handle) => { registrationHandle = handle; }),
      PushNotifications.addListener("registrationError", ({ error }) => finish(new Error(error || "Firebase push registration failed."))).then((handle) => { errorHandle = handle; }),
    ]).then(() => PushNotifications.register()).catch(finish);
  });
}
