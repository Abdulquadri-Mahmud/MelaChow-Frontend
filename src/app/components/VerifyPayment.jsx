"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
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

  const router = useRouter();

  const reference = searchParams.get("reference");
  const didVerify = useRef(false);

  useEffect(() => {
    // Prevent double verification
    if (!reference || didVerify.current) return;
    didVerify.current = true;

    const verifyPayment = async () => {
      try {
        // Use V2 API with cookie-based authentication
        const res = await verifyPaymentV2(reference);
        console.log("V2 Payment Verification Response:", res);

        // Check if order was created successfully
        if (!res.order) {
          setStatus("failed");
          setErrorMessage("Payment verified but order was not created.");
          toast.error("Payment verified but order was not created.");
          return;
        }

        // Set order data and success status
        setOrder(res.order);
        setStatus("success");
        toast.success(res.message || "Payment verified successfully!");

        // Clear pending order ID from session storage if it exists
        sessionStorage.removeItem("pendingOrderId");
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("failed");

        let msg = "Something went wrong while verifying your payment.";

        // Handle specific Business Logic Failures (e.g. Insufficient Funds)
        if (error.code === "PAYMENT_FAILED") {
          msg = error.message;
        } else if (error.message) {
          msg = error.message;
        }

        setErrorMessage(msg);
        toast.error(msg);
      }
    };

    verifyPayment();
  }, [reference]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  // 1. Verifying State
  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header2 />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl border border-gray-100"
          >
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-orange-100 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-orange-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500" size={24} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-500 font-medium">
              Please wait while we confirm your secure transaction...
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // 2. Failed State
  if (status === "failed") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header2 />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-red-50"
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-inner">
                <XCircle size={40} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <div className="bg-red-50 p-4 rounded-xl mb-6">
              <p className="text-red-700 font-medium text-sm">
                {errorMessage || "We couldn't verify your payment. Please try again."}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} /> Retry Verification
              </button>
              <button
                onClick={() => router.push("/checkout")}
                className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
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
      <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
        <Header2 />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full max-w-lg"
          >
            {/* Celebration Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20"
              >
                <Check size={48} strokeWidth={3} />
              </motion.div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">Order Confirmed!</h1>
              <p className="text-gray-500 font-medium">Thank you for your purchase.</p>
            </div>

            {/* Receipt Card */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-8 relative">
              {/* Receipt Top Pattern */}
              <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600" />

              <div className="p-6 md:p-8">
                {/* Header Info */}
                <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Order ID</p>
                    <p className="font-mono text-lg font-bold text-gray-900">#{order.orderId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      {order.paymentStatus === 'success' ? 'Paid' : order.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-center py-4 bg-gray-50 rounded-2xl mb-6 border border-gray-100">
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Amount Paid</p>
                  <p className="text-3xl font-black text-gray-900">₦{order.total.toLocaleString()}</p>
                </div>

                {/* Details List */}
                <div className="space-y-4">
                  {/* Delivery Info */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-orange-500">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Delivery Address</p>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        {order.deliveryAddress.addressLine}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {order.deliveryAddress.city}, {order.deliveryAddress.state}
                      </p>
                      <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{order.deliveryAddress.label}</p>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-500">
                      <Receipt size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">Payment Details</p>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-medium">₦{order.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-0.5">
                        <span className="text-gray-500">Delivery Fee</span>
                        <span className="font-medium">₦{order.deliveryFee.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-50 p-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push(`/track-orders/${order.orderId}`)}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Track Order <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-white text-gray-700 border border-gray-200 font-bold hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Home size={18} /> Continue Shopping
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400">
              A confirmation email has been sent to your registered email address.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}
