"use client";
import { useEffect, useState } from "react";
import API from "@/app/lib/vendorApi";
import VendorOrderCard from "@/app/components/order/VendorOrderCard";

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    const res = await API.get("/orders");
    setOrders(res.data.vendorOrders);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="p-5">
      <h1 className="text-3xl font-bold mb-5">Vendor Orders</h1>

      <div className="grid md:grid-cols-2 gap-4">
        {orders.map((order) => (
          <VendorOrderCard key={order._id} order={order} />
        ))}
      </div>
    </div>
  );
}
