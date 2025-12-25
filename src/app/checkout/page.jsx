"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/app/context/CartContext";
import { Loader2, Bike, MapPin, Clock, DollarSign } from "lucide-react";
import { createOrder, fetchUser } from "../lib/api";
import Header2 from "../components/App_Header/Header2";
import toast from "react-hot-toast";
import CheckoutPageSkeleton from "../components/skeleton/CheckoutPageSkeleton";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCart();
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loadingInit, setLoadingInit] = useState(false);
  const [notes, setNotes] = useState({}); // notes per restaurant

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
    if (data?.user) setUserData(data.user);
  }, [data]);

  const defaultAddress = userData?.addresses?.find(a => a.isDefault);

  /* ---------------- CALCULATIONS ---------------- */
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // One delivery fee per restaurant
  const restaurantDeliveryMap = {};
  cart.forEach(item => {
    if (!restaurantDeliveryMap[item.restaurantId]) {
      restaurantDeliveryMap[item.restaurantId] = Number(item.deliveryFee || 0);
    }
  });

  const deliveryFee = Object.values(restaurantDeliveryMap).reduce((sum, fee) => sum + fee, 0);
  const total = subtotal + deliveryFee;

  // Group items by restaurant
  const groupedCart = cart.reduce((acc, item) => {
    const store = item.storeName || "Unknown Store";
    if (!acc[store]) acc[store] = [];
    acc[store].push(item);
    return acc;
  }, {});

  const getEstimatedTime = (items) => {
    const mins = items.map(i => i.estimatedDeliveryTime?.min || 0);
    const maxs = items.map(i => i.estimatedDeliveryTime?.max || 0);
    if (!mins.length) return null;
    return { min: Math.min(...mins), max: Math.max(...maxs) };
  };

  /* ---------------- PAYMENT ---------------- */
  const handleInitializePayment = async () => {
    if (!token) return;

    if (!defaultAddress) {
      toast.error("Please set a default delivery address.", { duration: 1500 });
      setTimeout(() => {
        router.push("/profile/address"); // navigate to profile/address page
      }, 1500);
      return;
    }

    if (cart.length === 0) return toast.error("Your cart is empty.");

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
          deliveryFee: item.deliveryFee,
          restaurantId: item.restaurantId,
          metadata: item.metadata || {},
          note: notes[item.storeName] || "",
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

      // console.log(payload);

      const res = await createOrder(token, payload);

      if (res?.authorization_url) window.location.href = res.authorization_url;
      else throw new Error("Payment initialization failed");
    } catch (err) {
      console.error(err);
      toast.error("Payment initialization failed");
    } finally {
      setLoadingInit(false);
    }
  };

  /* ---------------- UI STATES ---------------- */
  if (isLoading || token === null) return <CheckoutPageSkeleton />;

  if (isError)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Failed to load user data ❌
      </div>
    );

  /* ---------------- JSX ---------------- */
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header2 />


      <div className="max-w-xl mx-auto p-2 space-y-3 pb-8">
        {/* Quick Notice */}
        {cart.length > 0 && (
          <div className="bg-orange-50 border-l-4 border-orange-500 text-orange-700 text-xs p-2 rounded">
            You're ordering {cart.length} {cart.length > 1 ? "items" : "item"} from {Object.keys(groupedCart).length}{" "}
            {Object.keys(groupedCart).length > 1 ? "restaurants" : "restaurant"}. Delivery fee is charged once per restaurant.
          </div>
        )}

        {/* Address */}
        <div className="bg-white rounded-2xl md:p-4 p-2 flex gap-3">
          <MapPin className="text-orange-500 mt-1" />
          {defaultAddress ? (
            <div>
              <p className="font-medium text-gray-800">Delivery Address</p>
              <p className="text-xs text-gray-600">
                {defaultAddress.addressLine}, {defaultAddress.city}, {defaultAddress.state}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No default address found</p>
          )}
        </div>

        {/* Delivery Info */}
        <div className="bg-white rounded-2xl md:p-4 p-2 flex gap-3 items-center">
          <Bike className="text-orange-500 mt-1" />
          <div>
            <p className="font-medium text-gray-800">Delivery Fee</p>
            <p className="text-xs text-gray-600">Charged once per restaurant in your cart</p>
          </div>
        </div>

        {/* Items Grouped by Restaurant */}
        {Object.entries(groupedCart).map(([storeName, items]) => {
          const estTime = getEstimatedTime(items);
          return (
            <div key={storeName} className="bg-white p-4 rounded-2xl space-y-2">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-800">{storeName}</h3>
                <div className="text-xs text-gray-500 flex flex-col items-end">
                  <span className="flex items-center gap-1">
                    ₦{restaurantDeliveryMap[items[0].restaurantId].toLocaleString()}
                  </span>
                  {estTime && (
                    <span className="flex items-center gap-1 mt-1">
                      <Clock size={12} className="text-orange-500" /> {estTime.min}-{estTime.max} mins
                    </span>
                  )}
                </div>
              </div>

              {/* Items */}
              {items.map(item => (
                <div key={item.foodId + item.variantId} className="flex gap-3 border-b border-b-gray-100 pb-2 items-center">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div className="flex-1 flex flex-col gap-0.5">
                    <p className="text-sm text-gray-800 truncate">{item.variantName}</p>
                    <p className="text-xs text-gray-600 truncate">{item.storeName}</p>
                    <p className="text-xs text-gray-500">₦{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">x{item.quantity}</span>
                </div>
              ))}

              {/* Notes */}
              <textarea
                placeholder="Add a note for this restaurant (optional)"
                value={notes[storeName] || ""}
                onChange={(e) => setNotes({ ...notes, [storeName]: e.target.value })}
                className="mt-2 w-full p-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>
          );
        })}

        {/* Summary */}
        <div className="bg-white rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-1 font-semibold">Subtotal</span>
            <span>₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-1 font-semibold">Delivery Fee</span>
            <span>₦{deliveryFee.toLocaleString()}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between items-center text-lg font-bold">
            <span className="flex items-center gap-1 font-semibold">Total</span>
            <span className="text-orange-500">₦{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Sticky Pay Button */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 shadow-xl">
        <button
          onClick={handleInitializePayment}
          disabled={loadingInit}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 active:scale-95 transition"
        >
          {loadingInit ? (
            <>
              <Loader2 className="animate-spin" size={20} /> Processing…
            </>
          ) : (
            <>Pay Now ₦{total.toLocaleString()}</>
          )}
        </button>
      </div>
    </div>
  );
}
