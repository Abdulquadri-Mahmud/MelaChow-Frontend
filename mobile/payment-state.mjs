export const pendingPaymentKey = "melachow.mobile.pending-payment";
export const pendingPaymentMaxAgeMs = 24 * 60 * 60 * 1000;

export function isPaymentVerificationPath(path) {
  return /^\/(verify-payment|profile\/wallet\/verify)\?reference=[^&]+/.test(path || "");
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