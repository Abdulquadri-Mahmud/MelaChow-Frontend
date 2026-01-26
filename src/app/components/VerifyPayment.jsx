"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { verifyPaymentV2 } from "../lib/orderService";
import toast from "react-hot-toast";
import Header2 from "./App_Header/Header2";

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
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("failed");

        let msg = "Something went wrong while verifying your payment.";

        // Handle specific Business Logic Failures (e.g. Insufficient Funds)
        if (error.code === "PAYMENT_FAILED") {
          msg = error.message; // "Payment not successful" or detailed msg
          // We could also access error.failedOrder here if we wanted to show the ID
        } else if (error.message) {
          msg = error.message;
        }

        setErrorMessage(msg);
        toast.error(msg);
      }
    };

    verifyPayment();
  }, [reference]);

  // console.log(order)

  // Loading State
  if (status === "verifying") {
    return (
      <div className="py-20 bg-white flex items-center justify-center px-4">
        <div className="bg-white border rounded-2xl p-6 max-w-sm w-full text-center animate-fadeIn">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Verifying Payment</h2>
          <p className="text-gray-600 text-sm mt-2 animate-pulse">
            Please wait while we confirm your transaction...
          </p>
        </div>
      </div>
    );
  }

  // Failed State
  if (status === "failed") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="bg-white shadow-md border rounded-2xl p-6 max-w-md w-full text-center animate-fadeIn">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-4xl">
              !
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Payment Failed</h2>
          <p className="text-gray-600 mt-2">
            {errorMessage || "Payment failed. Please try again."}
          </p>
          <button
            onClick={() => router.push("/checkout")}
            className="w-full mt-6 py-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition"
          >
            Return to Checkout
          </button>
        </div>
      </div>
    );
  }

  // Success State
  if (status === "success" && order) {
    return (
      <div className="">
        <Header2 />
        <div className=" pb-20 bg-white flex items-center justify-center md:px-4 p-2 md:py-6">
          <div className="bg-white border rounded-2xl md:p-6 p-2 max-w-md w-full text-center animate-fadeIn">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-4xl">
                ✓
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              Payment Verified Successfully!
            </h2>
            <p className="text-gray-600 mt-2">
              Your order has been confirmed and is being processed.
            </p>

            {/* Order Details */}
            <div className="space-y-4 mt-5 md:text-sm text-xs">

              {/* Order Info */}
              <div className="bg-white rounded-xl md:p-4 p-2 border border-gray-200 space-y-2">
                <h3 className="font-semibold text-gray-800 text-lg">Order Information</h3>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Order ID:</span>
                  <span className="text-gray-800">{order.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Status:</span>
                  <span className="text-gray-800 capitalize">{order.orderStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Payment Status:</span>
                  <span className="text-gray-800 capitalize bg-green-200 px-3 py-1 rounded-md">{order.paymentStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Subtotal:</span>
                  <span className="text-gray-800">₦{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Delivery Fee:</span>
                  <span className="text-gray-800">₦{order.deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Total:</span>
                  <span className="text-orange-500 font-bold">₦{order.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-xl md:p-4 p-2 border border-gray-200 space-y-2">
                <h3 className="font-semibold text-gray-800 text-lg">Delivery Address</h3>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Address:</span>
                  <span className="text-gray-800">{order.deliveryAddress.addressLine}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">City / State:</span>
                  <span className="text-gray-800">{order.deliveryAddress.city}, {order.deliveryAddress.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Label:</span>
                  <span className="text-gray-800">{order.deliveryAddress.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Phone:</span>
                  <span className="text-gray-800">{order.deliveryAddress.phone}</span>
                </div>
              </div>

            </div>

            <button onClick={() => router.push(`/track-orders/${order.orderId}`)} className="w-full cursor-pointer mt-6 py-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition">
              View Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
