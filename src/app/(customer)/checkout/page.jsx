"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/app/context/CartContext";
import { Loader2, Bike, MapPin, Clock, DollarSign, TicketPercent, Tag, Wallet, CreditCard } from "lucide-react";
import { verifyDiscount, getVendorById, getWallet } from "@/app/lib/api";
import { createOrderV2 } from "@/app/lib/orderService";
import { transformCartToOrderV2 } from "@/app/lib/orderTransformers";
import Header2 from "@/app/components/App_Header/Header2";
import toast from "react-hot-toast";
import CheckoutPageSkeleton from "@/app/components/skeleton/CheckoutPageSkeleton";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApi } from "@/app/context/ApiContext";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";
import OrderErrorDisplay from "@/app/components/Checkout/OrderErrorDisplay";
import OrderProcessingLoader from "@/app/components/Checkout/OrderProcessingLoader";
import { useCartValidation, CartValidationErrors } from "@/app/components/Cart/CartValidator";
import { useUserStorage } from "@/app/hooks/useUserStorage";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { user: userData, isLoading: isUserLoading } = useUserStorage();
  const [loadingInit, setLoadingInit] = useState(false);
  const [notes, setNotes] = useState({}); // notes per restaurant
  const { baseUrl } = useApi();
  const [isMounted, setIsMounted] = useState(false);

  // V2 API Integration - Enhanced State Management
  const [orderError, setOrderError] = useState(null);
  const [processingStep, setProcessingStep] = useState("validating");

  // Discount State
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [verifyingCode, setVerifyingCode] = useState(false);

  // Wallet State
  const [useWallet, setUseWallet] = useState(false);
  const { data: walletData } = useQuery({
    queryKey: ["userWallet"],
    queryFn: getWallet,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
  const walletBalance = walletData?.wallet?.balance || 0;

  // Cart validation hook
  const { validateCart, validationErrors, isValid } = useCartValidation(cart);

  // Generate ONCE per checkout session — does NOT regenerate
  // on re-renders or retries. Only resets if user navigates
  // away and returns.
  const idempotencyKey = useRef(
    `order_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const defaultAddress = userData?.addresses?.find(a => a.isDefault);

  /* ---------------- CALCULATIONS ---------------- */
  const subtotal = cart.reduce((sum, item) => sum + (item.price_naira || item.price || 0) * item.quantity, 0);

  // Resolution logic for delivery fees
  const [vendorFeesMap, setVendorFeesMap] = useState({});

  useEffect(() => {
    if (cart.length > 0 && isMounted) {
      const uniqueIds = Array.from(new Set(cart.map(item => item.vendorId || item.restaurantId)));
      const fetchFees = async () => {
        const fees = {};
        await Promise.all(uniqueIds.map(async id => {
          try {
            const data = await getVendorById(id);
            const v = data.vendor || data;
            const fee = v.deliveryManagedBy === "vendor"
              ? (v.flatRateDeliveryFee || v.deliveryFee || 0)
              : (v.cityId?.platformDeliveryFee ?? v.deliveryFee ?? 0);
            fees[id] = fee;
          } catch (e) {
            console.error("Fee fetch error:", e);
          }
        }));
        setVendorFeesMap(prev => ({ ...prev, ...fees }));
      };
      fetchFees();
    }
  }, [cart, isMounted]);

  // One delivery fee per restaurant
  const restaurantDeliveryMap = {};
  cart.forEach(item => {
    const vId = item.vendorId || item.restaurantId;
    if (!restaurantDeliveryMap[vId]) {
      // Prioritize the fee already stored in the cart item, fallback to resolved map
      restaurantDeliveryMap[vId] = Number(item.deliveryFee || vendorFeesMap[vId] || 0);
    }
  });

  const deliveryFee = Object.values(restaurantDeliveryMap).reduce((sum, fee) => sum + fee, 0);

  // Calculate final total (UI ONLY - Backend re-validates)
  // If discount applied, use verified total, otherwise local calc
  const finalTotal = appliedDiscount ? appliedDiscount.total : (subtotal + deliveryFee);

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

  /* ---------------- DISCOUNT LOGIC ---------------- */
  const handleVerifyCoupon = async () => {
    if (!couponCode.trim()) return;
    setVerifyingCode(true);
    setAppliedDiscount(null);
    try {
      const payload = {
        code: couponCode,
        subtotal,
        deliveryFee,
        items: cart.map(item => ({
          foodId: item.foodId,
          portionId: item.portionId || item.variantId,
          vendorId: item.vendorId || item.restaurantId,
          quantity: item.quantity,
          storeName: item.storeName,
          price_naira: item.price_naira || item.price
        }))
      };
      const res = await verifyDiscount(payload);
      setAppliedDiscount(res);
      toast.success(`Coupon Applied: ${res.appliedDiscount?.label || 'Success'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid Coupon Code");
      setAppliedDiscount(null);
    } finally {
      setVerifyingCode(false);
    }
  };

  /* ---------------- PAYMENT INITIALIZATION (V2 API) ---------------- */
  const handleInitializePayment = async () => {
    // Clear any previous errors
    setOrderError(null);

    // 1. Validate delivery address
    if (!defaultAddress) {
      toast.error("Please set a default delivery address.", { duration: 1500 });
      setTimeout(() => {
        router.push("/profile/address");
      }, 1500);
      return;
    }

    // 2. Validate cart is not empty
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }


    setLoadingInit(true);

    try {
      // 4. Check if all restaurants are open
      setProcessingStep("checking");
      const uniqueRestaurantIds = Object.keys(restaurantDeliveryMap);

      // Check restaurant open status
      const vendorStatuses = await Promise.all(
        uniqueRestaurantIds.map(async (id) => {
          try {
            const data = await getVendorById(id);
            return { id, vendor: data.vendor || data, success: true };
          } catch (e) {
            console.error(`Failed to fetch vendor ${id}`, e);
            return { id, success: false };
          }
        })
      );

      const closedRestaurants = [];

      // Check for failed vendor fetches (404s)
      const failedVendorFetches = vendorStatuses.filter(res => !res.success);
      if (failedVendorFetches.length > 0) {
        throw new Error("Unable to verify one or more vendors. Please clear your cart and try again as some items may be from unavailable stores.");
      }

      vendorStatuses.forEach((res) => {
        if (!res.success || !res.vendor) return;

        const status = getVendorOpenAndCloseStatus(res.vendor.openingHours);
        if (!status) return;

        const isClosed =
          status.toLowerCase().startsWith("closed") ||
          status.toLowerCase().startsWith("the restaurant has closed");

        if (isClosed) {
          closedRestaurants.push(res.vendor.storeName || "One of the restaurants");
        }
      });

      if (closedRestaurants.length > 0) {
        throw new Error(`Order cannot be placed. The following restaurants are closed: ${closedRestaurants.join(", ")}`);
      }

      // 5. Transform cart data to V2 format
      setProcessingStep("calculating");

      // Use resolved fees for the payload
      const resolvedCart = cart.map(item => ({
        ...item,
        deliveryFee: vendorFeesMap[item.vendorId || item.restaurantId] ?? item.deliveryFee
      }));

      const deliveryAddress = {
        addressLine:  defaultAddress.addressLine
          || defaultAddress.address || "",
        cityName:     defaultAddress.city
          || defaultAddress.cityName || "",
        stateName:    defaultAddress.state
          || defaultAddress.stateName || "",
        name: defaultAddress.name
          || (userData?.firstname
            ? `${userData.firstname} ${userData.lastname || ""}`.trim()
            : "Customer"),
        phone:  defaultAddress.phone
                   || userData?.phone || "",
        // ADD: coordinates if available
        ...(defaultAddress.coordinates?.lat && {
          coordinates: {
            lat: defaultAddress.coordinates.lat,
            lng: defaultAddress.coordinates.lng,
          }
        }),
      };

      const orderPayload = {
        ...transformCartToOrderV2(
          resolvedCart,
          deliveryAddress,
          userData?.phone,
          userData?.email,
          userData
        ),
        idempotencyKey: idempotencyKey.current,
        notes
      };

      // Add Wallet Payment Flag
      if (useWallet) {
        if (walletBalance < finalTotal) {
          throw new Error("Insufficient wallet balance for this transaction.");
        }
        orderPayload.useWallet = true;
      }

      // Inject Discount Code if valid
      if (appliedDiscount && couponCode) {
        orderPayload.discountCode = couponCode;
      }

      console.log("------------------- ORDER PAYLOAD -------------------");
      console.log(JSON.stringify(orderPayload, null, 2));
      console.log("-----------------------------------------------------");

      // 6. Create order using V2 API
      setProcessingStep("preparing");
      const response = await createOrderV2(orderPayload);

      // 7. Handle Response (Redirect to Paystack OR Success)
      const isSuccess = response?.success || response?.status === true || response?.status === "success";

      if (response?.paymentStatus === "paid" || (isSuccess && !response?.authorization_url)) {
        // Wallet / Immediate Payment Success
        clearCart();
        toast.success("Order Placed Successfully! 🎉", { duration: 3000 });

        const paramOrderId = response.order?.orderId || response.orderId;
        setTimeout(() => {
          if (paramOrderId) {
            router.push(`/track-orders/${paramOrderId}`);
          } else {
            router.push("/orders");
          }
        }, 1500);
      } else if (response?.authorization_url) {
        if (response.orderId) {
          sessionStorage.setItem("pendingOrderId", response.orderId);
        }

        clearCart();

        const msg = response.orderId
          ? `Processing Order #${response.orderId}... Redirecting!`
          : "Redirecting to payment...";
        toast.success(msg, { duration: 2000 });

        window.location.href = response.authorization_url;
      } else {
        throw new Error("Payment initialization failed - unknown response status");
      }
    } catch (err) {
      console.error("Order Creation Error:", err);

      // Set error for display
      let errorMessage = "Failed to initialize payment";

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message && !err.message.includes("status code")) {
        errorMessage = err.message;
      }

      // Handle specific wallet errors with actionable guidance
      if (errorMessage.includes("Wallet not found")) {
        toast.error("Wallet not found. Please fund your wallet first.", { duration: 5000 });
        setTimeout(() => router.push("/user/wallet"), 2000);
      } else if (errorMessage.includes("Insufficient wallet balance")) {
        const match = errorMessage.match(/₦([\d,]+)/g);
        const balanceInfo = match ? ` You need ${match[1]} but have ${match[0]}.` : "";
        toast.error(`Insufficient wallet balance.${balanceInfo} Redirecting to wallet...`, { duration: 5000 });
        setTimeout(() => router.push("/user/wallet"), 2500);
      } else if (errorMessage.includes("Email required")) {
        toast.error("Email is required. Please update your profile.", { duration: 5000 });
        setTimeout(() => router.push("/profile"), 2000);
      } else {
        // Show generic toast notification
        toast.error(errorMessage, { duration: 4000 });
      }

      setOrderError(errorMessage);
    } finally {
      setLoadingInit(false);
    }
  };

  /* ---------------- UI STATES ---------------- */
  if (!isMounted || isUserLoading) return <CheckoutPageSkeleton />;

  /* ---------------- JSX ---------------- */
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-32 transition-colors duration-300">
      <Header2 />

      {/* Order Error Display */}
      <OrderErrorDisplay
        error={orderError}
        onRetry={handleInitializePayment}
        onClose={() => setOrderError(null)}
      />

      {/* Processing Loader */}
      {loadingInit && <OrderProcessingLoader currentStep={processingStep} />}

      <div className="max-w-xl mx-auto p-2 space-y-2 pb-8">
        {/* Cart Validation Errors */}
        {validationErrors.length > 0 && (
          <CartValidationErrors
            errors={validationErrors}
            onFixItem={(index) => {
              // Navigate to cart or show item details
              router.push("/orders?activeTab=cart");
            }}
          />
        )}

        {/* Quick Notice */}
        {cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50/40 dark:bg-orange-500/10 backdrop-blur-sm border border-orange-100 dark:border-orange-500/20 text-orange-700 dark:text-orange-400 text-[10px] p-2 rounded-xl flex items-center gap-2"
          >
            <div className="w-1 h-full bg-orange-500 rounded-full" />
            <p>
              You're ordering {cart.length} {cart.length > 1 ? "items" : "item"} from {Object.keys(groupedCart).length}{" "}
              {Object.keys(groupedCart).length > 1 ? "restaurants" : "restaurant"}. Delivery fee is charged once per restaurant.
            </p>
          </motion.div>
        )}

        {/* Address */}
        <div className={`bg-white dark:bg-zinc-900 rounded-2xl md:p-4 p-2 flex gap-3 border transition-all duration-300 ${!defaultAddress ? "border-red-200 dark:border-red-500/50 shadow-red-100 dark:shadow-red-900/10" : "border-zinc-50 dark:border-zinc-800 hover:border-orange-200 dark:hover:border-orange-500/30"}`}>
          <div className={`${!defaultAddress ? "bg-red-50 dark:bg-red-500/10" : "bg-orange-50 dark:bg-orange-500/10"} p-2 rounded-xl h-fit`}>
            <MapPin className={`${!defaultAddress ? "text-red-500" : "text-orange-500"}`} size={20} />
          </div>
          {defaultAddress ? (
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">Delivery Address</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    {defaultAddress.addressLine}, {defaultAddress.city}, {defaultAddress.state}
                  </p>
                </div>
                <button
                  onClick={() => router.push("/profile/address")}
                  className="text-[10px] font-bold text-orange-600 uppercase tracking-wider bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded-lg"
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-2">
              <p className="text-sm font-bold text-red-600">Delivery Address Required</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">You need to set a default delivery address to place an order.</p>
              <button
                onClick={() => router.push("/profile/address")}
                className="mt-1 w-full bg-red-50 dark:bg-red-500/10 text-red-600 py-2 rounded-xl font-bold text-xs uppercase tracking-wider border border-red-100 dark:border-red-500/20 hover:bg-red-100 transition-colors"
              >
                + Add Address
              </button>
            </div>
          )}
        </div>

        {/* Delivery Info */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl md:p-4 p-2 flex gap-3 items-center border border-zinc-50 dark:border-zinc-800 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all duration-300">
          <div className="bg-orange-50 dark:bg-orange-500/10 p-2 rounded-xl">
            <Bike className="text-orange-500" size={20} />
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-white">Delivery Fee</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Charged once per restaurant in your cart</p>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 space-y-3">
          <h3 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-2">
            <CreditCard size={18} className="text-orange-500" /> Payment Method
          </h3>

          {/* Paystack Option */}
          <div
            onClick={() => setUseWallet(false)}
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${!useWallet ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10" : "border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!useWallet ? "border-orange-600" : "border-zinc-300 dark:border-zinc-600"
                }`}>
                {!useWallet && <div className="w-2 h-2 bg-orange-600 rounded-full" />}
              </div>
              <div>
                <p className="font-bold text-sm text-zinc-900 dark:text-white">Pay with Card / Transfer</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Secured by Paystack</p>
              </div>
            </div>
          </div>

          {/* Wallet Option */}
          <div
            onClick={() => {
              if (walletBalance >= finalTotal) setUseWallet(true);
              else toast.error("Insufficient balance for this order");
            }}
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${useWallet ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10" : "border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              } ${walletBalance < finalTotal ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${useWallet ? "border-orange-600" : "border-zinc-300 dark:border-zinc-600"
                }`}>
                {useWallet && <div className="w-2 h-2 bg-orange-600 rounded-full" />}
              </div>
              <div>
                <p className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                  Pay with Wallet <span className="text-orange-600">({walletData ? `₦${walletBalance.toLocaleString()}` : "Loading..."})</span>
                </p>
                {walletBalance < finalTotal && (
                  <p className="text-[10px] text-red-500 font-bold">Insufficient Balance</p>
                )}
              </div>
            </div>
            <Wallet size={18} className={useWallet ? "text-orange-600" : "text-zinc-400 dark:text-zinc-500"} />
          </div>
        </div>

        {/* Items Grouped by Restaurant */}
        {Object.entries(groupedCart).map(([storeName, items]) => {
          const estTime = getEstimatedTime(items);
          return (
            <div key={storeName} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl space-y-3 border border-zinc-100 dark:border-zinc-800 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-50 dark:border-zinc-800/50">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-tight italic">{storeName}</h3>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-col items-end">
                  <span className="flex items-center gap-1 font-bold text-orange-600">
                    ₦{restaurantDeliveryMap[items[0].vendorId || items[0].restaurantId]?.toLocaleString()}
                  </span>
                  {estTime && (
                    <span className="flex items-center gap-1 mt-1 font-medium bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-[10px]">
                      <Clock size={10} className="text-orange-500" /> {estTime.min}-{estTime.max} mins
                    </span>
                  )}
                </div>
              </div>

              {/* Items */}
              {items.map(item => (
                <div key={(item.foodId || '') + (item.portionId || item.variantId || '')} className="flex gap-3 border-b border-b-zinc-50 dark:border-b-zinc-800/50 last:border-0 pb-3 items-center group">
                  <div className="relative overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    <img src={item.image_url || item.image || "/placeholder.jpg"} alt={item.name} className="w-12 h-12 object-cover transition-transform group-hover:scale-110" />
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                    <p className="text-sm text-zinc-900 dark:text-white font-semibold uppercase italic leading-tight break-words">{item.name}</p>
                    {item.portion_label && (
                      <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">{item.portion_label}</p>
                    )}
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate font-bold uppercase tracking-tighter">{item.storeName}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">₦{((item.price_naira || item.price || 0) * item.quantity).toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded-lg">
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
                  className="mt-2 w-full p-3 bg-zinc-50/50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 focus:bg-white dark:focus:bg-zinc-800 transition-all placeholder:text-[10px] placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
                />
              </div>
            </div>
          );
        })}

        {/* Promo Code Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <TicketPercent className="text-orange-500" size={18} />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Promo Code</h3>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm uppercase tracking-wider font-semibold placeholder:normal-case placeholder:font-normal focus:outline-none focus:border-orange-500 transition-colors text-zinc-900 dark:text-zinc-100"
            />
            <button
              onClick={handleVerifyCoupon}
              disabled={verifyingCode || !couponCode}
              className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 dark:hover:bg-white active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifyingCode ? <Loader2 className="animate-spin" size={16} /> : "Apply"}
            </button>
          </div>
          {appliedDiscount && (
            <div className="mt-3 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs p-2.5 rounded-xl flex items-center gap-2 border border-green-100 dark:border-green-500/20">
              <Tag size={14} />
              <span className="font-bold">{appliedDiscount.appliedDiscount?.label} applied!</span>
              <span className="ml-auto font-black">-₦{appliedDiscount.discountAmount.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-zinc-900 dark:bg-zinc-800 rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-1 font-semibold text-zinc-400 uppercase tracking-widest text-[10px]">Subtotal</span>
            <span className="text-white font-medium">₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-1 font-semibold text-zinc-400 uppercase tracking-widest text-[10px]">Delivery Fee</span>
            <span className="text-white font-medium">₦{deliveryFee.toLocaleString()}</span>
          </div>
          {appliedDiscount && (
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1 font-semibold text-green-400 uppercase tracking-widest text-[10px]">Discount</span>
              <span className="text-green-400 font-medium">-₦{appliedDiscount.discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="border-t border-white/10 pt-3 flex justify-between items-center text-lg font-bold">
            <span className="flex items-center gap-1 font-semibold text-white uppercase italic">Total</span>
            <span className="text-orange-500 italic">₦{finalTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Sticky Pay Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 p-2 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-40">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={!defaultAddress ? () => router.push("/profile/address") : handleInitializePayment}
            disabled={loadingInit || cart.length === 0}
            className={`max-w-xl mx-auto w-full py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] ${!defaultAddress ? "bg-red-500 text-white shadow-red-200" : "bg-zinc-950 hover:bg-black text-white"}`}
          >
            {loadingInit ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span className="uppercase tracking-[0.2em]">Processing…</span>
              </>
            ) : !defaultAddress ? (
              <div className="flex items-center justify-center w-full px-6 italic">
                <span className="uppercase tracking-tight">Set Address to Continue</span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full px-8 italic">
                <span className="uppercase tracking-tight text-white/90">Complete Order</span>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                  <span className="text-orange-500 tabular-nums">₦{finalTotal.toLocaleString()}</span>
                </div>
              </div>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
