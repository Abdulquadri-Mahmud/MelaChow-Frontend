"use client";

import React, { useEffect, useState, useRef } from "react";

import axios from "axios";
import { Clock, Truck, Package, Home, CheckCircle, Star, Phone, Bike, Copy, RefreshCw, MapPin, CreditCard } from "lucide-react";
import { useApi } from "@/app/context/ApiContext";
import { useParams, useRouter } from "next/navigation";
import Header2 from "../App_Header/Header2";
import OrderTrackingSkeleton from "../skeleton/OrderTrackingSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import ReviewModal from "@/app/modals/ReviewModal";
import { useOrderTracking } from "@/app/hooks/useOrderTracking";
import toast from "react-hot-toast";
import { verifyPaymentV2 } from "@/app/lib/orderService";
import customerApi from "@/app/lib/customerApi";

const statusSteps = [
  {
    key: "pending",
    label: "Order Placed",
    subtitle: "We've received your order",
    description: "Your order has been received and is waiting for restaurant confirmation.",
    icon: Clock
  },
  {
    key: "accepted",
    label: "Confirmed",
    subtitle: "Restaurant accepted",
    description: "The restaurant has confirmed your order and will start preparing soon.",
    icon: CheckCircle
  },
  {
    key: "preparing",
    label: "Preparing",
    subtitle: "Kitchen is busy",
    description: "The restaurant is preparing your delicious meal with care.",
    icon: Package
  },
  {
    key: "ready_for_pickup",
    label: "Ready",
    subtitle: "Food is ready",
    description: "Your order is ready and waiting for the delivery rider.",
    icon: CheckCircle
  },
  {
    key: "rider_assigned",
    label: "Rider Assigned",
    subtitle: "Driver on the way",
    description: "A delivery rider has been assigned and is heading to the restaurant.",
    icon: Truck
  },
  {
    key: "out_for_delivery",
    label: "On the way",
    subtitle: "Rider is heading to you",
    description: "Our delivery partner has picked up your order and is en route.",
    icon: Truck
  },
  {
    key: "delivered",
    label: "Delivered",
    subtitle: "Hope you enjoy it!",
    description: "Your meal has been dropped off. Thank you for using MelaChow!",
    icon: Home
  },
];

