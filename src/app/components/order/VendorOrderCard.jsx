import Link from "next/link";
import { User, MapPin, Calendar, Clock, Phone, ChevronRight, ShoppingBag } from "lucide-react";

export default function VendorOrderCard({ order }) {
  const { userOrderId, restaurantId } = order;
  const user = userOrderId?.userId;
  const address = userOrderId?.deliveryAddress;

  // Format Date
  const dateObj = new Date(order.createdAt);
  const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // Filter items specific to this vendor if detailed info is available
  const detailedItems = userOrderId?.items?.filter(item => item.restaurantId === restaurantId) || [];
  const itemCount = detailedItems.length > 0 ? detailedItems.length : (order.items?.length || 0);

  // Status Styling - Updated for all 12 statuses
  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400";
      case 'accepted': return "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400";
      case 'preparing': return "bg-[#FF6B00]/10 text-[#FF6B00]";
      case 'ready':
      case 'ready_for_pickup': return "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400";
      case 'rider_assigned': return "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400";
      case 'out_for_delivery': return "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400";
      case 'delivered': return "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400";
      case 'completed': return "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400";
      case 'cancelled': return "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400";
      case 'failed': return "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400";
      case 'refunded': return "bg-pink-100 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400";
      default: return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  return (
    <div className="group bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg hover:border-[#FF6B00]/30 transition-all duration-300 flex flex-col h-full">

      {/* Header: ID & Status */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[10px] font-mono px-1.5 py-0.5 rounded">
              #{(order._id?.$oid || order._id || "").toString().slice(-6).toUpperCase()}
            </span>
            <span className="text-slate-400 text-xs flex items-center gap-1">
              <Calendar size={10} /> {dateStr}
              <Clock size={10} className="ml-1" /> {timeStr}
            </span>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${getStatusStyle(order.orderStatus)}`}>
          {order.orderStatus.replace(/_/g, ' ')}
        </span>
      </div>

      {/* User Info Section */}
      <div className="flex items-start gap-4 mb-5 pb-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 p-3 rounded-xl">
        <div className="flex-shrink-0">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.firstname} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
              <User size={20} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
            {user ? `${user.firstname} ${user.lastname}` : "Guest Customer"}
          </h3>
          <div className="flex flex-col gap-1 mt-1">
            {(user?.phone || order.userOrderId?.phone) && (
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Phone size={12} className="text-[#FF6B00]" />
                {user?.phone || order.userOrderId?.phone}
              </p>
            )}
            {address && (
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5 line-clamp-2">
                <MapPin size={12} className="text-[#FF6B00] mt-0.5 flex-shrink-0" />
                <span>{address.addressLine}, {address.city}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Order Items Summary */}
      <div className="flex-1 space-y-3 mb-5">
        <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Order Items</p>

        {detailedItems.length > 0 ? (
          <div className="space-y-3">
            {detailedItems.slice(0, 2).map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-slate-100 dark:bg-white/5 overflow-hidden flex-shrink-0">
                  {item.variant?.image ? (
                    <img src={item.variant.image} alt={item.variant.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ShoppingBag size={16} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.variant?.name || "Food Item"}</p>
                  <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
            {detailedItems.length > 2 && (
              <p className="text-xs text-slate-500 italic pl-1">+ {detailedItems.length - 2} more items</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 text-sm italic">
            <ShoppingBag size={16} />
            <span>{itemCount} item{itemCount !== 1 ? 's' : ''} in this order</span>
          </div>
        )}
      </div>

      {/* Footer: Price & Action */}
      <div className="flex items-center justify-between pt-0 mt-auto">
        <div>
          <p className="text-xs text-slate-400">Vendor Earning</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">₦{order.vendorTotal?.toLocaleString() || "0"}</p>
        </div>

        <Link
          href={`/vendors/orders/${order._id?.$oid || order._id}`}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white font-semibold text-sm rounded-xl group-hover:bg-[#FF6B00] group-hover:text-white transition-colors"
        >
          Details <ChevronRight size={16} />
        </Link>
      </div>

    </div>
  );
}
