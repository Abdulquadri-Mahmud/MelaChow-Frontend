export const pendingPaymentKey = "melachow.mobile.pending-payment";
export const pendingPaymentMaxAgeMs = 24 * 60 * 60 * 1000;

export function isPaymentVerificationPath(path) {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) return false;
  try {
    const url = new URL(path, "https://melachow.local");
    const normalizedPath = url.pathname.replace(/\/+$/, "");
    if (normalizedPath !== "/verify-payment" && normalizedPath !== "/profile/wallet/verify") return false;
    const reference = url.searchParams.get("reference") || url.searchParams.get("trxref");
    return Boolean(reference && reference.trim());
  } catch {
    return false;
  }
}

export function parsePendingPayment(value, now = Date.now()) {
  try {
    const payment = typeof value === "string" ? JSON.parse(value) : value;
    if (!payment || !isPaymentVerificationPath(payment.path)) return null;
    if (!payment.reference || typeof payment.reference !== "string") return null;
    if (!Number.isFinite(payment.createdAt) || now - payment.createdAt > pendingPaymentMaxAgeMs) return null;
    return payment;
  } catch {
    return null;
  }
}