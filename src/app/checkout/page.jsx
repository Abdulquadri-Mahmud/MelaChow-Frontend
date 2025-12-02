"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/app/context/CartContext";
import { Loader2, Truck, Bike } from "lucide-react";
import { createOrder, fetchUser } from "../lib/api"; 
import Header2 from "../components/App_Header/Header2";
import toast, { Toaster } from "react-hot-toast";
import CheckoutPageSkeleton from "../components/skeleton/CheckoutPageSkeleton";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const totalItems = cart.length;

  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loadingInit, setLoadingInit] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("userToken");
    setToken(storedToken || null);
  }, []);

  // Fetch user profile
  const { data, isLoading, isError } = useQuery({
    queryKey: ["userProfile", token],
    queryFn: () => fetchUser(token),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (data?.user) {
      setUserData(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    }
  }, [data]);

  const defaultAddress = userData?.addresses?.find((addr) => addr.isDefault);

  // Add delivery fee
  const DELIVERY_FEE = 800;

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const total = subtotal + DELIVERY_FEE;

  if (isLoading || token === null) {
    return <CheckoutPageSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Failed to load user data ❌
      </div>
    );
  }

  // 🟠 INITIALIZE PAYMENT FUNCTION
  const handleInitializePayment = async () => {
    if (!token) return;
    if (!defaultAddress) {
      return toast.error("Please set a default delivery address.");
    }

    setLoadingInit(true);

    try {
      // Transform cart into backend-friendly items
      const itemsPayload = cart.map((item) => ({
        foodId: item.foodId,
        variantId: item.variantId,
        price: item.price,
        quantity: item.quantity,
        restaurantId: item.restaurantId,
        metadata: item.metadata || {},
      }));

      const payload = {
        items: itemsPayload,
        deliveryAddress: {
          addressLine: defaultAddress.addressLine,
          city: defaultAddress.city,
          state: defaultAddress.state,
          label: defaultAddress.label || "Home",
          phone: defaultAddress.phone || userData.phone,
        },
        phone: userData.phone,
        subtotal,
        deliveryFee: DELIVERY_FEE,
        total,
        email: userData.email,
      };

      console.log(payload);

      // Call backend to initialize Paystack payment
      const res = await createOrder(token, payload);

      if (res?.authorization_url) {
        // Redirect user to Paystack
        window.location.href = res.authorization_url;
      } else {
        toast.error("Unable to start payment");
      }
    } catch (err) {
      console.error(err);
      toast.error("Payment initialization failed");
    } finally {
      setLoadingInit(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <Header2 />
      <Toaster />

      <div className="p-4">
        {/* Delivery address */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-3 flex items-center gap-2">
          {defaultAddress ? (
            <>
              <Truck size={20} className="text-orange-500" />
              <p className="text-sm text-gray-700">
                Delivering to {defaultAddress.addressLine}, {defaultAddress.city},{" "}
                {defaultAddress.state}.
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              No default address found — add one in your profile.
            </p>
          )}
        </div>

        {/* Delivery Info */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-3 flex items-center gap-2">
          <Bike size={20} className="text-orange-500" />
          <p className="text-sm text-gray-700">
            Delivery Fee: ₦{DELIVERY_FEE.toLocaleString()}
          </p>
        </div>

        {/* Order Items */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-3">
          <h3 className="font-semibold text-gray-800 mb-3">Items</h3>
          {cart.map((item) => (
            <div key={item.foodId + item.variantId} className="flex gap-3 mb-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-500">{item.variantName}</p>
                {item.metadata?.portionSize && (
                  <p className="text-xs text-gray-500">
                    Portion: {item.metadata.portionSize}
                  </p>
                )}
                {item.metadata?.spiceLevel && (
                  <p className="text-xs text-gray-500">
                    Spice Level: {item.metadata.spiceLevel}
                  </p>
                )}
                <p className="font-semibold mt-1">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <h3 className="font-semibold text-gray-800 mb-2">Order Summary</h3>
          <div className="flex justify-between text-sm mb-2">
            <span>Subtotal ({totalItems} items)</span>
            <span>₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span>Delivery Fee</span>
            <span>₦{DELIVERY_FEE.toLocaleString()}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Pay Button */}
        <div className="fixed bottom-12 left-0 right-0 bg-white p-4 border-t shadow-xl">
          <button
            onClick={handleInitializePayment}
            disabled={loadingInit}
            className="w-full bg-orange-500 cursor-pointer text-white py-4 rounded-xl font-semibold text-base active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loadingInit ? (
              <>
                <Loader2 className="animate-spin" size={20} /> Initializing…
              </>
            ) : (
              <>Pay ₦{total.toLocaleString()}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
