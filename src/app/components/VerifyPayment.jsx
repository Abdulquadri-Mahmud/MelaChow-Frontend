"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { verifyPaymentV2 } from "../lib/orderService";
import toast from "react-hot-toast";
import Header2 from "./App_Header/Header2";
import { motion } from "framer-motion";
import { Check, XCircle, Loader2, MapPin, Receipt, ArrowRight, Home, AlertTriangle, RefreshCw } from "lucide-react";

export default function VerifyPayment() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [order, setOrder] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryMessage, setRetryMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef(null);
  const didVerify = useRef(false);
  const verifyPaymentRef = useRef(null);
  const retryCountRef = useRef(0);
  const inFlightRef = useRef(false);

  const router = useRouter();

  const reference = searchParams.get("reference");
  const formatMoney = (value) => `₦${Number(value || 0).toLocaleString()}`;
  const promoWaivedDelivery =
    Number(order?.deliveryFee || 0) === 0 &&
    Number(order?.freeDeliveryPromo?.originalDeliveryFee || order?.vendorDeliveryPromo?.originalDeliveryFee || 0) > 0;

  const scheduleRetry = useCallback((delay = 5000) => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    retryTimeoutRef.current = setTimeout(() => {
      retryTimeoutRef.current = null;
      if (typeof navigator === "undefined" || navigator.onLine) verifyPaymentRef.current?.();
    }, delay);
  }, []);

  const verifyPayment = useCallback(async () => {
    if (!reference || inFlightRef.current) return;
    inFlightRef.current = true;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    try {
      setErrorMessage("");
      setRetryMessage("");
      setStatus("verifying");

      const res = await verifyPaymentV2(reference);
      console.log("V2 Payment Verification Response:", res);

      const paymentStatus = String(res.order?.paymentStatus || res.payment?.status || "").toLowerCase();
      const explicitlyPending = res.paymentPending || res.success === false || ["pending", "processing", "ongoing", "unpaid"].includes(paymentStatus);
      if (explicitlyPending) {
        throw Object.assign(new Error(res.message || "Paystack is still confirming this payment."), {
          paymentPending: true,
          status: 202,
          paystack: res.paystack || null,
        });
      }

      if (!res.order) {
        const msg = "Payment verified but order was not created.";
        setStatus("failed");
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      if (paymentStatus && !["paid", "success", "fulfilled"].includes(paymentStatus)) {
        throw Object.assign(new Error("We’re still waiting for Paystack to confirm this payment."), { paymentPending: true, status: 202 });
      }

      setOrder(res.order);
      setStatus("success");
      retryCountRef.current = 0;
      setRetryCount(0);
      window.__melachowPaymentVerified?.(reference);
      setRetryMessage("");
      toast.success(res.message || "Payment verified successfully!");

      localStorage.setItem("has_placed_order", "true");
      sessionStorage.removeItem("pendingOrderId");

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    } catch (error) {
      const online = typeof navigator === "undefined" || navigator.onLine;
      const statusCode = error.status || error.response?.status;
      const paystackStatus = String(error.paystack?.status || "").toLowerCase();
      const paymentStillSettling = error.paymentPending || ["pending", "processing", "ongoing"].includes(paystackStatus);
      const transient = !online || !statusCode || [408, 425, 429].includes(statusCode) || statusCode >= 500;
      // Older API deployments return a generic 400 for a Paystack transaction
      // that has not settled yet. Give that ambiguous response a short grace window.
      const legacyUnconfirmed = error.code === "PAYMENT_FAILED" && !paystackStatus && retryCountRef.current < 3;
      const canRetry = paymentStillSettling || transient || legacyUnconfirmed;
      const maxRetries = paymentStillSettling || transient ? 8 : 3;

      if (canRetry && retryCountRef.current < maxRetries) {
        const nextCount = retryCountRef.current + 1;
        retryCountRef.current = nextCount;
        setStatus("retrying");
        setRetryMessage(!online
          ? "You’re offline. Verification will resume when your connection returns."
          : paymentStillSettling || legacyUnconfirmed
          ? "Paystack is confirming the transaction. We’ll check again shortly."
          : "Verification is temporarily unavailable. We’ll retry automatically.");
        setRetryCount(nextCount);
        const delay = [2500, 4000, 6000, 8000, 10000, 12000, 15000, 15000][Math.min(nextCount - 1, 7)];
        if (online) scheduleRetry(delay);
        return;
      }

      setStatus("failed");
      const msg = !online
        ? "You’re offline. Reconnect and retry verification."
        : error.message || "Something went wrong while verifying your payment.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      inFlightRef.current = false;
    }
  }, [reference, scheduleRetry]);

  const retryNow = () => {
    retryCountRef.current = 0;
    setRetryCount(0);
    verifyPaymentRef.current?.();
  };

  useEffect(() => {
    verifyPaymentRef.current = verifyPayment;
  }, [verifyPayment]);

  useEffect(() => {
    if (!reference || didVerify.current) return;
    didVerify.current = true;
    verifyPayment();

    const handleOnline = () => {
      setRetryMessage("Connection restored. Retrying payment verification now...");
      setStatus("retrying");
      retryCountRef.current = 0;
      setRetryCount(0);
      scheduleRetry(250);
    };

    const handleOffline = () => {
      setRetryMessage("You are offline. We will retry automatically when your device reconnects.");
      setStatus("retrying");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [reference, verifyPayment, scheduleRetry]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  // 1. Verifying / Retrying State
  if (status === "verifying" || status === "retrying") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col transition-colors duration-300">
        <Header2 />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-5 max-w-xs w-full text-center shadow-lg border border-slate-100 dark:border-zinc-800"
          >
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-12 h-12 border-[3px] border-orange-100 dark:border-orange-500/10 rounded-full"></div>
                <div className="w-12 h-12 border-[3px] border-orange-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500" size={17} />
              </div>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-1 font-display tracking-tight">
              {status === "retrying" ? "Retrying Verification" : "Verifying Payment"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              {retryMessage || "Please wait while we confirm your secure transaction..."}
            </p>
            {retryCount > 0 && (
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2">
                Check {retryCount} · automatic retry enabled
              </p>
            )}
            {status === "retrying" && (
              <button
                onClick={retryNow}
                className="mt-3 px-5 py-2.5 rounded-lg bg-slate-900 dark:bg-zinc-100 dark:text-zinc-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Retry now
              </button>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // 2. Failed State
  if (status === "failed") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col transition-colors duration-300">
        <Header2 />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-5 max-w-sm w-full text-center shadow-lg border border-red-50 dark:border-red-500/10"
          >
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center shadow-inner">
                <XCircle size={25} />
              </div>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-2 tracking-tight">Payment verification needs attention</h2>
            <div className="bg-red-50 dark:bg-red-500/5 p-3 rounded-lg mb-4">
              <p className="text-red-700 dark:text-red-400 font-medium text-sm">
                {errorMessage || "We couldn't verify your payment. Please try again."}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={retryNow}
                className="w-full py-3 rounded-lg bg-slate-900 dark:bg-zinc-100 dark:text-zinc-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} /> Retry Verification
              </button>
              <button
                onClick={() => router.push("/checkout")}
                className="w-full py-3 rounded-lg bg-slate-100 dark:bg-zinc-800 dark:text-zinc-300 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                Return to Checkout
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 3. Success State
  if (status === "success" && order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col pb-12 transition-colors duration-300">
        <Header2 />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full max-w-md"
          >
            {/* Celebration Header */}
            <div className="text-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md shadow-green-500/20"
              >
                <Check size={30} strokeWidth={3} />
              </motion.div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 mb-1 tracking-tight">Order confirmed</h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Thank you for your purchase.</p>
            </div>

            {/* Receipt Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg overflow-hidden border border-slate-100 dark:border-zinc-800 mb-4 relative">
              {/* Receipt Top Pattern */}
              <div className="h-1.5 bg-gradient-to-r from-orange-400 to-orange-600" />

              <div className="p-4">
                {/* Header Info */}
                <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Order ID</p>
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-zinc-200">#{order.orderId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Status</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-bold rounded-full border border-green-100 dark:border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      {["success", "paid", "fulfilled"].includes(String(order.paymentStatus).toLowerCase()) ? 'Paid' : order.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-center py-2.5 bg-slate-50 dark:bg-zinc-800/50 rounded-xl mb-4 border border-slate-100 dark:border-zinc-800">
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-0.5">Total amount paid</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-zinc-100">{formatMoney(order.total)}</p>
                </div>

                {/* Details List */}
                <div className="space-y-3">
                  {/* Delivery Info */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-500">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-zinc-200 text-sm">Delivery Address</p>
                      <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
                        {order.deliveryAddress.addressLine}
                      </p>
                      <p className="text-slate-500 dark:text-zinc-400 text-sm">
                        {order.deliveryAddress.city}, {order.deliveryAddress.state}
                      </p>
                      <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">{order.deliveryAddress.label}</p>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500">
                      <Receipt size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-zinc-200 text-sm">Payment Details</p>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-slate-500 dark:text-zinc-400">Subtotal</span>
                        <span className="font-medium text-slate-900 dark:text-zinc-200">{formatMoney(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-0.5">
                        <span className="text-slate-500 dark:text-zinc-400">Delivery Fee</span>
                        <span className={`font-medium ${Number(order.deliveryFee || 0) === 0 ? "text-green-600 dark:text-green-400" : "text-slate-900 dark:text-zinc-200"}`}>
                          {Number(order.deliveryFee || 0) === 0 ? (promoWaivedDelivery ? "Free (promo)" : "Free") : formatMoney(order.deliveryFee)}
                        </span>
                      </div>

                      {/* Promo Rejection Note */}
                      {Number(order.deliveryFee || 0) > 0 && order.freeDeliveryPromo?.reason && (
                        <div className="mt-1 p-2 bg-amber-50 dark:bg-amber-500/5 rounded-lg border border-amber-100 dark:border-amber-500/10">
                          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                            <span className="font-bold uppercase mr-1">Note:</span>
                            {order.freeDeliveryPromo.reason === 'ip_threshold_exceeded'
                              ? "Free delivery promo limit reached for this network/device."
                              : order.freeDeliveryPromo.reason === 'not_first_order'
                              ? "This promo is only for your first order."
                              : "Delivery promo could not be applied."}
                          </p>
                        </div>
                      )}

                      {Number(order.freeDeliveryPromo?.originalDeliveryFee || order.vendorDeliveryPromo?.originalDeliveryFee || 0) > 0 && Number(order.deliveryFee || 0) === 0 && (
                        <div className="flex justify-between text-sm mt-0.5">
                          <span className="text-green-600 dark:text-green-400">Delivery Promo Saved</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            -{formatMoney(order.freeDeliveryPromo?.originalDeliveryFee || order.vendorDeliveryPromo?.originalDeliveryFee)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm mt-0.5">
                        <span className="text-slate-500 dark:text-zinc-400">Service Fee</span>
                        <span className="font-medium text-slate-900 dark:text-zinc-200">{formatMoney(order.serviceFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                        <span className="font-bold text-slate-900 dark:text-zinc-200">Total Paid</span>
                        <span className="font-bold text-slate-900 dark:text-zinc-100">{formatMoney(order.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-slate-50 dark:bg-zinc-800/50 p-3 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => router.push(`/track-orders/${order.orderId}`)}
                  className="flex-1 py-3 px-4 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Track Order <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 font-bold hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Home size={16} /> Continue Shopping
                </button>
              </div>
            </div>

            <p className="text-center text-[11px] text-slate-400 dark:text-zinc-500">
              A confirmation email has been sent to your registered email address.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}
