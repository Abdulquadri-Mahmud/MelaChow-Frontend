"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Clock, Truck, Package, Home, CheckCircle, Star, Phone, Bike } from "lucide-react";
import { useApi } from "@/app/context/ApiContext";
import { useParams } from "next/navigation";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import Header2 from "../App_Header/Header2";
import OrderTrackingSkeleton from "../skeleton/OrderTrackingSkeleton";
import { motion } from "framer-motion";
import ReviewModal from "@/app/modals/ReviewModal";
import { useOrderTracking } from "@/app/hooks/useOrderTracking";
import toast from "react-hot-toast";

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
  {
    key: "completed",
    label: "Completed",
    subtitle: "Order closed",
    description: "This order has been successfully completed. Enjoy your meal!",
    icon: CheckCircle
  },
];

export default function OrderTracking() {
  const { orderId } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedFoodForReview, setSelectedFoodForReview] = useState(null);

  const { baseUrl } = useApi();
  const { user } = useUserStorage();

  // Real-time tracking hook
  const { onStatusUpdate, onLocationUpdate } = useOrderTracking(orderId);

  useEffect(() => {
    // Listen for real-time status updates
    onStatusUpdate((data) => {
      console.log('ðŸ”„ Real-time status update:', data.status);
      setOrderData(prev => prev ? { 
        ...prev, 
        orderStatus: data.status,
        riderId: data.rider || prev.riderId // Update rider if provided
      } : null);

      // Optionally show a toast
      const statusLabel = statusSteps.find(s => s.key === data.status)?.label || data.status;
      toast.success(`Order Status: ${statusLabel}`, {
        icon: 'ðŸšš',
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
      console.log('ðŸ“ Real-time location update:', data.location);
      // Update location in state if map is implemented
    });
  }, [onStatusUpdate, onLocationUpdate]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`${baseUrl}/orders/${orderId}`, {
          withCredentials: true
        });
        console.log(res)
        setOrderData(res.data.order);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch order details");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId, baseUrl]);

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

  const { items, deliveryAddress, subtotal, deliveryFee, total, orderStatus, userId } = orderData;
  const currentStepIndex = statusSteps.findIndex((s) => s.key === orderStatus);

  // console.log(orderData);

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen font-display pb-32">
      <Header2 />

      {/* Dynamic Map Header Section */}
      <div className="relative h-[75vh] w-full overflow-hidden bg-orange-50 dark:bg-orange-950/10">
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

        <div className="absolute inset-0 flex flex-col items-center justify-center -translate-y-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            {/* Center Pulse */}
            <div className="absolute inset-0 animate-ping bg-orange-500/20 rounded-full scale-110" />
            <div className="absolute inset-0 animate-pulse bg-orange-500/10 rounded-full scale-150" />

            <div className="relative w-40 h-40 bg-white dark:bg-zinc-900 rounded-[48px] shadow-[0_30px_70px_-15px_rgba(255,102,0,0.3)] border-4 border-white dark:border-zinc-800 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-90" />
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="z-10 text-white"
              >
                {currentStepIndex === 3 ? (
                  <CheckCircle size={64} strokeWidth={1.5} />
                ) : (
                  <Truck size={64} strokeWidth={1.5} />
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
            className="mt-8 text-center"
          >
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white italic uppercase tracking-tighter">
              {statusSteps[currentStepIndex]?.label}
            </h2>
            <div className="flex items-center gap-2 justify-center mt-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Live Updates Enabled</p>
            </div>
          </motion.div>
        </div>

        {/* Top Actions */}
        <div className="absolute top-6 left-4 right-4 flex justify-between items-center z-10">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/50 dark:border-zinc-800/50 shadow-lg">
            <span className="text-[10px] font-black text-orange-600 uppercase italic">
              {orderStatus === 'out_for_delivery' ? 'Arriving Shortly' : 
               orderStatus === 'delivered' ? 'Order Arrived' :
               orderStatus === 'ready_for_pickup' ? 'Assigning Rider' : 'Tracking Active'}
            </span>
          </div>
          <button
            onClick={() => {
              if (orderData?.items?.length > 0) {
                setSelectedFoodForReview(orderData.items[0]);
                setIsReviewModalOpen(true);
              }
            }}
            className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/50 dark:border-zinc-800/50 shadow-lg text-[10px] font-black text-zinc-500 uppercase hover:text-orange-600 transition-colors"
          >
            Review Order
          </button>
        </div>
      </div>

      {/* Overlapping Content Section */}
      <div className="relative max-w-4xl mx-auto -mt-[9rem] px-4">
        <div className="space-y-6">

          {/* Main Status & Progress Card */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-[48px] p-4 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] border border-zinc-100 dark:border-zinc-800"
          >
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-zinc-900 dark:text-white font-black text-xl italic uppercase tracking-tight">Track Progress</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-zinc-400 px-2 py-0.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg">#{orderData.orderId.substring(0, 8)}</span>
                  <span className="text-[10px] font-black text-orange-500 uppercase">{currentStepIndex + 1} of {statusSteps.length} Steps Done</span>
                </div>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-3xl">
                <Package size={24} className="text-zinc-400" />
              </div>
            </div>

            <div className="relative space-y-12">
              {/* Refined Vertical Timeline */}
              <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-zinc-50 dark:bg-zinc-800" />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                className="absolute left-[23px] top-6 w-[2px] bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_0_15px_rgba(255,102,0,0.4)]"
              />

              {statusSteps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = idx === currentStepIndex;
                const isPast = idx < currentStepIndex;

                return (
                  <div key={idx} className="flex gap-4 relative">
                    <div className="relative z-10">
                      <motion.div
                        animate={{
                          scale: isActive ? [1, 1.1, 1] : 1,
                          backgroundColor: isActive || isPast ? "#ff6600" : "#ffffff"
                        }}
                        transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
                        className={`w-12 h-12 rounded-[22px] flex items-center justify-center shadow-2xl transition-all duration-500 border-2 ${isActive || isPast
                          ? "text-white border-transparent shadow-orange-500/40"
                          : "text-zinc-300 border-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
                          }`}
                      >
                        {isPast ? <CheckCircle size={20} /> : <Icon size={20} />}
                      </motion.div>
                    </div>

                    <div className={`flex-1 transition-all duration-700 ${idx > currentStepIndex ? "opacity-30 blur-[0.5px]" : "opacity-100"}`}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <h4 className={`text-[13px] font-black uppercase tracking-tight ${isActive ? "text-orange-600" : "text-zinc-900 dark:text-white"}`}>
                            {step.label}
                          </h4>
                          {isActive && (
                            <motion.span
                              animate={{ opacity: [1, 0.5, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="px-2 py-0.5 bg-orange-500 text-[8px] font-black text-white rounded-full uppercase italic tracking-widest"
                            >
                              Ongoing
                            </motion.span>
                          )}
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-1 font-bold italic uppercase tracking-wider opacity-60">
                          {step.subtitle}
                        </p>
                        <p className="text-zinc-400 text-xs mt-2 font-medium leading-relaxed max-w-[200px]">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Rider & Bag Detailed Card */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-3">

            {/* Rider Information Section - Real data from backend */}
            {orderData.riderId && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-orange-600 rounded-[40px] p-4 text-white relative overflow-hidden shadow-2xl shadow-orange-500/20"
              >
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-2xl" />

                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-16 h-16 rounded-[24px] overflow-hidden border-2 border-white/30 p-1 bg-white/10 backdrop-blur-md flex items-center justify-center">
                    {orderData.riderId.avatar ? (
                      <img 
                        src={orderData.riderId.avatar} 
                        alt="Rider" 
                        className="w-full h-full object-cover rounded-[20px]" 
                      />
                    ) : (
                      <Bike size={32} strokeWidth={1.5} className="text-white/80" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black italic tracking-tight leading-tight">
                      {orderData.riderId.name || "MelaChow Delivery Partner"}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-1">
                      Professional Rider {orderData.riderId.phone && `â€¢ ${orderData.riderId.phone}`}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg">
                        <Star size={10} className="fill-white" />
                        <span className="text-[10px] font-black">{orderData.riderId.rating || "5.0"}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg">
                        <span className="text-[10px] font-black uppercase">
                          {orderData.riderId.totalDeliveries || 0}+ Trips
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <a 
                      href={`tel:${orderData.riderId.phone}`}
                      className="p-4 bg-white text-orange-600 rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center justify-center"
                    >
                      <Phone size={24} strokeWidth={2.5} />
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Bag/Items Section */}
            <motion.div
              className="bg-white dark:bg-zinc-900 rounded-[40px] p-4 border border-zinc-100 dark:border-zinc-800"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-zinc-900 dark:text-white font-black text-sm uppercase italic tracking-[0.2em]">Order Summary</h3>
                <span className="text-zinc-300 text-xs font-bold uppercase">{items.length} Items</span>
              </div>

              <div className="space-y-6">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-50/50 dark:bg-zinc-800/50 p-3 rounded-[28px] border border-zinc-100/50 dark:border-zinc-700/50 space-y-3"
                  >
                    {/* TOP ROW â€” image, name, price, review */}
                    <div className="flex gap-4 items-start">
                      
                      {/* Item Image â€” prefer variant image, fall back to item image_url */}
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-inner flex-shrink-0">
                        <img
                          src={item.variant?.image || item.image_url || "/placeholder.jpg"}
                          alt={item.name || item.variant?.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Food name â€” the actual dish name e.g. "Jollof Rice" */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-zinc-900 dark:text-white italic uppercase leading-tight">
                            {item.name || item.variant?.name}
                          </h4>
                          {item.quantity > 1 && (
                            <span className="text-[10px] font-black text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 px-1.5 py-0.5 rounded-md italic">
                              x{item.quantity}
                            </span>
                          )}
                        </div>

                        {/* Portion / Multiplier Details */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          {/* Portion label â€” e.g. "Large Bowl" */}
                          {item.portion_label && (
                            <div className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                              <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-tight">
                                {item.portion_label}
                              </p>
                              {item.portion_quantity > 1 && (
                                <span className="text-[9px] font-black text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-1 rounded">
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
                              <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-tight">
                                {item.variant.name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="font-black text-sm text-zinc-900 dark:text-white">
                          â‚¦{(item.price * item.quantity).toLocaleString()}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedFoodForReview(item);
                            setIsReviewModalOpen(true);
                          }}
                          className="text-[9px] font-black uppercase text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
                        >
                          Review
                        </button>
                      </div>
                    </div>

                    {/* SELECTED OPTIONS â€” broken down by choice group */}
                    {((item.selected_options || item.metadata?.selected_options)?.length > 0) && (
                      <div className="space-y-3 pt-2">
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
                            className="bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 p-3"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-0.5 w-3 bg-orange-500 rounded-full" />
                              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-400">
                                {groupName}
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              {options.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  className="flex items-center justify-between group"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center">
                                      <span className="text-[9px] font-black text-orange-600 italic">
                                        {opt.quantity || 1}
                                      </span>
                                    </div>
                                    <span className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-tight">
                                      {opt.label}
                                    </span>
                                  </div>
                                  {opt.price_modifier_naira > 0 && (
                                    <span className="text-[10px] font-black text-zinc-400">
                                      + â‚¦{(opt.price_modifier_naira * (opt.quantity || 1)).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* PRICING BREAKDOWN â€” only when options were added */}
                    {item.metadata?.pricing && 
                     item.metadata.pricing.options_total > 0 && (
                      <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-zinc-900/60 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-zinc-400">
                            Base â‚¦{item.metadata.pricing.base_naira?.toLocaleString()}
                          </span>
                          <span className="text-zinc-300 dark:text-zinc-600">+</span>
                          <span className="text-[10px] font-bold text-orange-500">
                            Add-ons â‚¦{item.metadata.pricing.options_total?.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[11px] font-black text-zinc-700 dark:text-zinc-300">
                          = â‚¦{item.metadata.pricing.final_unit_naira?.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* CUSTOMER NOTE â€” only when note is non-empty */}
                    {item.note && item.note.trim() !== '' && (
                      <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-500/20">
                        <span className="text-amber-500 text-[11px] mt-0.5 flex-shrink-0">ðŸ“</span>
                        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 italic">
                          "{item.note}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Enhanced Pricing Breakdown */}
              <div className="mt-10 pt-8 border-t-2 border-zinc-50 dark:border-zinc-800 space-y-4">
                <div className="flex justify-between items-center text-zinc-400 text-[11px] font-black uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-zinc-900 dark:text-white">â‚¦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400 text-[11px] font-black uppercase tracking-widest">
                  <span>Delivery Service</span>
                  <span className="text-orange-600">+ â‚¦{deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-end pt-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-1 leading-none">Total Payment</p>
                    <h4 className="text-4xl font-black text-zinc-900 dark:text-white italic tracking-tighter leading-none">â‚¦{total.toLocaleString()}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                      Completed
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Location & Details Mini Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                <Home size={20} className="text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest opacity-60">Home Address</h3>
                <p className="text-xs font-black text-zinc-900 dark:text-white truncate uppercase italic mt-0.5">{deliveryAddress.addressLine}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                <Clock size={20} className="text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest opacity-60">Placed On</h3>
                <p className="text-xs font-black text-zinc-900 dark:text-white truncate uppercase italic mt-0.5">
                  {orderData.createdAt ? (
                    <>
                      {new Date(orderData.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} â€¢ {new Date(orderData.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </>
                  ) : "Just Now"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button - Support */}
      <motion.div
        className="fixed bottom-8 right-8 z-[100] flex items-center gap-3"
        initial={{ x: 100 }}
        animate={{ x: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2 }}
          className="bg-white dark:bg-zinc-900 px-4 py-2 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 hidden md:block"
        >
          <p className="text-[10px] font-black uppercase text-zinc-500">Need help?</p>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-16 h-16 bg-orange-600 text-white rounded-[24px] shadow-[0_20px_40px_-10px_rgba(255,102,0,0.5)] flex items-center justify-center border-4 border-white/20 backdrop-blur-sm group relative"
        >
          <Truck size={28} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </motion.button>
      </motion.div>

      {/* Review Modal */}
      {selectedFoodForReview && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          food={selectedFoodForReview}
          vendorId={orderData.items[0].restaurantId}
          baseUrl={baseUrl}
        />
      )}
    </div>
  );
}