export default function OrderTracking() {
  const { orderId } = useParams();
  const router = useRouter();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedFoodForReview, setSelectedFoodForReview] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [showReviewBanner, setShowReviewBanner] = useState(false);
  const [hasAutoPrompted, setHasAutoPrompted] = useState(false);
  const [riderLocation, setRiderLocation] = useState(null);
  const reviewTimerRef = useRef(null);

  const { baseUrl } = useApi();

  const copyOrderId = async () => {
    const value = orderData?.orderId || orderId;
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      toast.success("Order ID copied");
    } catch {
      toast.error("Unable to copy order ID");
    }
  };

  const handleVerifyPayment = async () => {
    if (!orderData?.paymentReference) {
      const msg = "No payment reference found for this order.";
      setVerificationError(msg);
      toast.error(msg);
      return;
    }

    setIsVerifyingPayment(true);
    setVerificationError("");
    setVerificationMessage("Retrying payment verification...");

    try {
      const res = await verifyPaymentV2(orderData.paymentReference);
      const updatedOrder = res.order;

      if (!updatedOrder) {
        const msg = "Payment verified but order details were not returned.";
        setVerificationError(msg);
        toast.error(msg);
        return;
      }

      setOrderData((prev) => ({ ...prev, ...updatedOrder }));
      setVerificationMessage("Payment verified successfully.");
      toast.success(res.message || "Payment verification succeeded!");
    } catch (error) {
      if (error.status === 401) {
        const msg = "Session expired. Please log in to complete verification.";
        setVerificationError(msg);
        toast.error(msg);
        return;
      }

      const message = !navigator.onLine
        ? "You are currently offline. Reconnect and retry verification."
        : error.code === "PAYMENT_FAILED"
        ? error.message || "Payment was not successful."
        : error.response?.status >= 500
        ? "Unable to verify payment right now. Please try again shortly."
        : error.message || "Payment verification failed.";

      setVerificationError(message);
      toast.error(message);
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order? Your funds will be automatically refunded to your MelaChow wallet.")) return;

    setIsCancelling(true);
    try {
      const response = await customerApi.patch(`/orders/${orderData._id}/cancel`);
      
      if (response.data.success) {
        toast.success("Order cancelled and funds refunded!");
        setOrderData(prev => ({ ...prev, orderStatus: 'cancelled' }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  // Real-time tracking hook
  const { onStatusUpdate, onLocationUpdate } = useOrderTracking(orderId);

  useEffect(() => {
    // Listen for real-time status updates
    onStatusUpdate((data) => {
      console.log('Real-time status update:', data.status);
      setOrderData(prev => prev ? { 
        ...prev, 
        orderStatus: data.status,
        riderId: data.rider || prev.riderId,
        riderAssignment: data.rider
          ? { ...(prev.riderAssignment || {}), rider: data.rider }
          : prev.riderAssignment,
        deliveryOtp: data.deliveryOtp || prev.deliveryOtp // ✅ Update OTP if provided
      } : null);

      // Optionally show a toast
      const statusLabel = statusSteps.find(s => s.key === data.status)?.label || data.status;
      toast.success(`Order Status: ${statusLabel}`, {
        icon: '🚚',
        style: {
          borderRadius: '16px',
          background: '#333',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 'bold'
        },
      });
    });

    // Listen for real-time location updates (for future map integration)
    onLocationUpdate((data) => {
      console.log('Real-time location update:', data.location);
      setRiderLocation(data.driverLocation || data.location || data);
    });
  }, [onStatusUpdate, onLocationUpdate]);

  // ─── Auto-trigger review banner 3s after delivery ────────────────────────────
  useEffect(() => {
    if (!orderData || hasAutoPrompted) return;
    const isDelivered = ['delivered', 'completed'].includes(orderData.orderStatus);
    if (!isDelivered) return;

    // Check if customer already reviewed / dismissed for this order
    const dismissed = localStorage.getItem(`review_prompted_${orderId}`);
    if (dismissed) return;

    // Auto-show banner after 3 seconds
    reviewTimerRef.current = setTimeout(() => {
      setShowReviewBanner(true);
      setHasAutoPrompted(true);
    }, 3000);

    return () => clearTimeout(reviewTimerRef.current);
  }, [orderData?.orderStatus, orderId, hasAutoPrompted]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await customerApi.get(`/orders/${orderId}`);
        setOrderData(res.data.order);
        // OTP might be in the root of response from getSingleOrder update
        if (res.data.deliveryOtp) {
          setOrderData(prev => ({ ...prev, deliveryOtp: res.data.deliveryOtp }));
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch order details");
      } finally {
        setLoading(false);
      }
    };

    if (!orderId) return undefined;
    fetchOrder();
    const poll = window.setInterval(fetchOrder, 30000);
    return () => window.clearInterval(poll);
  }, [orderId, baseUrl]);

  const assignedRider = orderData?.riderId && typeof orderData.riderId === "object"
    ? orderData.riderId
    : orderData?.riderAssignment?.rider || null;

  if (loading)
    return (
      <>
        <Header2 />
        <OrderTrackingSkeleton />
      </>
    );
  if (error)
    return <div className="md:p-6 p-2 text-center text-red-500 font-medium">{error}</div>;
  if (!orderData)
    return <div className="md:p-6 p-2 text-center text-zinc-600 dark:text-zinc-400 font-medium">No order found</div>;

  const items = Array.isArray(orderData.items) ? orderData.items : [];
  const restaurantNames = [...new Set(items.map((item) => item.restaurantName || item.storeName || item.vendorName).filter(Boolean))];
  const { deliveryAddress, subtotal, deliveryFee, serviceFee, total, orderStatus, userId, deliveryOtp, paymentStatus, paymentReference } = orderData;
  const formatMoney = (value) => `₦${Number(value || 0).toLocaleString()}`;
  const promoSaved = Number(
    orderData.freeDeliveryPromo?.originalDeliveryFee ||
    orderData.vendorDeliveryPromo?.originalDeliveryFee ||
    0
  );
  const promoWaivedDelivery = Number(deliveryFee || 0) === 0 && promoSaved > 0;
  const deliveryAddressText = [
    deliveryAddress?.addressLine || deliveryAddress?.address,
    [deliveryAddress?.cityName || deliveryAddress?.city, deliveryAddress?.stateName || deliveryAddress?.state].filter(Boolean).join(", "),
  ].filter(Boolean).join(", ");
  const paymentMethodValue = orderData.paymentMethod || orderData.payment_method || orderData.payment?.method;
  const paymentMethod = typeof paymentMethodValue === "string" ? paymentMethodValue : paymentMethodValue?.name || paymentMethodValue?.type;
  const orderPlacedAt = orderData.createdAt ? new Date(orderData.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Just now";
  const discountAmount = Number(orderData.discountAmount || orderData.discount_amount || orderData.couponDiscount || 0);
  const progressStatus = orderStatus === "completed" ? "delivered" : orderStatus === "processing" ? "preparing" : orderStatus;
  const currentStepIndex = Math.max(0, statusSteps.findIndex((s) => s.key === progressStatus));
  const showPaymentRetry = paymentReference && paymentStatus !== "paid" && orderStatus !== "cancelled";

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen font-display pb-20">
      <Header2 />

      {/* Dynamic Map Header Section */}
      <div className="relative h-[280px] w-full overflow-hidden bg-orange-50 dark:bg-orange-950/10 sm:h-[320px]">
        {/* Premium Map Stylized Pattern */}
        <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.1" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
            <path d="M 0 50 C 20 40, 40 60, 60 40 S 80 60, 100 50" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
            <path d="M 20 0 L 20 100 M 50 0 L 50 100 M 80 0 L 80 100" fill="none" stroke="currentColor" strokeWidth="0.1" />
          </svg>
        </div>

        {/* Floating Elements for "Map" Feel */}
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-orange-400/5 dark:bg-orange-500/10 rounded-full blur-3xl"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center -translate-y-4 pt-5">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            {/* Center Pulse */}
            <div className="absolute inset-0 animate-ping bg-orange-500/20 rounded-full scale-110" />
            <div className="absolute inset-0 animate-pulse bg-orange-500/10 rounded-full scale-150" />

            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border-2 border-white bg-white shadow-xl shadow-orange-500/20 dark:border-zinc-800 dark:bg-zinc-900 sm:h-24 sm:w-24">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-90" />
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="z-10 text-white"
              >
                {['delivered', 'completed'].includes(orderStatus) ? (
                  <CheckCircle size={36} strokeWidth={1.8} />
                ) : (
                  <Truck size={36} strokeWidth={1.8} />
                )}
              </motion.div>

              {/* Glossy Effect */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-center"
          >
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white sm:text-2xl">
              {orderStatus === 'cancelled' ? 'Order Cancelled' : statusSteps[currentStepIndex]?.label}
            </h2>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-zinc-400">Live updates enabled</p>
            </div>
          </motion.div>
        </div>

        {/* Top Actions */}
        <div className="absolute left-3 right-3 top-3 z-10 flex flex-wrap items-center justify-between gap-2 sm:left-5 sm:right-5 sm:top-5">
          <div className="rounded-full border border-white/50 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/80">
            <span className="text-[9px] font-semibold uppercase text-orange-600">
              {orderStatus === 'out_for_delivery' ? 'Arriving Shortly' : 
               orderStatus === 'delivered' ? 'Order Arrived' :
               orderStatus === 'ready_for_pickup' ? 'Assigning Rider' : 'Tracking Active'}
            </span>
          </div>
          {orderStatus === 'pending' && (
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-[9px] font-semibold uppercase text-red-600 shadow-sm transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/30"
            >
              {isCancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          )}

          <button
            onClick={() => {
              const isDelivered = ['delivered', 'completed'].includes(orderStatus);
              if (!isDelivered) return;
              if (orderData?.items?.length > 0) {
                setSelectedFoodForReview(orderData.items[0]);
                setIsReviewModalOpen(true);
                setShowReviewBanner(false);
              }
            }}
            className={`rounded-full border border-white/50 bg-white/80 px-3 py-1.5 text-[9px] font-semibold uppercase shadow-sm backdrop-blur-md transition-colors dark:border-zinc-800/50 dark:bg-zinc-900/80 ${
              ['delivered', 'completed'].includes(orderStatus)
                ? 'text-orange-600 hover:text-orange-700'
                : 'text-zinc-300 cursor-not-allowed'
            }`}
          >
            Review Order
          </button>
        </div>
      </div>

      {/* Overlapping Content Section */}
      <div className="relative mx-auto -mt-8 max-w-3xl px-3 pb-6 sm:px-5">
        <div className="flex flex-col gap-3">

          {/* Main Status & Progress Card */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="order-3 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-4"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Track your order</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="rounded bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800">#{orderData.orderId}</span>
                  <button
                    type="button"
                    onClick={copyOrderId}
                    className="inline-flex items-center gap-1 rounded border border-orange-100 bg-orange-50 px-2 py-1 text-[9px] font-semibold text-orange-600 transition hover:bg-orange-100 active:scale-95 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300"
                    aria-label="Copy order ID"
                  >
                    <Copy size={12} />
                    Copy
                  </button>
                  <span className="text-[9px] font-medium text-orange-500">Step {currentStepIndex + 1} of {statusSteps.length}</span>
                  <button type="button" onClick={() => router.push("/get-help?orderId=" + encodeURIComponent(orderData.orderId || orderId) + "&paymentReference=" + encodeURIComponent(orderData.paymentReference || ""))} className="rounded border border-red-100 bg-red-50 px-2 py-1 text-[9px] font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10">Get help</button>
                </div>
              </div>
              <div className="rounded-xl bg-zinc-50 p-2 dark:bg-zinc-800">
                <Package size={18} className="text-zinc-400" />
              </div>
            </div>

            <div className="relative space-y-2.5">
              {/* Refined Vertical Timeline */}
              <div className="absolute bottom-4 left-[15px] top-4 w-0.5 bg-zinc-100 dark:bg-zinc-800" />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                className="absolute left-[15px] top-4 w-0.5 bg-gradient-to-b from-orange-400 to-orange-600"
              />

              {statusSteps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = idx === currentStepIndex;
                const isPast = idx < currentStepIndex;

                return (
                  <div key={step.key} className="relative flex gap-2.5">
                    <div className="relative z-10">
                      <motion.div
                        animate={{
                          scale: isActive ? [1, 1.1, 1] : 1,
                        }}
                        transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 ${isActive || isPast
                          ? "border-orange-500 bg-orange-500 text-white shadow-sm shadow-orange-500/25"
                          : "border-zinc-200 bg-white text-zinc-300 dark:border-zinc-700 dark:bg-zinc-900"
                          }`}
                      >
                        {isPast ? <CheckCircle size={15} /> : <Icon size={15} />}
                      </motion.div>
                    </div>

                    <div className={`flex-1 transition-all duration-700 ${idx > currentStepIndex ? "opacity-30 blur-[0.5px]" : "opacity-100"}`}>
                      <div className="flex min-h-8 flex-col justify-center">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-semibold ${isActive ? "text-orange-600" : "text-zinc-800 dark:text-zinc-200"}`}>
                            {step.label}
                          </h4>
                          {isActive && (
                            <motion.span
                              animate={{ opacity: [1, 0.5, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[8px] font-semibold text-white"
                            >
                              Ongoing
                            </motion.span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[9px] text-zinc-500 dark:text-zinc-400">
                          {step.subtitle}
                        </p>
                        {isActive && <p className="mt-1 max-w-[280px] text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">{step.description}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* 🔐 NEW: Delivery Confirmation Code (OTP) Card */}
          {deliveryOtp && !['delivered', 'completed'].includes(orderStatus) && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="order-4 relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 p-3 text-center text-white shadow-lg dark:bg-orange-600"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <div className="relative z-10">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 dark:bg-white animate-pulse" />
                  <p className="text-[10px] font-medium uppercase tracking-[0.3em] opacity-80">Secure Delivery Code</p>
                </div>
                <h3 className="mb-2 font-mono text-3xl font-semibold tracking-[0.3em]">
                  {orderData.deliveryOtp}
                </h3>
                <p className="mx-auto max-w-[280px] text-[11px] leading-relaxed opacity-80">
                  Provide this code to your rider only after you have received your order.
                </p>
              </div>
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/20 rounded-full translate-y-12 -translate-x-12 blur-2xl" />
            </motion.div>
          )}

          {/* Rider & Bag Detailed Card */}
          <div className="order-1 grid grid-cols-1 gap-3">

            {/* Rider Information Section - Real data from backend */}
            {assignedRider && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="order-2 relative overflow-hidden rounded-2xl bg-orange-600 p-3 text-white shadow-lg shadow-orange-500/20"
              >
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-2xl" />

                <div className="relative z-10 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/30 bg-white/10 p-1 backdrop-blur-md">
                    {assignedRider.avatar ? (
                      <img 
                        src={assignedRider.avatar} 
                        alt="Rider" 
                        className="w-full h-full object-cover rounded-[20px]" 
                      />
                    ) : (
                      <Bike size={24} strokeWidth={1.5} className="text-white/80" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium italic tracking-tight leading-tight">
                      {assignedRider.name || "MelaChow Delivery Partner"}
                    </h3>
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-80 mt-1">
                      Professional Rider {assignedRider.phone && `• ${assignedRider.phone}`}
                    </p>
                    {riderLocation?.latitude != null && riderLocation?.longitude != null && (
                      <p className="text-[10px] opacity-80 mt-1">
                        Live location: {Number(riderLocation.latitude).toFixed(5)}, {Number(riderLocation.longitude).toFixed(5)}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-1 rounded">
                        <Star size={10} className="fill-white" />
                        <span className="text-[10px] font-medium">{assignedRider.rating || "5.0"}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-1 rounded">
                        <span className="text-[10px] font-medium uppercase">
                          {assignedRider.totalDeliveries || 0}+ Trips
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <a 
                      href={`tel:${assignedRider.phone}`}
                      className="flex items-center justify-center rounded-xl bg-white p-3 text-orange-600 shadow-xl transition-transform hover:scale-105"
                    >
                      <Phone size={18} strokeWidth={2.5} />
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Bag/Items Section */}
            <motion.div
              className="order-1 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="mb-3 flex items-center justify-between gap-3 border-b border-dashed border-zinc-200 pb-3 dark:border-zinc-700">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Order receipt</h3>
                  <p className="mt-0.5 text-[10px] text-zinc-500">Order #{orderData.orderId} · {orderPlacedAt}</p>
                  {restaurantNames.length > 0 && <p className="mt-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-300">{restaurantNames.join(" · ")}</p>}
                </div>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{items.length} {items.length === 1 ? "item" : "items"}</span>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="space-y-1.5 border-b border-dashed border-zinc-200 pb-3 last:border-0 last:pb-0 dark:border-zinc-700"
                  >
                    {/* TOP ROW — image, name, price, review */}
                    <div className="flex items-start gap-2.5">
                      
                      {/* Item Image — prefer variant image, fall back to item image_url */}
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                        <img
                          src={item.variant?.image || item.image_url || "/placeholder.jpg"}
                          alt={item.name || item.variant?.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Food name — the actual dish name e.g. "Jollof Rice" */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-semibold leading-tight text-zinc-900 dark:text-white">
                            {item.name || item.variant?.name}
                          </h4>
                          {item.quantity > 1 && (
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              x{item.quantity}
                            </span>
                          )}
                        </div>

                        {/* Portion / Multiplier Details */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          {/* Portion label — e.g. "Large Bowl" */}
                          {item.portion_label && (
                            <div className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                {item.portion_label}
                              </p>
                              {item.portion_quantity > 1 && (
                                <span className="text-[9px] font-medium text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-1 rounded">
                                  {item.portion_quantity} units
                                </span>
                              )}
                            </div>
                          )}

                          {/* Fallback portion from variant */}
                          {!item.portion_label && item.variant?.name && item.name && 
                            item.variant.name !== item.name && (
                            <div className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                              <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-tight">
                                {item.variant.name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end">
                        <div className="shrink-0 text-xs font-semibold text-zinc-900 dark:text-white">
                          {formatMoney(Number(item.price ?? item.price_naira ?? item.metadata?.pricing?.final_unit_naira ?? 0) * Number(item.quantity || 1))}
                        </div>
                      </div>
                    </div>

                    {/* SELECTED OPTIONS — broken down by choice group */}
                    {((item.selected_options || item.metadata?.selected_options)?.length > 0) && (
                      <div className="space-y-1 pt-1"><p className="text-[9px] font-medium uppercase tracking-wider text-zinc-400">Add-ons</p>
                        {Object.entries(
                          (item.selected_options || item.metadata.selected_options).reduce((groups, opt) => {
                            const key = opt.group_name || 'Additional Extras';
                            if (!groups[key]) groups[key] = [];
                            groups[key].push(opt);
                            return groups;
                          }, {})
                        ).map(([groupName, options]) => (
                          <div
                            key={groupName}
                            className="rounded-lg border border-zinc-100 bg-zinc-50/70 px-2 py-1.5 dark:border-zinc-800/50 dark:bg-zinc-900/40"
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <div className="h-0.5 w-3 bg-orange-500 rounded-full" />
                              <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-zinc-400">
                                {groupName}
                              </p>
                            </div>
                            <div className="space-y-1">
                              {options.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  className="flex items-center justify-between group"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-4 w-4 items-center justify-center rounded border border-zinc-100 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                                      <span className="text-[8px] font-semibold text-orange-600">
                                        {opt.quantity || 1}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
                                      {opt.label}
                                    </span>
                                  </div>
                                  {opt.price_modifier_naira > 0 && (
                                    <span className="text-[9px] text-zinc-400">
                                      + ₦{(opt.price_modifier_naira * (opt.quantity || 1)).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* PRICING BREAKDOWN — only when options were added */}
                    {item.metadata?.pricing && 
                     item.metadata.pricing.options_total > 0 && (
                      <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900/60">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-zinc-400">
                            Base ₦{item.metadata.pricing.base_naira?.toLocaleString()}
                          </span>
                          <span className="text-zinc-300 dark:text-zinc-600">+</span>
                          <span className="text-[10px] font-bold text-orange-500">
                            Add-ons ₦{item.metadata.pricing.options_total?.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                          = ₦{item.metadata.pricing.final_unit_naira?.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* CUSTOMER NOTE — only when note is non-empty */}
                    {item.note && item.note.trim() !== '' && (
                      <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 rounded border border-amber-100 dark:border-amber-500/20">
                        <span className="text-amber-500 text-[11px] mt-0.5 flex-shrink-0">📍</span>
                        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 italic">
                          Customer note: {item.note}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Enhanced Pricing Breakdown */}
              <div className="mt-3 space-y-2.5 border-t border-dashed border-zinc-200 pt-3 dark:border-zinc-700">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">Food items</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Delivery</span>
                    <span className={`font-bold ${Number(deliveryFee || 0) === 0 ? "text-green-600" : "text-zinc-900 dark:text-white"}`}>
                      {Number(deliveryFee || 0) === 0 ? (promoWaivedDelivery ? "Free (promo)" : "Free") : formatMoney(deliveryFee)}
                    </span>
                </div>
                {promoWaivedDelivery && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-600 font-medium">Delivery promo saved</span>
                    <span className="font-bold text-green-600">-{formatMoney(promoSaved)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Service fee</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{formatMoney(serviceFee)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-700 dark:text-emerald-400">Discount</span>
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">-{formatMoney(discountAmount)}</span>
                  </div>
                )}
                <div className="flex items-end justify-between border-t border-dashed border-zinc-200 pt-3 dark:border-zinc-700">
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{String(paymentStatus || "").toLowerCase() === "paid" ? "Total paid" : "Order total"}</p>
                    <h4 className="text-2xl font-bold leading-none tracking-tight text-zinc-900 dark:text-white">{formatMoney(total)}</h4>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase ${
                      orderStatus === 'cancelled' ? 'text-red-600 bg-red-50 dark:bg-red-500/10' : 'text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10'
                    }`}>
                      {orderStatus === 'cancelled' ? 'Refunded' : String(paymentStatus || 'Payment pending').replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {(paymentMethod || paymentReference) && (
                  <div className="grid grid-cols-1 gap-1 border-t border-dashed border-zinc-200 pt-2 text-[10px] text-zinc-500 dark:border-zinc-700 sm:grid-cols-2">
                    {paymentMethod && <p className="flex items-center gap-1.5"><CreditCard size={12} /> Method: {paymentMethod}</p>}
                    {paymentReference && <p className="truncate">Payment ref: {paymentReference}</p>}
                  </div>
                )}

                  {showPaymentRetry && (
                    <div className="mt-4 bg-orange-50 dark:bg-orange-950/10 p-4 rounded-3xl border border-orange-100 dark:border-orange-800/50">
                      <div className="flex flex-col gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Payment verification</h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            We detected that this order still needs Paystack verification. Retry now to confirm the payment and refresh the order status.
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <button
                            type="button"
                            onClick={handleVerifyPayment}
                            disabled={isVerifyingPayment}
                            className="inline-flex items-center justify-center rounded-full px-4 py-2 bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <RefreshCw size={16} className="mr-2" />
                            {isVerifyingPayment ? "Retrying…" : "Retry payment verification"}
                          </button>
                          {verificationMessage && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">{verificationMessage}</p>
                          )}
                          {verificationError && (
                            <p className="text-xs text-red-600 dark:text-red-400">{verificationError}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </motion.div>
            <div className="order-2 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-4">
              <div className="mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-orange-500" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Delivery details</h3>
              </div>
              <div className="space-y-1 pl-6 text-xs text-zinc-600 dark:text-zinc-300">
                {(deliveryAddress?.name || orderData.customerName) && <p className="font-medium text-zinc-900 dark:text-white">{deliveryAddress?.name || orderData.customerName}</p>}
                {deliveryAddressText ? <p className="leading-relaxed">{deliveryAddressText}</p> : <p className="text-zinc-400">No delivery address was saved with this order.</p>}
                {(deliveryAddress?.phone || orderData.phone) && <p>{deliveryAddress?.phone || orderData.phone}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button - Support */}
      <motion.div
        className="fixed bottom-4 right-4 z-[100] flex items-center gap-3"
        initial={{ x: 100 }}
        animate={{ x: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2 }}
          className="bg-white dark:bg-zinc-900 px-4 py-2 rounded shadow-xl border border-zinc-100 dark:border-zinc-800 hidden md:block"
        >
          <p className="text-[10px] font-medium uppercase text-zinc-500">Need help?</p>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push("/get-help?orderId=" + encodeURIComponent(orderData.orderId || orderId) + "&paymentReference=" + encodeURIComponent(orderData.paymentReference || ""))}
          aria-label="Get help with this order"
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-orange-600 text-white shadow-lg shadow-orange-600/25 backdrop-blur-sm group"
        >
          <Truck size={20} strokeWidth={2.5} className="transition-transform group-hover:rotate-12" />
        </motion.button>
      </motion.div>

      {/* ── Auto Review Banner ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showReviewBanner && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-16 left-0 right-0 z-[10000] p-4 pb-8"
          >
            <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-[8px] shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.15)] border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              {/* Orange accent bar */}
              <div className="h-1 bg-gradient-to-r from-orange-400 via-orange-600 to-amber-500" />
              <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 rounded flex items-center justify-center">
                      <Star size={20} className="text-orange-500 fill-orange-500" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-zinc-900 dark:text-white uppercase tracking-tight">How was your order?</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Your feedback helps other customers</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowReviewBanner(false);
                      localStorage.setItem(`review_prompted_${orderId}`, 'dismissed');
                    }}
                    className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    <span className="text-lg leading-none">×</span>
                  </button>
                </div>

                {/* Item thumbnails */}
                {orderData?.items?.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    {orderData.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="w-10 h-10 rounded overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm">
                        <img
                          src={item.variant?.image || item.image_url || '/placeholder.jpg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {orderData.items.length > 3 && (
                      <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <span className="text-[10px] font-medium text-zinc-500">+{orderData.items.length - 3}</span>
                      </div>
                    )}
                    <p className="text-[11px] font-bold text-zinc-500 ml-1">{orderData.items.length} item{orderData.items.length > 1 ? 's' : ''}</p>
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (orderData?.items?.length > 0) {
                        setSelectedFoodForReview(orderData.items[0]);
                        setIsReviewModalOpen(true);
                        setShowReviewBanner(false);
                        localStorage.setItem(`review_prompted_${orderId}`, 'prompted');
                      }
                    }}
                    className="flex-1 py-3.5 bg-orange-600 text-white rounded font-medium text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                  >
                    <Star size={14} className="fill-white" />
                    Rate Now
                  </motion.button>
                  <button
                    onClick={() => {
                      setShowReviewBanner(false);
                      localStorage.setItem(`review_prompted_${orderId}`, 'dismissed');
                    }}
                    className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 rounded font-medium text-[11px] uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      {selectedFoodForReview && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            localStorage.setItem(`review_prompted_${orderId}`, 'submitted');
          }}
          food={selectedFoodForReview}
          vendorId={orderData.items[0].restaurantId}
          baseUrl={baseUrl}
        />
      )}
    </div>
  );
}

