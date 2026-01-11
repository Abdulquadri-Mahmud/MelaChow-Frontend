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
import { motion } from "framer-motion";
import axios from "axios";
import { useApi } from "../context/ApiContext";
import { getVendorOpenAndCloseStatus } from "../lib/vendor-time/OpenOrClose";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loadingInit, setLoadingInit] = useState(false);
  const [notes, setNotes] = useState({}); // notes per restaurant
  const { baseUrl } = useApi();

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
      // 1. Check if all restaurants are open before proceeding
      const uniqueRestaurantIds = Object.keys(restaurantDeliveryMap);

      for (const restaurantId of uniqueRestaurantIds) {
        try {
          // Fetch vendor foods to get vendor details (including opening hours)
          const vendorRes = await axios.get(`${baseUrl}/vendors/foods/get-foods?vendorId=${restaurantId}`);
          const vendorData = vendorRes.data.data?.[0]?.vendor;

          if (vendorData) {
            const statusInfo = getVendorOpenAndCloseStatus(vendorData.openHours || vendorData.openingHours);
            const isOpen = statusInfo.startsWith("Open now");

            if (!isOpen) {
              toast.error(`${vendorData.storeName} is currently closed. ${statusInfo}`, { duration: 4000 });
              setLoadingInit(false);
              return;
            }
          }
        } catch (err) {
          console.error(`Error checking status for vendor ${restaurantId}:`, err);
          // If we can't check, we might want to proceed or block. Usually safer to let it try to create if check fails.
        }
      }

      // 2. Continue with order creation if all are open
      // Calculate one delivery fee per restaurant for the payload
      const vendorFees = Object.entries(restaurantDeliveryMap).map(([id, fee]) => ({
        restaurantId: id,
        deliveryFee: fee
      }));

      const payload = {
        items: cart.map(item => ({
          foodId: item.foodId,
          variant: {
            name: item.name,
            price: item.price,
            image: item.image, // Optimized to reduce payload size
          },
          price: item.price,
          quantity: item.quantity,
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
        deliveryFee, // Total delivery fee (sum of one fee per restaurant)
        vendorDeliveryFees: vendorFees, // Proportional vendor delivery calculations support
        total,
        email: userData.email,
        referrer: "web", // Include referrer for backend validation
      };

      // console.log(cart);
      // console.log(payload);

      const res = await createOrder(token, payload);

      if (res?.authorization_url) {
        clearCart();
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

  if (isError)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Failed to load user data ❌
      </div>
    );

  /* ---------------- JSX ---------------- */
  return (
    <div className="min-h-screen bg-gray-50/50 pb-32">
      <Header2 />

      <div className="max-w-xl mx-auto p-2 space-y-4 pb-8">
        {/* Quick Notice */}
        {cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50/40 backdrop-blur-sm border border-orange-100 text-orange-700 text-xs p-2 rounded-xl flex items-center gap-2 shadow-sm shadow-orange-100/20"
          >
            <div className="w-1 h-full bg-orange-500 rounded-full" />
            <p>
              You're ordering {cart.length} {cart.length > 1 ? "items" : "item"} from {Object.keys(groupedCart).length}{" "}
              {Object.keys(groupedCart).length > 1 ? "restaurants" : "restaurant"}. Delivery fee is charged once per restaurant.
            </p>
          </motion.div>
        )}

        {/* Address */}
        <div className="bg-white rounded-2xl md:p-4 p-2 flex gap-3 border border-orange-50 shadow-sm hover:border-orange-200 transition-all duration-300">
          <div className="bg-orange-50 p-2 rounded-xl">
            <MapPin className="text-orange-500" size={20} />
          </div>
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
        <div className="bg-white rounded-2xl md:p-4 p-2 flex gap-3 items-center border border-orange-50 shadow-sm hover:border-orange-200 transition-all duration-300">
          <div className="bg-orange-50 p-2 rounded-xl">
            <Bike className="text-orange-500" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-800">Delivery Fee</p>
            <p className="text-xs text-gray-600">Charged once per restaurant in your cart</p>
          </div>
        </div>

        {/* Items Grouped by Restaurant */}
        {Object.entries(groupedCart).map(([storeName, items]) => {
          const estTime = getEstimatedTime(items);
          return (
            <div key={storeName} className="bg-white p-4 rounded-2xl space-y-3 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-50/50">
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-tight italic">{storeName}</h3>
                <div className="text-xs text-gray-500 flex flex-col items-end">
                  <span className="flex items-center gap-1 font-bold text-orange-600">
                    ₦{restaurantDeliveryMap[items[0].restaurantId].toLocaleString()}
                  </span>
                  {estTime && (
                    <span className="flex items-center gap-1 mt-1 font-medium bg-gray-50 px-2 py-0.5 rounded-full text-[10px]">
                      <Clock size={10} className="text-orange-500" /> {estTime.min}-{estTime.max} mins
                    </span>
                  )}
                </div>
              </div>

              {/* Items */}
              {items.map(item => (
                <div key={item.foodId + item.variantId} className="flex gap-3 border-b border-b-gray-50/50 last:border-0 pb-3 items-center group">
                  <div className="relative overflow-hidden rounded-xl">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover transition-transform group-hover:scale-110" />
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <p className="text-sm text-gray-800 truncate font-semibold uppercase italic">{item.variantName}</p>
                    <p className="text-[10px] text-gray-400 truncate font-bold uppercase tracking-tighter">{item.storeName}</p>
                    <p className="text-xs text-gray-500 font-medium">₦{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-50 px-2 py-1 rounded-lg">
                    <span className="text-sm font-black text-orange-600 italic">x{item.quantity}</span>
                  </div>
                </div>
              ))}

              {/* Notes */}
              <div className="pt-2">
                <textarea
                  placeholder="Add a note for this restaurant (optional)"
                  value={notes[storeName] || ""}
                  onChange={(e) => setNotes({ ...notes, [storeName]: e.target.value })}
                  className="mt-2 w-full p-3 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 focus:bg-white transition-all placeholder:text-[10px] placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
                />
              </div>
            </div>
          );
        })}

        {/* Summary */}
        <div className="bg-gray-900 rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-1 font-semibold text-gray-400 uppercase tracking-widest text-[10px]">Subtotal</span>
            <span className="text-white font-medium">₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-1 font-semibold text-gray-400 uppercase tracking-widest text-[10px]">Delivery Fee</span>
            <span className="text-white font-medium">₦{deliveryFee.toLocaleString()}</span>
          </div>
          <div className="border-t border-white/10 pt-3 flex justify-between items-center text-lg font-bold">
            <span className="flex items-center gap-1 font-semibold text-white uppercase italic">Total</span>
            <span className="text-orange-500 italic">₦{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Sticky Pay Button */}
      <div className="fixed bottom-16 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-40">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleInitializePayment}
          disabled={loadingInit}
          className="max-w-xl mx-auto w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-gray-200"
        >
          {loadingInit ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span className="uppercase tracking-widest">Processing…</span>
            </>
          ) : (
            <div className="flex items-center justify-between w-full px-4 italic">
              <span className="uppercase tracking-tight">Complete Order</span>
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-orange-500 rounded-full" />
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>
          )}
        </motion.button>
      </div>
    </div>
  );
}
