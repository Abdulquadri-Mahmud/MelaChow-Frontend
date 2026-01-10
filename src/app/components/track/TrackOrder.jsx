"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Clock, Truck, Package, Home, CheckCircle } from "lucide-react";
import { useApi } from "@/app/context/ApiContext";
import { useParams } from "next/navigation";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import Header2 from "../App_Header/Header2";
import OrderTrackingSkeleton from "../skeleton/OrderTrackingSkeleton";
import { motion } from "framer-motion";

const statusSteps = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "processing", label: "Processing", icon: Truck },
  { key: "in_transit", label: "In Transit", icon: Package },
  { key: "delivered", label: "Delivered", icon: Home },
];

export default function OrderTracking() {
  const { orderId } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { baseUrl } = useApi();
  const { user } = useUserStorage();

  useEffect(() => {
    if (!user?.token) return;

    const fetchOrder = async () => {
      try {
        const res = await axios.get(`${baseUrl}/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setOrderData(res.data.order);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch order details");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId, user?.token]);

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
    return <div className="md:p-6 p-2 text-center text-gray-600 font-medium">No order found</div>;

  const { items, deliveryAddress, subtotal, deliveryFee, total, orderStatus, userId } = orderData;
  const currentStepIndex = statusSteps.findIndex((s) => s.key === orderStatus);

  // console.log(orderData);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header2 />

      <div className="max-w-lg mx-auto md:p-6 p-2 pb-20 space-y-2">
        {/* Customer Info */}
        <div className="bg-white rounded-xl md:p-4 p-3 space-y-3 border border-gray-200">
          <h3 className="text-gray-700 font-semibold text-lg mb-2">Customer Information</h3>

          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="font-semibold text-xs text-gray-600">Full Name:</span>
            <span className="text-gray-800 text-xs">{userId.firstname} {userId.lastname}</span>
          </div>

          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="font-semibold text-xs text-gray-600">Email:</span>
            <span className="text-gray-800 text-xs">{userId.email}</span>
          </div>

          <div className="flex justify-between">
            <span className="font-semibold text-xs text-gray-600">Phone Number:</span>
            <span className="text-gray-800 text-xs">{userId.phone}</span>
          </div>
        </div>


        {/* Order ID */}
        <div className="bg-white rounded-xl md:p-4 px-2 py-4 border border-gray-200">
          <h2 className="text-gray-600 font-bold">Order ID: {orderData.orderId}</h2>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl md:p-4 p-2 border border-gray-200 space-y-3">
          <h3 className="text-gray-700 font-semibold">Items</h3>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-center bg-orange-50 rounded-lg p-2 shadow-sm">
              {item.variant.image ? (
                <img
                  src={item.variant.image}
                  alt={item.variant.name}
                  className="w-12 h-12 object-cover rounded-md"
                />
              ) : (
                <div className="w-12 h-12 bg-orange-200 rounded-md flex items-center justify-center flex-shrink-0">
                  <Package size={20} className="text-orange-500" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-gray-800 text-sm font-semibold">{item.variant.name}</p>
                <p className="text-gray-600 text-xs">
                  Qty: {item.quantity} | ₦{item.price.toLocaleString()}
                </p>
                <p className="text-gray-500 text-xs mt-1">From: {item.restaurantId.storeName}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-xl md:p-4 p-2 border border-gray-200 space-y-1">
          <h3 className="text-gray-700 font-semibold">Delivery Address</h3>
          <p className="text-xs">{deliveryAddress.addressLine}</p>
          <p className="text-xs">
            {deliveryAddress.city}, {deliveryAddress.state}
          </p>
          {/* <p>Phone: {deliveryAddress.phone}</p> */}
        </div>

        {/* Payment Summary */}
        <div className="bg-white w-full rounded-xl md:p-4 p-2 border border-gray-200 space-y-3">
          <h3 className="text-gray-700 font-semibold mb-2">Payment</h3>

          {/* Subtotal */}
          <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
            <span className="text-gray-700">Subtotal</span>
            <span className="text-gray-800 font-medium">₦{subtotal.toLocaleString()}</span>
          </div>

          {/* Delivery Fee */}
          <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
            <span className="text-gray-700">Delivery Fee</span>
            <span className="text-gray-800 font-medium">₦{deliveryFee.toLocaleString()}</span>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
            <span className="text-gray-700 font-semibold">Total</span>
            <span className="text-orange-500 font-bold text-lg">₦{total.toLocaleString()}</span>
          </div>

          {/* Payment Status */}
          <div className="flex justify-between items-center text-xs py-1">
            <span className="text-gray-700">Payment Status</span>
            <span className="text-gray-700 text-sm bg-green-300  px-3 py-1 rounded-md capitalize">{orderData.paymentStatus}</span>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-xl md:p-4 p-2 border border-gray-200">
          <h3 className="text-gray-700 font-semibold mb-4">Order Status</h3>

          <div className="relative flex items-center justify-between">
            {/* Gray background line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-300 rounded z-0" />

            {/* Orange animated progress line */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="absolute top-5 left-0 h-1 bg-orange-400 rounded z-10"
            />

            {/* Step icons */}
            {statusSteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx <= currentStepIndex;
              const isCompleted = idx < currentStepIndex;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center relative z-20">
                  {/* Icon background with motion */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.3 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${isActive ? "bg-orange-500 text-white" : "bg-gray-300 text-gray-500"
                      }`}
                  >
                    {/* Always render icon */}
                    {isCompleted ? <CheckCircle size={18} /> : <Icon size={18} />}
                  </motion.div>

                  <span
                    className={`mt-2 text-xs text-center font-medium ${isActive ? "text-orange-600" : "text-gray-500"
                      }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
