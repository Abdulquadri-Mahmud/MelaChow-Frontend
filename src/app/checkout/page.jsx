"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/app/context/CartContext";
import { Loader2, Bike, MapPin } from "lucide-react";
import { createOrder, fetchUser } from "../lib/api";
import Header2 from "../components/App_Header/Header2";
import toast, { Toaster } from "react-hot-toast";
import CheckoutPageSkeleton from "../components/skeleton/CheckoutPageSkeleton";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCart();

  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loadingInit, setLoadingInit] = useState(false);

  /* ---------------- AUTH TOKEN ---------------- */

  useEffect(() => {
    setToken(localStorage.getItem("userToken"));
  }, []);

  /* ---------------- FETCH USER ---------------- */

  const { data, isLoading, isError } = useQuery({
    queryKey: ["userProfile", token],
    queryFn: () => fetchUser(token),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (data?.user) {
      setUserData(data.user);
    }
  }, [data]);

  const defaultAddress = userData?.addresses?.find(a => a.isDefault);

  /* ---------------- CALCULATIONS ---------------- */

  // Subtotal
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // ✅ One delivery fee per restaurant
  const restaurantDeliveryMap = {};
  cart.forEach(item => {
    if (!restaurantDeliveryMap[item.restaurantId]) {
      restaurantDeliveryMap[item.restaurantId] = Number(item.deliveryFee || 0);
    }
  });

  const deliveryFee = Object.values(restaurantDeliveryMap).reduce(
    (sum, fee) => sum + fee,
    0
  );

  const total = subtotal + deliveryFee;

  /* ---------------- PAYMENT ---------------- */

  const handleInitializePayment = async () => {
    if (!token) return;

    if (!defaultAddress) {
      return toast.error("Please set a default delivery address.");
    }

    if (cart.length === 0) {
      return toast.error("Your cart is empty.");
    }

    setLoadingInit(true);

    try {
      const payload = {
        items: cart.map(item => ({
          foodId: item.foodId,
          variant: {
            name: item.name,
            price: item.price,
            image: item.image || "",
          },
          price: item.price,
          quantity: item.quantity,
          deliveryFee: item.deliveryFee, // ✅ backend groups by restaurant
          restaurantId: item.restaurantId,
          metadata: item.metadata || {},
        })),
        deliveryAddress: {
          addressLine: defaultAddress.addressLine,
          city: defaultAddress.city,
          state: defaultAddress.state,
          label: defaultAddress.label || "Home",
          phone: defaultAddress.phone || userData.phone,
        },
        phone: userData.phone,
        subtotal,
        deliveryFee,
        total,
        email: userData.email,
      };

      const res = await createOrder(token, payload);

      if (res?.authorization_url) {
        window.location.href = res.authorization_url;
      } else {
        throw new Error("Payment initialization failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Payment initialization failed");
    } finally {
      setLoadingInit(false);
    }
  };

  /* ---------------- UI STATES ---------------- */

  if (isLoading || token === null) return <CheckoutPageSkeleton />;

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Failed to load user data ❌
      </div>
    );
  }

  /* ---------------- JSX ---------------- */

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header2 />
      <Toaster />

      <div className="max-w-xl mx-auto p-2 space-y-2">

        {/* Address */}
        <div className="bg-white rounded-2xl md:p-4 p-2 flex gap-3">
          <MapPin className="text-orange-500 mt-1" />
          {defaultAddress ? (
            <div>
              <p className="font-medium text-gray-800">Delivery Address</p>
              <p className="text-xs text-gray-600">
                {defaultAddress.addressLine}, {defaultAddress.city},{" "}
                {defaultAddress.state}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No default address found</p>
          )}
        </div>

        {/* Delivery info */}
        <div className="bg-white rounded-2xl md:p-4 p-2 flex gap-3">
          <Bike className="text-orange-500 mt-1" />
          <div>
            <p className="font-medium text-gray-800">Delivery Fee</p>
            <p className="text-xs text-gray-600">
              Charged once per restaurant in your cart
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl md:p-4 p-2">
          <h3 className="font-semibold text-gray-800 mb-3">Your Items</h3>

          {cart.map(item => (
            <div
              key={`${item.foodId}-${item.variantId || ""}`}
              className="flex gap-3 mb-4 last:mb-0"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 rounded-xl object-cover"
              />

              <div className="flex-1">
                <p className="font-medium text-gray-800">{item.name}</p>

                {item.metadata?.portionSize && (
                  <p className="text-xs text-gray-500">
                    Portion: {item.metadata.portionSize}
                  </p>
                )}

                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">
                    x{item.quantity}
                  </span>
                  <span className="font-semibold">
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Order Summary</h3>

          <div className="flex justify-between text-sm mb-2">
            <span>Subtotal</span>
            <span>₦{subtotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-sm mb-2">
            <span>Delivery Fee</span>
            <span>₦{deliveryFee.toLocaleString()}</span>
          </div>

          <hr className="my-3" />

          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-orange-500">
              ₦{total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Pay Button */}
      <div className="fixed bottom-14 left-0 right-0 bg-white border-t p-4 shadow-xl">
        <button
          onClick={handleInitializePayment}
          disabled={loadingInit}
          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:scale-95 transition"
        >
          {loadingInit ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Processing…
            </>
          ) : (
            <>Pay Now ₦{total.toLocaleString()}</>
          )}
        </button>
      </div>
    </div>
  );
}
