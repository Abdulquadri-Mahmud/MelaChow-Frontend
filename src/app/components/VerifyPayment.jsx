"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { Loader2, CheckCircle2 } from "lucide-react";
import { verifyPayment } from "../lib/api";
import { useCart } from "../context/CartContext";

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const { cart } = useCart();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [token, setToken] = useState(null);

  // Prevent double verification
  const verifiedRef = useRef(false);

  // Get token once
  useEffect(() => {
    const storedToken = localStorage.getItem("userToken");
    setToken(storedToken || null);
  }, []);

  // Fetch order/payment status
  useEffect(() => {
    if (!reference || !token || verifiedRef.current) return;

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await verifyPayment(token, reference);
        verifiedRef.current = true; // Mark as verified

        if (res.order) {
          setOrder(res.order);
        } else {
          toast.success("Payment verified! Your order is being processed...");
          setOrder(null);
        }
      } catch (err) {
        console.error(err);
        toast.error("Payment verification failed");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [reference, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Toaster />
        <Loader2 className="animate-spin" size={40} />
        <p className="mt-4 text-gray-700">Verifying payment...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Toaster />
        <p className="text-gray-700 font-semibold mb-4">
          Your payment was successful! Order will be created shortly.
        </p>
        <button
          onClick={() => router.push("/orders")}
          className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition"
        >
          Check Orders
        </button>
        <button
          onClick={() => router.push("/")}
          className="mt-2 px-6 py-3 border border-gray-300 rounded-xl font-semibold hover:bg-gray-100 transition"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const deliveryAddress = order.deliveryAddress;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Toaster />
      <CheckCircle2 className="text-green-500 w-20 h-20 mb-6" />
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Order Placed Successfully!
      </h1>
      <p className="text-gray-600 mb-4">
        Your order <span className="font-semibold">{order._id}</span> has been placed.
      </p>

      {/* Delivery Summary */}
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Delivery Info</h2>
        <p className="text-gray-700">
          {deliveryAddress?.addressLine}, {deliveryAddress?.city}, {deliveryAddress?.state}
        </p>
        <p className="text-gray-700 mt-1">Phone: {order.phone}</p>

        <h2 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Order Summary</h2>
        <ul className="text-gray-700 space-y-4">
          {order.items.map((item) => (
            <li key={item._id} className="flex items-center justify-between gap-4">
              <img
                src={item.foodId?.image || "/placeholder.png"}
                alt={item.foodId?.name || "Food item"}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1 flex flex-col">
                <span className="font-medium">
                  {item.foodId?.name || "Item"}{" "}
                  {item.variantId?.name ? `(${item.variantId.name})` : ""}
                </span>
                <span className="text-sm text-gray-500">
                  {item.quantity} x ₦{item.price.toLocaleString()}
                </span>
              </div>
              <span className="font-semibold">₦{(item.price * item.quantity).toLocaleString()}</span>
            </li>
          ))}

          <li className="flex justify-between mt-2 font-semibold border-t pt-2">
            <span>Subtotal</span>
            <span>₦{order.subtotal.toLocaleString()}</span>
          </li>
          <li className="flex justify-between font-semibold">
            <span>Delivery Fee</span>
            <span>₦{order.deliveryFee.toLocaleString()}</span>
          </li>
          <li className="flex justify-between mt-2 font-bold border-t pt-2">
            <span>Total</span>
            <span>₦{order.total.toLocaleString()}</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-md">
        <button
          onClick={() => router.push("/track-orders")}
          className="w-full px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition"
        >
          Track Your Order
        </button>
        <button
          onClick={() => router.push("/")}
          className="w-full px-6 py-3 border border-gray-300 rounded-xl font-semibold hover:bg-gray-100 transition"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
