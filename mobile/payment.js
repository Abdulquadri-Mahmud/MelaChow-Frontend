import { Browser } from "@capacitor/browser";
import { pendingPaymentKey } from "./payment-state.mjs";

export { pendingPaymentKey } from "./payment-state.mjs";

export async function openPayment(response, kind) {
  const url = new URL(response.authorization_url);
  if (url.protocol !== "https:") throw new Error("Payment requires a secure HTTPS URL.");
  if (!response.reference) throw new Error("The payment response did not include a reference. Please contact support before retrying.");

  const path = kind === "wallet" ? "/profile/wallet/verify" : "/verify-payment";
  const reference = String(response.reference);
  localStorage.setItem(pendingPaymentKey, JSON.stringify({
    kind,
    reference,
    path: path + "?reference=" + encodeURIComponent(reference),
    createdAt: Date.now(),
  }));
  window.dispatchEvent(new Event("mobile:payment"));
  await Browser.open({ url: url.href });
}