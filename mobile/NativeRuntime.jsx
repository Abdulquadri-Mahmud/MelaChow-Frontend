"use client";
import { useEffect, useState } from "react";
import { useRouter } from "./navigation";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { installTransport } from "./transport";
import { fromAppUrl, toMobileHref } from "./routes.mjs";
import { parsePendingPayment, pendingPaymentKey, isPaymentVerificationPath } from "./payment-state.mjs";

export default function NativeRuntime({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    installTransport();

    let verificationStarted = false;

    const getPending = () => {
      const payment = parsePendingPayment(localStorage.getItem(pendingPaymentKey));
      if (!payment) localStorage.removeItem(pendingPaymentKey);
      return payment;
    };
    const readPending = () => {
      verificationStarted = false;
      setPending(getPending());
    };
    const clearPending = (reference) => {
      const payment = getPending();
      if (!reference || !payment || payment.reference === String(reference)) {
        localStorage.removeItem(pendingPaymentKey);
        setPending(null);
      }
    };
    const continuePayment = async () => {
      if (verificationStarted) return false;
      const payment = getPending();
      if (!payment) return false;
      verificationStarted = true;
      setPending(null);
      try { await Browser.close(); } catch {}
      router.replace(payment.path);
      return true;
    };
    const navigate = async (href) => {
      const mapped = toMobileHref(href);
      if (mapped.startsWith("/") && !mapped.startsWith("//")) {
        router.push(mapped);
      } else {
        const url = new URL(mapped);
        if (url.protocol === "https:" || url.protocol === "http:") await Browser.open({ url: url.href });
      }
    };

    window.__melachowNavigate = (href) => navigate(href).catch(console.error);
    window.__melachowPaymentVerified = clearPending;

    const click = (event) => {
      const anchor = event.target.closest?.("a[href]");
      if (!anchor || event.defaultPrevented) return;
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin && ["https:", "http:"].includes(url.protocol)) {
        event.preventDefault();
        window.__melachowNavigate(url.href);
      }
    };

    document.addEventListener("click", click, true);
    window.addEventListener("mobile:payment", readPending);
    readPending();

    const handles = [];
    let disposed = false;
    let leftForPayment = false;
    const listen = async (source, name, fn) => {
      const handle = await source.addListener(name, fn);
      if (disposed) await handle.remove(); else handles.push(handle);
    };
    const onUrl = async ({ url }) => {
      const path = fromAppUrl(url);
      if (!path) return;
      if (isPaymentVerificationPath(path)) {
        setPending(null);
        try { await Browser.close(); } catch {}
        router.replace(path);
      } else {
        router.push(path);
      }
    };

    if (Capacitor.isNativePlatform()) {
      listen(App, "backButton", ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else if (window.location.pathname !== "/home/") router.replace("/home/");
        else App.minimizeApp();
      });
      listen(App, "appStateChange", ({ isActive }) => {
        if (!isActive) {
          leftForPayment = Boolean(getPending());
        } else if (leftForPayment) {
          leftForPayment = false;
          continuePayment().catch(console.error);
        }
      });
      listen(App, "appUrlOpen", onUrl);
      listen(Browser, "browserFinished", () => continuePayment().catch(console.error));
      App.getLaunchUrl().then((result) => { if (!disposed && result) onUrl(result); });
    }

    queueMicrotask(() => { if (!disposed) setReady(true); });
    return () => {
      disposed = true;
      handles.forEach((handle) => handle.remove());
      document.removeEventListener("click", click, true);
      window.removeEventListener("mobile:payment", readPending);
      delete window.__melachowNavigate;
      delete window.__melachowPaymentVerified;
    };
  }, [router]);

  if (!ready) return <div role="status" className="p-8 text-center">Loading MelaChow&hellip;</div>;

  return <>
    {children}
    {pending && <aside className="fixed bottom-24 left-4 right-4 z-[10002] rounded-xl bg-white text-zinc-900 p-4 shadow-xl border border-orange-200" aria-label="Pending payment">
      <p className="text-sm mb-2">You have a payment awaiting confirmation.</p>
      <button className="rounded-lg bg-orange-600 text-white px-4 py-2" onClick={() => {
        setPending(null);
        router.replace(pending.path);
      }}>Verify payment</button>
      <button className="ml-3 px-3 py-2" onClick={() => {
        localStorage.removeItem(pendingPaymentKey);
        setPending(null);
      }}>Dismiss</button>
    </aside>}
  </>;
}