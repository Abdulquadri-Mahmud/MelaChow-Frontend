"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/app/context/CartContext";
import { Loader2, Truck, Bike } from "lucide-react";
import { fetchUser, createOrder } from "../lib/api"; // make sure createOrder exists in your api
import Header2 from "../components/App_Header/Header2";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const totalItems = cart.length;

  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);

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

  // Subtotal
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Delivery fee per unique vendor
  const uniqueVendors = [...new Set(cart.map((item) => item.restaurantId))];
  const deliveryFee = uniqueVendors.reduce((sum, vendorId) => {
    const vendorItem = cart.find((item) => item.restaurantId === vendorId);
    return sum + (vendorItem?.deliveryFee || 0);
  }, 0);

  const total = subtotal + deliveryFee;

  if (isLoading || token === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-600" size={32} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Failed to load user data ❌
      </div>
    );
  }

  // PLACE ORDER FUNCTION
  const handlePlaceOrder = async () => {
    if (!token) return;
    setPlacingOrder(true);

    try {
      const orderPayload = {
        items: cart.map((item) => ({
          foodId: item.foodId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
          restaurantId: item.restaurantId,
        })),
        deliveryAddress: defaultAddress,
        deliveryFee,
        phone: userData.phone,
        subtotal,
        total,
      };


      console.log(orderPayload);

    //   const res = await createOrder(orderPayload, token);
    //   console.log("Order created:", res);
    //   clearCart();
    //   alert("Order placed successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
        <Header2/>

        <div className="p-4">
            {/* Delivery address as a sentence */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-4 flex items-center gap-2">
                {defaultAddress ? (
                <>
                    <Truck size={20} className="text-orange-500" />
                    <p className="text-sm text-gray-700">
                        Delivering to {defaultAddress.addressLine}, {defaultAddress.city}, {defaultAddress.state}.
                    </p>
                </>
                ) : (
                <p className="text-sm text-gray-500">
                    No default address found — add one in your profile.
                </p>
                )}
            </div>

            {/* Delivery Info */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-4 flex items-center gap-2">
                <Bike size={20} className="text-orange-500" />
                <p className="text-sm text-gray-700">
                Delivery: {cart[0]?.deliveryType || "N/A"} — ETA:{" "}
                {cart[0]?.estimatedDeliveryTime
                    ? `${cart[0].estimatedDeliveryTime.min}–${cart[0].estimatedDeliveryTime.max} mins`
                    : "N/A"}
                </p>
            </div>

            {/* Order Items */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
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
                    <div className="flex  items-center gap-2">
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
                    </div>
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
                    <span>₦{deliveryFee.toLocaleString()}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₦{total.toLocaleString()}</span>
                </div>
            </div>

            {/* Checkout Button */}
            <div className="fixed bottom-12 left-0 right-0 bg-white p-4 border-t shadow-xl">
                <button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="w-full bg-orange-500 cursor-pointer text-white py-4 rounded-xl font-semibold text-base active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                {placingOrder ? (
                    <>
                    <Loader2 className="animate-spin" size={20} /> Placing Order…
                    </>
                ) : (
                    <>Place Order – ₦{total.toLocaleString()}</>
                )}
                </button>
            </div>
        </div>
    </div>
  );
}
