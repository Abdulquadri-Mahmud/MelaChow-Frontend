import Link from "next/link";
import { User, MapPin, Phone, ChevronRight, ShoppingBag, Bike, Hash, CalendarDays } from "lucide-react";
import { useVendorStorage } from "@/app/hooks/vendorStorage";

export default function VendorOrderCard({ order, onAssign }) {
  const { vendorDetails } = useVendorStorage();
  const { userOrderId, restaurantId } = order;
  const user = userOrderId?.userId;
  const address = userOrderId?.deliveryAddress;

  const dateObj = new Date(order.createdAt);
  const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const detailedItems = userOrderId?.items?.filter(item => item.restaurantId === restaurantId) || [];
  const itemCount = detailedItems.length > 0 ? detailedItems.length : (order.items?.length || 0);

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return "bg-amber-50 text-amber-600 dark:bg-amber-600/10 border-amber-100 dark:border-amber-600/20";
      case 'accepted': return "bg-blue-50 text-blue-600 dark:bg-blue-600/10 border-blue-100 dark:border-blue-600/20";
      case 'preparing': return "bg-orange-50 text-orange-600 dark:bg-orange-600/10 border-orange-100 dark:border-orange-600/20";
      case 'ready':
      case 'ready_for_pickup': return "bg-purple-50 text-purple-600 dark:bg-purple-600/10 border-purple-100 dark:border-purple-600/20";
      case 'rider_assigned': return "bg-indigo-50 text-indigo-600 dark:bg-indigo-600/10 border-indigo-100 dark:border-indigo-600/20";
      case 'out_for_delivery': return "bg-cyan-50 text-cyan-600 dark:bg-cyan-600/10 border-cyan-100 dark:border-cyan-600/20";
      case 'delivered': return "bg-emerald-50 text-emerald-600 dark:bg-emerald-600/10 border-emerald-100 dark:border-emerald-600/20";
      case 'completed': return "bg-green-50 text-green-600 dark:bg-green-600/10 border-green-100 dark:border-green-600/20";
      case 'cancelled':
      case 'failed': return "bg-rose-50 text-rose-600 dark:bg-rose-600/10 border-rose-100 dark:border-rose-600/20";
      default: return "bg-slate-50 text-slate-500 dark:bg-slate-800 border-slate-100 dark:border-slate-800";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800 p-3.5 hover:border-orange-500/30 transition-all duration-300 flex flex-col h-full group relative overflow-hidden">
      
      {/* Header Ledger Info */}
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-slate-50 dark:bg-slate-950 rounded-md border border-slate-100 dark:border-slate-800">
               <Hash size={10} className="text-slate-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
              {(order._id?.$oid || order._id || "").toString().slice(-6).toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <CalendarDays size={10} />
            <span className="text-[8px] font-black uppercase tracking-widest">
              {dateStr}
            </span>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(order.orderStatus)}`}>
          {order.orderStatus.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Customer Record */}
      <div className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/50 rounded-md p-2.5 mb-4">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-md bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800 overflow-hidden shadow-none">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.firstname} className="w-full h-full object-cover" />
            ) : (
              <User size={14} className="text-slate-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
             <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
              {user ? `${user.firstname} ${user.lastname}` : "GUEST ACCOUNT"}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <Phone size={8} className="text-orange-600" />
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">
                {user?.phone || order.userOrderId?.phone || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Manifest Summary */}
      <div className="flex-1 mb-5">
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3 border-b border-slate-50 dark:border-slate-800 pb-1">Manifest</p>

        {detailedItems.length > 0 ? (
          <div className="space-y-2">
            {detailedItems.slice(0, 2).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <div className="size-7 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex-shrink-0 flex items-center justify-center">
                  <ShoppingBag size={10} className="text-slate-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate leading-none mb-1">{item.variant?.name || "FOOD ITEM"}</p>
                  <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest">UNIT QTY: {item.quantity}</p>
                </div>
              </div>
            ))}
            {detailedItems.length > 2 && (
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 pl-1">
                + {detailedItems.length - 2} ADDITIONAL POSITIONS
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 p-2 border border-dashed border-slate-100 dark:border-slate-800 rounded-md">
            <ShoppingBag size={12} strokeWidth={3} />
            <span className="text-[9px] font-black uppercase tracking-widest">{itemCount} UNITS LOGGED</span>
          </div>
        )}
      </div>

      {/* Settlement & Actions */}
      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
        <div>
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Settlement Amt</p>
          <p className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
            ₦{order.vendorTotal?.toLocaleString() || "0.00"}
          </p>
        </div>
        
        <div className="flex items-center gap-1.5">
          {(order.orderStatus === 'ready' || order.orderStatus === 'ready_for_pickup') && (vendorDetails?.vendor?.deliveryManagedBy !== 'admin' && vendorDetails?.deliveryManagedBy !== 'admin') && (
            <button
              onClick={() => onAssign?.(order.userOrderId?._id || order.userOrderId)}
              className="flex items-center justify-center size-8 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-all active:scale-90"
              title="ASSIGN COURIER"
            >
              <Bike size={14} />
            </button>
          )}

          <Link
            href={`/vendors/order/${order._id?.$oid || order._id}`}
            className="flex items-center gap-1.5 h-8 px-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-black uppercase tracking-widest rounded-md transition-all active:scale-95 group/btn"
          >
            LOGS <ChevronRight size={12} className="transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        </div>
      </div>

    </div>
  );
}
