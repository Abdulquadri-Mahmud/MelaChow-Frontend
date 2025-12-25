"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import Header2 from "../components/App_Header/Header2";
import { ShoppingCart, Package } from "lucide-react";
import toast from "react-hot-toast";
import { useApi } from "../context/ApiContext";
import axios from "axios";
import { OrderCardSkeleton } from "../components/skeleton/OrderCardSkeleton";

export default function OrdersPage() {
  const router = useRouter();
  const { cart } = useCart();
  const [token, setToken] = useState(null);
  const { baseUrl } = useApi();

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header2 />


      <div className="flex-1 max-w-3xl w-full mx-auto md:p-4 p-2 py-3 flex flex-col h-[calc(100vh-80px)]">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="md:text-3xl text-xl font-bold text-gray-800">Your Orders</h1>
          <button
            onClick={() => router.push("/cart")}
            className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2 rounded-xl font-medium hover:bg-orange-600 transition"
          >
            <ShoppingCart size={18} />
            Cart ({cart.length})
          </button>
        </div>

        {/* Orders list */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {isLoading || !token ? (
            Array.from({ length: 4 }).map((_, idx) => <OrderCardSkeleton key={idx} />)
          ) : isError ? (
            <p className="text-red-500 text-center">Failed to load orders</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-500 mt-4 text-center">You have no orders yet.</p>
          ) : (
            orders.map((order) => (
              <div
                key={order._id}
                onClick={() => router.push(`/track-orders/${order.orderId}`)}
                className="bg-white rounded-3xl md:p-5 p-3 cursor-pointer hover:shadow hover:-translate-y-1 transition-transform"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="text-orange-500" size={20} />
                    <span className="font-semibold text-gray-800 text-lg">
                      {order.orderId}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${order.orderStatus === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : order.orderStatus === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : order.orderStatus === "delivered"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {order.orderStatus}
                  </span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ml-2 ${order.paymentStatus === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                      }`}
                  >
                    {order.paymentStatus.toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-700">
                  <p className="text-sm">
                    Total Items:{" "}
                    <span className="font-semibold">
                      {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                    </span>
                  </p>
                  <p className="text-sm">
                    Total:{" "}
                    <span className="font-semibold">₦{order.total?.toLocaleString()}</span>
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Placed: {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
