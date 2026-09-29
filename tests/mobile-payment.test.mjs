import test from "node:test";
import assert from "node:assert/strict";
import { isPaymentVerificationPath, parsePendingPayment, pendingPaymentMaxAgeMs } from "../mobile/payment-state.mjs";

test("accepts only mobile order and wallet verification routes", () => {
  assert.equal(isPaymentVerificationPath("/verify-payment?reference=order-1"), true);
  assert.equal(isPaymentVerificationPath("/profile/wallet/verify?reference=wallet-1"), true);
  assert.equal(isPaymentVerificationPath("/verify-payment"), false);
  assert.equal(isPaymentVerificationPath("https://evil.example/verify-payment?reference=x"), false);
});

test("pending payments are validated and expire after one day", () => {
  const now = 2_000_000_000_000;
  const payment = {
    kind: "order",
    reference: "order-1",
    path: "/verify-payment?reference=order-1",
    createdAt: now - 1000,
  };
  assert.deepEqual(parsePendingPayment(JSON.stringify(payment), now), payment);
  assert.equal(parsePendingPayment({ ...payment, createdAt: now - pendingPaymentMaxAgeMs - 1 }, now), null);
  assert.equal(parsePendingPayment("{bad json", now), null);
});