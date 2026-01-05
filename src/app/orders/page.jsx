"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import Header2 from "../components/App_Header/Header2";
import { ShoppingCart, Package, Clock, Trash2, ArrowRight, Minus, Plus, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { useApi } from "../context/ApiContext";
import axios from "axios";
import { OrderCardSkeleton } from "../components/skeleton/OrderCardSkeleton";
import { motion, AnimatePresence } from "framer-motion";

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("activeTab") || "orders";

  const { cart, increaseQuantity, decreaseQuantity, removeFromCart, clearCart } = useCart();
  const [token, setToken] = useState(null);
  const { baseUrl } = useApi();
  const [activeTab, setActiveTab] = useState(initialTab); // "orders" or "cart"

  useEffect(() => {
    const userToken = localStorage.getItem("userToken");
    if (!userToken) {
      toast.error("Please login to view orders");
      return;
    }
    setToken(userToken);
  }, []);

  const fetchUserOrders = async () => {
    const res = await axios.get(`${baseUrl}/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["userOrders", token],
    queryFn: fetchUserOrders,
    enabled: !!token,
    retry: false,
  });

  const orders = data?.orders || [];

  // Group items by restaurant for Cart
  const groupedCart = cart.reduce((acc, item) => {
    const store = item.storeName || "Unknown Store";
    if (!acc[store]) acc[store] = [];
    acc[store].push(item);
    return acc;
  }, {});

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header2 />

      <main className="flex-1 max-w-3xl w-full mx-auto p-3 md:p-4">
        {/* Custom Tabs */}
        <div className="flex bg-gray-200/50 p-1 rounded-xl w-full max-w-md mb-6 sticky top-[72px] z-20 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "orders"
              ? "bg-white text-orange-600"
              : "text-gray-500 hover:text-gray-900"
              }`}
          >
            <Package size={16} />
            Orders
            {orders.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === 'orders' ? 'bg-orange-100/80 text-orange-600' : 'bg-gray-300/40 text-gray-500'}`}>
                {orders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("cart")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "cart"
              ? "bg-white text-orange-600"
              : "text-gray-500 hover:text-gray-900"
              }`}
          >
            <ShoppingCart size={16} />
            Cart
            {cart.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === 'cart' ? 'bg-orange-100/80 text-orange-600' : 'bg-gray-300/40 text-gray-500'}`}>
                {cart.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="pb-24">
          <AnimatePresence mode="wait">
            {activeTab === "orders" ? (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {isLoading || !token ? (
                  Array.from({ length: 4 }).map((_, idx) => <OrderCardSkeleton key={idx} />)
                ) : isError ? (
                  <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-300">
                    <p className="text-red-500">Failed to load orders</p>
                    <button onClick={() => window.location.reload()} className="mt-4 text-orange-500 font-semibold underline">Retry</button>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="text-gray-400" size={24} />
                    </div>
                    <p className="text-gray-500 font-medium">You have no orders yet.</p>
                    <button onClick={() => router.push("/")} className="mt-4 text-orange-500 font-semibold">Browse Restaurants</button>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order._id}
                      onClick={() => router.push(`/track-orders/${order.orderId}`)}
                      className="bg-white rounded-2xl p-3 cursor-pointer border border-gray-100 hover:shadow-md hover:border-orange-100 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900 text-sm">Order #{order.orderId}</span>
                            <ArrowRight size={12} className="text-gray-300 group-hover:text-orange-500 transition-colors" />
                          </div>
                          <p className="text-[10px] text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString(undefined, {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex gap-1.5 items-center">
                            <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md font-bold ${order.orderStatus === "pending" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                              order.orderStatus === "processing" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                order.orderStatus === "delivered" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                  "bg-gray-50 text-gray-600 border border-gray-100"
                              }`}>
                              {order.orderStatus}
                            </span>
                            <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md font-bold ${order.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                              }`}>
                              {order.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-gray-50/80 rounded-xl p-2.5">
                        <div className="flex -space-x-1.5">
                          {order.items.slice(0, 4).map((item, i) => (
                            <img key={i} src={item.variant.image} className="w-7 h-7 rounded-lg border-2 border-white object-cover" alt="" title={item.variant.name} />
                          ))}
                          {order.items.length > 4 && (
                            <div className="w-7 h-7 rounded-lg bg-white border-2 border-gray-50 flex items-center justify-center text-[9px] font-bold text-gray-600">
                              +{order.items.length - 4}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 font-medium">Amount Paid</p>
                          <p className="text-sm font-bold text-gray-900">₦{order.total?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="cart"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {Object.keys(groupedCart).length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="text-gray-400" size={24} />
                    </div>
                    <p className="text-gray-500 font-medium">Your cart is empty</p>
                    <button onClick={() => router.push("/")} className="mt-4 text-orange-500 font-semibold">Start Shopping</button>
                  </div>
                ) : (
                  <>
                    {Object.entries(groupedCart).map(([storeName, items]) => (
                      <div key={storeName} className="bg-white rounded-2xl p-3 border border-gray-100 space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                          <h3 className="font-bold text-gray-900 text-sm">{storeName}</h3>
                          <span className="text-[9px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                            {items.length} {items.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {items.map((item) => (
                            <div key={item.foodId + item.variantId} className="flex gap-3">
                              <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover bg-gray-100" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-semibold text-gray-900 truncate">{item.variantName}</h4>
                                <p className="text-[10px] text-gray-500 mt-0.5 font-medium tabular-nums">₦{item.price.toLocaleString()} × {item.quantity}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                                    <button
                                      onClick={() => decreaseQuantity(item.foodId, item.variantId)}
                                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all"
                                    >
                                      <Minus size={12} className="text-gray-600" />
                                    </button>
                                    <span className="w-5 text-center text-xs font-bold text-gray-900 tabular-nums">{item.quantity}</span>
                                    <button
                                      onClick={() => increaseQuantity(item.foodId, item.variantId)}
                                      className="w-6 h-6 flex items-center justify-center rounded-md bg-orange-500 text-white shadow-sm shadow-orange-200 hover:bg-orange-600 transition-all"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => removeFromCart(item.foodId, item.variantId)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              <div className="text-right flex flex-col justify-center">
                                <p className="text-xs font-bold text-gray-900 tabular-nums">₦{(item.price * item.quantity).toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Summary Card */}
                    <div className="bg-gray-900 rounded-2xl p-4 text-white shadow-xl shadow-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-400 text-sm font-medium">Subtotal</span>
                        <span className="text-xl font-bold tabular-nums">₦{subtotal.toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => router.push("/checkout")}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        Proceed to Checkout
                        <ArrowRight size={18} />
                      </button>
                      <button
                        onClick={clearCart}
                        className="w-full mt-4 text-gray-500 hover:text-white text-sm font-medium transition-colors"
                      >
                        Clear entire cart
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
