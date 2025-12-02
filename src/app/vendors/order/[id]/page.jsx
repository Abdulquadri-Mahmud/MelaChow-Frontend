"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import API from "@/app/lib/vendorApi";
import StatusButtons from "@/app/components/order/StatusButtons";

export default function VendorOrderDetails() {
  // const { id } = useParams();
  // const [order, setOrder] = useState(null);

  // const fetchOrder = async () => {
  //   const res = await API.get("/orders");
  //   const found = res.data.vendorOrders.find((o) => o._id === id);
  //   setOrder(found);
  // };

  // useEffect(() => {
  //   fetchOrder();
  // }, []);

  // if (!order) return <p className="p-5">Loading...</p>;

  return (
    <div className="p-5">
      {/* <h1 className="text-2xl font-semibold">Order Details</h1>

      <div className="mt-5 bg-white shadow-md p-6 rounded-lg border">
        <h2 className="font-bold mb-2">Items</h2>
        {order.items.map((item) => (
          <div key={item._id} className="flex justify-between border-b py-2">
            <p>{item.name}</p>
            <p>₦{item.price} × {item.quantity}</p>
          </div>
        ))}

        <div className="mt-4">
          <p><strong>Phone:</strong> {order?.userOrderId?.phone}</p>
          <p><strong>Status:</strong> {order.orderStatus}</p>
        </div>

        <StatusButtons order={order} refresh={fetchOrder} />
      </div> */}
    </div>
  );
}
