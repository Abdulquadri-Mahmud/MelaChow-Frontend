"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "../context/CartContext";
import { fetchUser, verifyPayment } from "../lib/api";

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const { cart, clearCart } = useCart();
  const totalItems = cart.length;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);

  // 1️⃣ Get token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("userToken");
    setToken(storedToken || null);
  }, []);

  // 2️⃣ Fetch user data
  const { data, isLoading: userLoading, isError } = useQuery({
    queryKey: ["userProfile", token],
    queryFn: () => fetchUser(token),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (data?.user) setUserData(data.user);
  }, [data]);

  // 3️⃣ Verify payment
  useEffect(() => {
    if (!reference || !token || !userData) return;

    const defaultAddress = userData.addresses?.find(addr => addr.isDefault);
    if (!defaultAddress) {
      toast.error("No default delivery address found");
      setLoading(false);
      return;
    }

    const confirmPayment = async () => {
      setLoading(true);
      try {
        const res = await verifyPayment(token, reference, {
          items: cart,
          deliveryFee: 800, // or compute dynamically
          deliveryAddress: defaultAddress,
          phone: userData.phone || defaultAddress.phone,
        });

        if (res?.order) {
          setOrder(res.order);
          clearCart(); // clear cart after successful order
        } else {
          toast.error(res?.message || "Payment verification failed");
        }
      } catch (err) {
        console.error(err);
        toast.error("Payment verification failed");
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [reference, token, userData, cart, clearCart]);

  // 4️⃣ Loading state
  if (loading || userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Toaster />
        <Loader2 className="animate-spin" size={40} />
        <p className="mt-4 text-gray-700">Verifying payment...</p>
      </div>
    );
  }

  // 5️⃣ Failed verification
  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Toaster />
        <p className="text-red-500 font-semibold">Payment verification failed.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const deliveryAddress = order.deliveryAddress;

  // 6️⃣ Success page
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Toaster />
      <CheckCircle2 className="text-green-500 w-20 h-20 mb-6" />
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h1>
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
        <ul className="text-gray-700 space-y-2">
          {order.items.map(item => (
            <li key={item._id} className="flex justify-between">
              <div className="flex flex-col">
                <span className="font-medium">
                  {item.foodId?.name || "Item"} {item.variantId?.name ? `(${item.variantId.name})` : ""}
                </span>
                <span className="text-sm text-gray-500">{item.quantity} x ₦{item.price.toLocaleString()}</span>
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

        <p className="mt-4 text-sm text-gray-500">
          Estimated delivery time: 25-40 mins
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-md">
        <button
          onClick={() => router.push("/orders")}
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
