"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/app/context/CartContext";
import { Loader2, Bike, MapPin, Clock, DollarSign, ShoppingBag } from "lucide-react";
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

      <div className="max-w-xl mx-auto px-4 py-6 space-y-6 pb-20">
        {/* Immersive Header Fragment */}
        <div className="flex flex-col gap-1 mb-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">Checkout</h2>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-white italic uppercase tracking-tighter">Review & Pay</h3>
        </div>

        {/* High-Fidelity Quick Notice */}
        {cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-4 rounded-[28px] flex items-center gap-4 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/20 rounded-full blur-2xl -translate-y-12 translate-x-12" />
            <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-tight leading-relaxed opacity-90">
              You're ordering {cart.length} {cart.length > 1 ? "items" : "item"} from {Object.keys(groupedCart).length}{" "}
              {Object.keys(groupedCart).length > 1 ? "restaurants" : "restaurant"}.
            </p>
          </motion.div>
        )}

        {/* Address & Delivery Cards */}
        <div className="grid grid-cols-1 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-[32px] p-4 flex gap-4 border border-zinc-100 dark:border-zinc-800 shadow-sm"
          >
            <div className="bg-orange-50 dark:bg-orange-500/10 p-3 rounded-2xl flex-shrink-0">
              <MapPin className="text-orange-600" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-none mb-1">Delivery Address</p>
              {defaultAddress ? (
                <p className="text-xs font-black text-zinc-900 dark:text-white truncate uppercase italic">
                  {defaultAddress.addressLine}, {defaultAddress.city}
                </p>
              ) : (
                <p className="text-xs text-rose-500 font-black uppercase italic">No default address found</p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-[32px] p-4 flex gap-4 border border-zinc-100 dark:border-zinc-800 shadow-sm"
          >
            <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl flex-shrink-0">
              <Bike className="text-zinc-400" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-none mb-1">Delivery Policy</p>
              <p className="text-xs font-black text-zinc-900 dark:text-white uppercase italic">Charged once per restaurant</p>
            </div>
          </motion.div>
        </div>

        {/* Sub-Section Title */}
        <div className="flex items-center gap-3 pt-2">
          <div className="w-1.5 h-6 bg-orange-600 rounded-full" />
          <h3 className="text-lg font-black text-zinc-900 dark:text-white italic uppercase tracking-tighter">Your Items</h3>
        </div>

        {/* Items Grouped by Restaurant */}
        {Object.entries(groupedCart).map(([storeName, items]) => {
          const estTime = getEstimatedTime(items);
          return (
            <motion.div
              key={storeName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 p-5 rounded-[40px] space-y-4 border border-zinc-100 dark:border-zinc-800 shadow-sm"
            >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-50 dark:border-zinc-800">
                <div>
                  <h3 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-widest italic">{storeName}</h3>
                  {estTime && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock size={10} className="text-orange-500" />
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{estTime.min}-{estTime.max} MINS</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded-lg uppercase tracking-tight">
                    ₦{restaurantDeliveryMap[items[0].restaurantId].toLocaleString()} DEL
                  </span>
                </div>
              </div>

              {/* Items */}
              {items.map(item => (
                <div key={item.foodId + item.variantId} className="flex gap-4 items-center group">
                  <div className="relative overflow-hidden rounded-2xl w-14 h-14 flex-shrink-0 bg-zinc-50 dark:bg-zinc-800">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-black text-zinc-900 dark:text-white truncate uppercase italic leading-tight">{item.variantName}</p>
                      <p className="text-xs font-black text-zinc-900 dark:text-white tabular-nums">₦{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Quantity: {item.quantity}</p>
                  </div>
                </div>
              ))}

              {/* Notes */}
              <div className="pt-2">
                <textarea
                  placeholder="Special instructions or notes..."
                  value={notes[storeName] || ""}
                  onChange={(e) => setNotes({ ...notes, [storeName]: e.target.value })}
                  className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-xs outline-none focus:border-orange-500/50 transition-all placeholder:text-[9px] placeholder:font-black placeholder:uppercase placeholder:tracking-[0.2em] resize-none h-20"
                />
              </div>
            </motion.div>
          );
        })}

        {/* Sophisticated Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-[40px] p-8 space-y-4 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-600" />
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Merchandise Subtotal</span>
              <span className="text-sm font-black tabular-nums">₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Delivery Service</span>
              <span className="text-sm font-black text-orange-500 tabular-nums">+₦{deliveryFee.toLocaleString()}</span>
            </div>
          </div>
          <div className="border-t border-white/10 dark:border-zinc-100 pt-6 flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-1 leading-none">Total Payment</p>
              <h4 className="text-4xl font-black italic tracking-tighter leading-none">₦{total.toLocaleString()}</h4>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black uppercase tracking-widest bg-white/10 dark:bg-zinc-900/10 px-3 py-1.5 rounded-xl">
                Secure Link
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="fixed bottom-17 left-0 right-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border-t border-zinc-100 dark:border-zinc-800 p-3 z-40">
        <div className="max-w-2xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleInitializePayment}
            disabled={loadingInit}
            className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 h-16 rounded-[24px] font-black text-sm flex items-center justify-between px-6 active:scale-95 transition-all shadow-2xl relative overflow-hidden group"
          >
            {loadingInit ? (
              <div className="flex items-center justify-center w-full gap-3">
                <Loader2 className="animate-spin" size={20} />
                <span className="uppercase tracking-[0.3em] font-black italic">Verifying...</span>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Pay with Paystack</span>
                  <span className="text-lg font-black italic uppercase tracking-tighter">Complete Order</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-[1px] h-8 bg-white/20 dark:bg-zinc-200" />
                  <div className="flex items-center gap-2 bg-orange-600 dark:bg-orange-500 px-4 py-2 rounded-xl text-white shadow-lg">
                    <span className="text-sm font-black italic">₦{total.toLocaleString()}</span>
                  </div>
                </div>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
