"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const defaultAddress = userData?.addresses?.find(a => a.isDefault);

  /* ---------------- CALCULATIONS ---------------- */
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Resolution logic for delivery fees
  const [vendorFeesMap, setVendorFeesMap] = useState({});

  useEffect(() => {
    if (cart.length > 0 && isMounted) {
      const uniqueIds = Array.from(new Set(cart.map(item => item.restaurantId)));
      const fetchFees = async () => {
        const fees = {};
        await Promise.all(uniqueIds.map(async id => {
          try {
            const data = await getVendorById(id);
            const v = data.vendor || data;
            // Delivery fee resolution: vendor-managed vs platform-managed
            const fee = v.deliveryManagedBy === "vendor"
              ? (v.flatRateDeliveryFee || 0)
              : (v.cityId?.platformDeliveryFee ?? 0);
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
    if (!restaurantDeliveryMap[item.restaurantId]) {
      // Use resolved fee if available, else fallback to item.deliveryFee
      restaurantDeliveryMap[item.restaurantId] = vendorFeesMap[item.restaurantId] ?? Number(item.deliveryFee || 0);
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
    setAppliedDiscount(null); // Reset previous
    try {
      const payload = {
        code: couponCode,
        subtotal,
        deliveryFee,
        items: cart.map(item => ({
          foodId: item.foodId,
          variantId: item.variantId,
          restaurantId: item.restaurantId,
          quantity: item.quantity,
          storeName: item.storeName,
          price: item.price
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
      // 4. Check if all restaurants are open (optional - commented out in original)
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
      const notVerifiedRestaurants = []; // Optional: track failures

      // Check for failed vendor fetches (404s)
      const failedVendorFetches = vendorStatuses.filter(res => !res.success);
      if (failedVendorFetches.length > 0) {
        throw new Error("Unable to verify one or more vendors. Please clear your cart and try again as some items may be from unavailable stores.");
      }

      vendorStatuses.forEach((res) => {
        if (!res.success || !res.vendor) return; // Should be caught above, but safety check

        const status = getVendorOpenAndCloseStatus(res.vendor.openingHours);
        if (!status) return; // No status, assume open

        // Check explicit closed messages
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
        deliveryFee: vendorFeesMap[item.restaurantId] ?? item.deliveryFee
      }));

      const orderPayload = transformCartToOrderV2(
        resolvedCart,
        defaultAddress,
        userData.phone,
        userData.email,
        notes
      );

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

      // console.log("V2 Order Payload:", orderPayload);

      // 6. Create order using V2 API
      setProcessingStep("preparing");
      const response = await createOrderV2(orderPayload);

      // console.log("V2 Order Response:", response);

      // 7. Redirect to Paystack payment page
      // 7. Handle Response (Redirect to Paystack OR Success)
      // 7. Handle Response (Redirect to Paystack OR Success)
      // Check for explicit "paid" status OR successful response with no auth URL (Wallet)
      // Backend might return "success: true" OR "status: true"
      const isSuccess = response?.success || response?.status === true || response?.status === "success";

      if (response?.paymentStatus === "paid" || (isSuccess && !response?.authorization_url)) {
        // Wallet / Immediate Payment Success
        clearCart();
        toast.success("Order Placed Successfully! 🎉", { duration: 3000 });

        // Redirect to tracking page if ID exists, else orders list
        const paramOrderId = response.order?.orderId || response.orderId;
        setTimeout(() => {
          if (paramOrderId) {
            router.push(`/track-orders/${paramOrderId}`);
          } else {
            router.push("/orders");
          }
        }, 1500);
      } else if (response?.authorization_url) {
        // ... (Existing Paystack logic) ...
        // Store pending order ID if provided (New Flow)
        if (response.orderId) {
          sessionStorage.setItem("pendingOrderId", response.orderId);
        }

        // Clear cart before redirecting
        clearCart();

        // Show success message with Order ID
        const msg = response.orderId
          ? `Processing Order #${response.orderId}... Redirecting!`
          : "Redirecting to payment...";
        toast.success(msg, { duration: 2000 });

        // Redirect to Paystack
        window.location.href = response.authorization_url;
      } else {
        console.log("Unknown Response:", response); // Debug log
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
    <div className="min-h-screen bg-gray-50/50 pb-32">
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
            className="bg-orange-50/40 backdrop-blur-sm border border-orange-100 text-orange-700 text-[10px] p-2 rounded-xl flex items-center gap-2"
          >
            <div className="w-1 h-full bg-orange-500 rounded-full" />
            <p>
              You're ordering {cart.length} {cart.length > 1 ? "items" : "item"} from {Object.keys(groupedCart).length}{" "}
              {Object.keys(groupedCart).length > 1 ? "restaurants" : "restaurant"}. Delivery fee is charged once per restaurant.
            </p>
          </motion.div>
        )}

        {/* Address */}
        <div className={`bg-white rounded-2xl md:p-4 p-2 flex gap-3 border transition-all duration-300 ${!defaultAddress ? "border-red-200 shadow-red-100" : "border-orange-50 hover:border-orange-200"}`}>
          <div className={`${!defaultAddress ? "bg-red-50" : "bg-orange-50"} p-2 rounded-xl h-fit`}>
            <MapPin className={`${!defaultAddress ? "text-red-500" : "text-orange-500"}`} size={20} />
          </div>
          {defaultAddress ? (
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-800">Delivery Address</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {defaultAddress.addressLine}, {defaultAddress.city}, {defaultAddress.state}
                  </p>
                </div>
                <button
                  onClick={() => router.push("/profile/address")}
                  className="text-[10px] font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2 py-1 rounded-lg"
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-2">
              <p className="text-sm font-bold text-red-600">Delivery Address Required</p>
              <p className="text-xs text-gray-500">You need to set a default delivery address to place an order.</p>
              <button
                onClick={() => router.push("/profile/address")}
                className="mt-1 w-full bg-red-50 text-red-600 py-2 rounded-xl font-bold text-xs uppercase tracking-wider border border-red-100 hover:bg-red-100 transition-colors"
              >
                + Add Address
              </button>
            </div>
          )}
        </div>

        {/* Delivery Info */}
        <div className="bg-white rounded-2xl md:p-4 p-2 flex gap-3 items-center border border-orange-50 hover:border-orange-200 transition-all duration-300">
          <div className="bg-orange-50 p-2 rounded-xl">
            <Bike className="text-orange-500" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-800">Delivery Fee</p>
            <p className="text-xs text-gray-600">Charged once per restaurant in your cart</p>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <CreditCard size={18} className="text-orange-500" /> Payment Method
          </h3>

          {/* Paystack Option */}
          <div
            onClick={() => setUseWallet(false)}
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${!useWallet ? "border-orange-500 bg-orange-50" : "border-gray-100 hover:bg-gray-50"
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!useWallet ? "border-orange-600" : "border-gray-300"
                }`}>
                {!useWallet && <div className="w-2 h-2 bg-orange-600 rounded-full" />}
              </div>
              <div>
                <p className="font-bold text-sm text-gray-800">Pay with Card / Transfer</p>
                <p className="text-[10px] text-gray-500">Secured by Paystack</p>
              </div>
            </div>
          </div>

          {/* Wallet Option */}
          <div
            onClick={() => {
              if (walletBalance >= finalTotal) setUseWallet(true);
              else toast.error("Insufficient balance for this order");
            }}
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${useWallet ? "border-orange-500 bg-orange-50" : "border-gray-100 hover:bg-gray-50"
              } ${walletBalance < finalTotal ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${useWallet ? "border-orange-600" : "border-gray-300"
                }`}>
                {useWallet && <div className="w-2 h-2 bg-orange-600 rounded-full" />}
              </div>
              <div>
                <p className="font-bold text-sm text-gray-800 flex items-center gap-2">
                  Pay with Wallet <span className="text-orange-600">({walletData ? `₦${walletBalance.toLocaleString()}` : "Loading..."})</span>
                </p>
                {walletBalance < finalTotal && (
                  <p className="text-[10px] text-red-500 font-bold">Insufficient Balance</p>
                )}
              </div>
            </div>
            <Wallet size={18} className={useWallet ? "text-orange-600" : "text-gray-400"} />
          </div>
        </div>

        {/* Items Grouped by Restaurant */}
        {Object.entries(groupedCart).map(([storeName, items]) => {
          const estTime = getEstimatedTime(items);
          return (
            <div key={storeName} className="bg-white p-4 rounded-2xl space-y-3 border border-gray-100 hover:shadow-md transition-all duration-300">
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
                    <img src={item.variant?.image || item.image} alt={item.name} className="w-12 h-12 object-cover transition-transform group-hover:scale-110" />
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                    <p className="text-sm text-gray-800 font-semibold uppercase italic leading-tight break-words">{item.variant?.name || item.variantName || item.name}</p>
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

        {/* Promo Code Section */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <TicketPercent className="text-orange-500" size={18} />
            <h3 className="text-sm font-bold text-gray-800">Promo Code</h3>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm uppercase tracking-wider font-semibold placeholder:normal-case placeholder:font-normal focus:outline-none focus:border-orange-500 transition-colors"
            />
            <button
              onClick={handleVerifyCoupon}
              disabled={verifyingCode || !couponCode}
              className="bg-gray-900 text-white px-5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifyingCode ? <Loader2 className="animate-spin" size={16} /> : "Apply"}
            </button>
          </div>
          {appliedDiscount && (
            <div className="mt-3 bg-green-50 text-green-700 text-xs p-2.5 rounded-xl flex items-center gap-2 border border-green-100">
              <Tag size={14} />
              <span className="font-bold">{appliedDiscount.appliedDiscount?.label} applied!</span>
              <span className="ml-auto font-black">-₦{appliedDiscount.discountAmount.toLocaleString()}</span>
            </div>
          )}
        </div>

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
        <div className="fixed bottom-16 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-40">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={!defaultAddress ? () => router.push("/profile/address") : handleInitializePayment}
            disabled={loadingInit || cart.length === 0}
            className={`max-w-xl mx-auto w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg ${!defaultAddress ? "bg-red-500 text-white shadow-red-200" : "bg-gray-900 text-white shadow-gray-200"}`}
          >
            {loadingInit ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span className="uppercase tracking-widest">Processing…</span>
              </>
            ) : !defaultAddress ? (
              <div className="flex items-center justify-center w-full px-4 italic">
                <span className="uppercase tracking-tight">Set Address to Continue</span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full px-4 italic">
                <span className="uppercase tracking-tight">Complete Order</span>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 bg-orange-500 rounded-full" />
                  <span>₦{finalTotal.toLocaleString()}</span>
                </div>
              </div>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
