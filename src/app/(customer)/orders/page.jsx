"use client";

import { useEffect, useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import Header2 from "@/app/components/App_Header/Header2";
import { ShoppingCart, Package, Trash2, ArrowRight, Minus, Plus, ShoppingBag, Utensils, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { useApi } from "@/app/context/ApiContext";
import axios from "axios";
import { OrderCardSkeleton } from "@/app/components/skeleton/OrderCardSkeleton";
import { motion } from "framer-motion";
import { Pencil, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import FoodCustomizationModal from "@/app/components/Cart/FoodCustomizationModal";
import Link from "next/link";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';


function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("activeTab") || "cart";

  const { cart, increaseQuantity, decreaseQuantity, removeFromCart, updateCartItem } = useCart();
  const { user } = useUserStorage();
  const { baseUrl } = useApi();
   const [activeTab, setActiveTab] = useState(initialTab);
   const [swiperInstance, setSwiperInstance] = useState(null);


  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [foodForEdit, setFoodForEdit] = useState(null);
  const [isFetchingFood, setIsFetchingFood] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [editingPortion, setEditingPortion] = useState(null);

  const handleEditClick = async (item) => {
    if (isFetchingFood) return;
    setIsFetchingFood(true);
    setEditingItem(item);
    try {
      const res = await axios.get(`/v1/vendors/${item.vendorId}/menu/items/${item.foodId}`);
      if (res.data && res.data.item) {
        const food = { ...res.data.item, vendor: { _id: item.vendorId, storeName: item.storeName } };
        setFoodForEdit(food);
        setEditModalOpen(true);
      } else {
        toast.error("Item details unavailable");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load item for editing");
    } finally {
      setIsFetchingFood(false);
    }
  };

  const handleUpdateOrder = (foodId, portionId, payload) => {
    if (editingItem) {
      updateCartItem(foodId, portionId, payload, editingItem.cartId);
    }
    setEditModalOpen(false);
    setEditingItem(null);
    setFoodForEdit(null);
  };

  const fetchUserOrders = async () => {
    if (!user) return { orders: [] };
    const res = await axios.get(`${baseUrl}/orders/my-orders`, {
      withCredentials: true,
    });
    return res.data;
  };

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["userOrders", user?._id],
    queryFn: fetchUserOrders,
    enabled: !!user && activeTab === "orders",
    retry: false,
  });

  const orders = data?.orders || [];

  const copyOrderId = async (event, orderId) => {
    event.stopPropagation();
    if (!orderId) return;

    try {
      await navigator.clipboard.writeText(orderId);
      toast.success("Order ID copied");
    } catch {
      toast.error("Unable to copy order ID");
    }
  };

  const getRestaurantId = (item) => item.vendorId || item.restaurantId || "unknown";
  const getItemPrice = (item) => item.price_naira || item.price || 0;

  // Group items by vendorId for Cart
  const groupedCart = cart.reduce((acc, item) => {
    const key = getRestaurantId(item);
    if (!acc[key]) {
      acc[key] = { storeName: item.storeName, items: [] };
    }
    acc[key].items.push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col transition-colors duration-300">
      <Header2 />

      <main className="flex-1 max-w-4xl w-full mx-auto px-2 md:p-4">
        {/* Custom Tabs */}
        <div className="flex bg-zinc-200/50 dark:bg-zinc-800/50 p-1 rounded-xl w-full max-w-md mx-auto mb-6 sticky top-[72px] z-20 backdrop-blur-md">
          <button
            onClick={() => {
              setActiveTab("cart");
              swiperInstance?.slideTo(0);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "cart"
              ? "bg-white dark:bg-zinc-700 text-orange-600 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
          >
            <ShoppingCart size={16} />
            Cart
            {cart.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === 'cart' ? 'bg-orange-100/80 text-orange-600' : 'bg-zinc-300/40 text-zinc-500'}`}>
                {cart.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("orders");
              swiperInstance?.slideTo(1);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "orders"
              ? "bg-white dark:bg-zinc-700 text-orange-600 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
          >
            <Package size={16} />
            Orders
            {orders.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === 'orders' ? 'bg-orange-100/80 text-orange-600' : 'bg-zinc-300/40 text-zinc-500'}`}>
                {orders.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
         <div className="">

           <Swiper
             onSwiper={setSwiperInstance}
             onSlideChange={(swiper) => {
               setActiveTab(swiper.activeIndex === 0 ? 'cart' : 'orders');
             }}
             initialSlide={initialTab === 'orders' ? 1 : 0}
             speed={300}
             simulateTouch={true}
             touchRatio={1}
             style={{ width: '100%' }}
           >
             <SwiperSlide style={{ height: 'auto', minHeight: '60vh' }}>
               <div className="space-y-6">
                 {Object.keys(groupedCart).length === 0 ? (
                   <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[40px] border border-dashed border-zinc-200 dark:border-zinc-800 shadow-sm">
                     <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 rounded-[28px] flex items-center justify-center mx-auto mb-6 transform rotate-12">
                       <ShoppingCart className="text-orange-500" size={32} strokeWidth={1.5} />
                     </div>
                     <h3 className="text-xl font-black italic uppercase tracking-tight text-zinc-900 dark:text-white">Your bag is empty</h3>
                     <p className="text-zinc-500 text-xs mt-2 max-w-[200px] mx-auto font-medium">Looks like you haven't added any deliciousness yet.</p>
                     <button
                       onClick={() => router.push("/")}
                       className="mt-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-zinc-200 dark:shadow-none"
                     >
                       Browse Food
                     </button>
                   </div>
                 ) : (
                   <>
                     <div className="space-y-4">
                       {Object.entries(groupedCart).map(([vendorId, group]) => {
                         const groupSubtotal = group.items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);

                         return (
                         <div key={vendorId} className="bg-white dark:bg-zinc-900 rounded-[32px] p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden relative">
                           {/* Store Header */}
                           <div className="flex justify-between items-center mb-5 pb-3 border-b border-zinc-50 dark:border-zinc-800">
                             <div className="flex items-center gap-2">
                               <div className="w-1.5 h-4 bg-orange-500 rounded-full" />
                               <h3 className="font-black text-zinc-900 dark:text-white text-[11px] uppercase tracking-widest italic">{group.storeName}</h3>
                             </div>
                             <span className="text-[9px] font-black text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-lg uppercase">
                               {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                             </span>
                           </div>

                           <div className="space-y-4">
                             {group.items.map((item, index) => {
                               const itemKey = item.cartId || index;

                               return (
                                 <div key={itemKey} className="flex gap-4 group">

                                   <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-800 flex-shrink-0 shadow-inner">
                                     <img
                                       src={item.image_url || "/placeholder.jpg"}
                                       alt={item.name}
                                       className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                     />
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                   </div>
                                   <div className="flex-1 min-w-0 flex flex-col justify-start">
                                     <div className="flex justify-between items-start">
                                       <div>
                                         <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">{item.name}</h4>
                                         {/* Portions and Options */}
                                         <div className="text-[10px] text-zinc-500 mt-1 space-y-0.5">
                                           <p className="font-medium bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded w-fit text-zinc-700 dark:text-zinc-300">
                                             {item.type === 'combo' ? 'Bundle' : `Size: ${item.portion_label}`}
                                           </p>

                                           {item.selected_options?.length > 0 && (
                                             <p className="opacity-80 flex flex-wrap gap-1">
                                               {item.selected_options.map((opt, i) => (
                                                 <span key={i} className="after:content-[','] last:after:content-['']">
                                                   {opt.label}
                                                 </span>
                                               ))}
                                             </p>
                                           )}
                                         </div>
                                       </div>
                                       <p className="text-sm font-black text-zinc-900 dark:text-white tabular-nums">₦{(getItemPrice(item) * item.quantity).toLocaleString()}</p>
                                     </div>

                                     <div className="flex items-end justify-between mt-auto pt-2">
                                       <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter self-center">₦{getItemPrice(item).toLocaleString()} / unit</p>

                                       <div className="flex items-center gap-3">
                                         {item.type !== 'combo' && (
                                           <button
                                             onClick={() => handleEditClick(item)}
                                             className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all active:scale-90 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-sm"
                                           >
                                             {isFetchingFood && editingItem === item ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
                                           </button>
                                         )}

                                         <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-1 border border-zinc-100 dark:border-zinc-800 shadow-inner">
                                           <button
                                             onClick={() => decreaseQuantity(item.foodId, item.portionId, item.variantId, item.cartId)}
                                             className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shadow-sm hover:text-orange-600 transition-all border border-zinc-100 dark:border-zinc-700"
                                           >
                                             <Minus size={12} strokeWidth={3} />
                                           </button>
                                           <span className="w-6 text-center text-[11px] font-black text-zinc-900 dark:text-white tabular-nums">{item.quantity}</span>
                                           <button
                                             onClick={() => increaseQuantity(item.foodId, item.portionId, item.variantId, item.cartId)}
                                             className="w-7 h-7 flex items-center justify-center rounded-lg bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"
                                           >
                                             <Plus size={12} strokeWidth={3} />
                                           </button>
                                         </div>
                                         <button
                                           onClick={() => removeFromCart(item.foodId, item.portionId, item.variantId, item.cartId)}
                                           className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all active:scale-90 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-sm"
                                         >
                                           <Trash2 size={14} />
                                         </button>
                                       </div>
                                     </div>
                                   </div>
                                 </div>
                               )
                             })}
                           </div>
                           <div className="mt-5 pt-4 border-t border-zinc-50 dark:border-zinc-800 flex items-center justify-between gap-3">
                             <div>
                               <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">Restaurant Total</p>
                               <p className="text-lg font-black italic text-zinc-900 dark:text-white">₦{groupSubtotal.toLocaleString()}</p>
                             </div>
                             <button
                               onClick={() => router.push(`/checkout?restaurantId=${encodeURIComponent(vendorId)}`)}
                               className="h-11 px-5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-lg dark:shadow-none"
                             >
                               Checkout
                               <ArrowRight size={14} />
                             </button>
                           </div>
                         </div>
                         );
                       })}
                     </div>
                   </>
                 )}
               </div>
             </SwiperSlide>

             <SwiperSlide style={{ height: 'auto', minHeight: '60vh' }}>
               <div className="space-y-4">
                 {!user ? (
                   <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                     <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Package className="text-zinc-400" size={24} />
                     </div>
                     <p className="text-zinc-500 dark:text-zinc-400 font-medium">Please sign in to view your orders.</p>
                     <button onClick={() => router.push("/auth/signin")} className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-full font-bold">Sign In</button>
                   </div>
                 ) : isLoading ? (
                   Array.from({ length: 4 }).map((_, idx) => <OrderCardSkeleton key={idx} />)
                 ) : isError ? (
                   <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.3 }}
                     className="flex flex-col items-center justify-center py-16 text-center"
                   >
                     <div className="w-24 h-24 bg-orange-50 dark:bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
                       <AlertCircle className="text-orange-500" size={48} />
                     </div>
                     <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Couldn't Load Your Orders</h3>
                     <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm">
                       Something went wrong on our end. Your orders are safe — please try again.
                     </p>
                     <button
                       onClick={() => refetch()}
                       disabled={isRefetching}
                       className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-6 py-3 mb-4 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                     >
                       <RefreshCw size={20} className={isRefetching ? "animate-spin" : ""} />
                       Retry
                     </button>
                     <Link href="/support" className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors font-medium">
                       Contact support
                     </Link>
                   </motion.div>
                 ) : orders.length === 0 ? (
                   <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                     <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                       <ShoppingBag className="text-zinc-400" size={24} />
                     </div>
                     <p className="text-zinc-500 dark:text-zinc-400 font-medium">You have no orders yet.</p>
                     <button onClick={() => router.push("/")} className="mt-4 text-orange-500 font-semibold">Browse Restaurants</button>
                   </div>
                 ) : (
                   orders.map((order) => (
                     <div
                       key={order._id}
                       onClick={() => router.push(`/track-orders/${order.orderId}`)}
                       className="bg-white dark:bg-zinc-900 rounded-2xl p-3 cursor-pointer border border-zinc-100 dark:border-zinc-800 hover:shadow-md hover:border-orange-100 transition-all group"
                     >
                       <div className="flex justify-between items-start mb-3">
                         <div className="space-y-0.5">
                           <div className="flex items-center gap-1.5">
                             <span className="font-bold text-zinc-900 dark:text-white text-sm">Order #{order.orderId}</span>
                             <button
                               type="button"
                               onClick={(event) => copyOrderId(event, order.orderId)}
                               className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 text-zinc-400 transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-orange-500/30 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
                               aria-label="Copy order ID"
                             >
                               <Copy size={13} />
                             </button>
                             <ArrowRight size={12} className="text-zinc-300 dark:text-zinc-600 group-hover:text-orange-500 transition-colors" />
                           </div>
                           <p className="text-[10px] text-zinc-400">
                             {new Date(order.createdAt).toLocaleDateString(undefined, {
                               month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                             })}
                           </p>
                         </div>
                         <div className="flex flex-col items-end gap-1.5">
                           <div className="flex gap-1.5 items-center">
                             <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md font-bold ${order.orderStatus === "pending" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-100 dark:border-amber-900/30" :
                               order.orderStatus === "processing" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 border border-blue-100 dark:border-blue-900/30" :
                                 order.orderStatus === "delivered" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30" :
                                   "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-700"
                               }`}>
                               {order.orderStatus}
                             </span>
                           </div>
                         </div>
                       </div>

                       <div className="flex justify-between items-center bg-zinc-50/80 dark:bg-zinc-800/80 rounded-xl p-2.5">
                         <div className="flex -space-x-1.5">
                           {order.items.slice(0, 4).map((item, i) => (
                             <img key={i} src={item.image_url || "/placeholder.jpg"} className="w-7 h-7 rounded-lg border-2 border-white dark:border-zinc-800 object-cover" alt="" title={item.name} />
                           ))}
                           {order.items.length > 4 && (
                             <div className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-700 border-2 border-zinc-50 dark:border-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-600 dark:text-zinc-300">
                               +{order.items.length - 4}
                             </div>
                           )}
                         </div>
                         <div className="text-right">
                           <p className="text-[10px] text-zinc-400 font-medium">Amount Paid</p>
                           <p className="text-sm font-bold text-zinc-900 dark:text-white">₦{order.total?.toLocaleString()}</p>
                         </div>
                       </div>
                     </div>
                   ))
                 )}
               </div>
             </SwiperSlide>
           </Swiper>
         </div>
       </main>

      <FoodCustomizationModal
        food={foodForEdit}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        initialEditItem={editingItem}
        onUpdate={handleUpdateOrder}
        onAdd={() => { }}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}
