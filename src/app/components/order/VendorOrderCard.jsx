import Link from "next/link";
import StatusBadge from "./StatusBadge";

export default function VendorOrderCard({ order }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-5 border">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">Order #{order._id.slice(-6)}</h2>
        <StatusBadge status={order.orderStatus} />
      </div>

      <p className="text-gray-700 mt-2">
        Items: {order.items.length}
      </p>

      <p className="text-gray-700 text-sm">
        User: {order?.userOrderId?.phone}
      </p>

      <Link
        className="mt-3 inline-block text-blue-600 underline"
        href={`/vendor/orders/${order._id}`}
      >
        View Details →
      </Link>
    </div>
  );
}
