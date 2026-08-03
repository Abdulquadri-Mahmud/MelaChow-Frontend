"use client";

import { Bell, BellOff, AlertCircle } from "lucide-react";
import { usePushNotifications } from "../../hooks/usePushNotifications";

export default function NotificationSettings() {
  const { isSupported, subscription, permission, loading, subscribe, unsubscribe } = usePushNotifications();
  const isEnabled = Boolean(subscription);
  const isDenied = permission === "denied";

  if (!isSupported) {
    return <div className="rounded-xl border border-zinc-200 bg-white p-4 text-base text-zinc-600">Notifications are not available in this browser.</div>;
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isEnabled ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"}`}>
            {isEnabled ? <Bell size={22} /> : <BellOff size={22} />}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Order updates</h2>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Get updates about your order and delivery.</p>
          </div>
        </div>
        <button type="button" role="switch" aria-checked={isEnabled} aria-label="Order updates" onClick={isEnabled ? unsubscribe : subscribe} disabled={loading || isDenied} className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${isEnabled ? "bg-orange-600" : "bg-zinc-300 dark:bg-zinc-700"} disabled:cursor-not-allowed disabled:opacity-50`}>
          <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${isEnabled ? "translate-x-7" : "translate-x-1"}`} />
        </button>
      </div>
      {isDenied && <div className="mt-4 flex gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"><AlertCircle size={18} className="shrink-0" /> Allow notifications in your browser settings to turn this on.</div>}
    </section>
  );
}