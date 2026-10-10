"use client";

import { useEffect, useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import Header2 from "@/app/components/App_Header/Header2";
import { ShoppingCart, Package, Trash2, ArrowRight, Minus, Plus, ShoppingBag, Utensils, Copy } from "lucide-react";
import toast from "react-hot-toast";
import customerApi from "@/app/lib/customerApi";
import { getMenuItemDetail } from "@/app/lib/menuApi";
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

  const { cart, increaseQuantity, decreaseQuantity, removeFromCart, updateCartItem, startAnotherPersonPlate, continuePersonPlate, activeMealGroups } = useCart();
  const { user } = useUserStorage();
   const [activeTab, setActiveTab] = useState(initialTab);
   const [swiperInstance, setSwiperInstance] = useState(null);
   const [orderFilter, setOrderFilter] = useState("all");


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
      const response = await getMenuItemDetail(item.vendorId, item.foodId);
      if (response?.item) {
        const food = { ...response.item, vendor: { _id: item.vendorId, storeName: item.storeName } };
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
    const res = await customerApi.get("/orders/my-orders");
    return res.data;
  };

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["userOrders", user?._id],
    queryFn: fetchUserOrders,
    enabled: !!user && activeTab === "orders",
    retry: false,
  });

  const orders = data?.orders || [];
  const getOrderStatus = (order) => String(order?.orderStatus || order?.status || "pending").toLowerCase().replace(/[\s-]+/g, "_");
  const getOrderCategory = (order) => {
    const status = getOrderStatus(order);
    if (["delivered", "completed"].includes(status)) return "delivered";
    if (["cancelled", "canceled", "rejected", "failed", "refunded"].includes(status)) return "cancelled";
    return "ongoing";
  };
  const orderFilterOptions = [
    { id: "all", label: "All" },
    { id: "ongoing", label: "Ongoing" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
  ];
  const filteredOrders = orderFilter === "all"
    ? orders
    : orders.filter((order) => getOrderCategory(order) === orderFilter);

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
        <div className="flex bg-zinc-200/50 dark:bg-zinc-800/50 p-1 rounded w-full max-w-md mx-auto mb-6 sticky top-[72px] z-20 backdrop-blur-md">
          <button
            onClick={() => {
              setActiveTab("cart");
              swiperInstance?.slideTo(0);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded text-sm font-semibold transition-all duration-200 ${activeTab === "cart"
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
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded text-sm font-semibold transition-all duration-200 ${activeTab === "orders"
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
                   <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[8px] border border-dashed border-zinc-200 dark:border-zinc-800 shadow-sm">
                     <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 rounded-[8px] flex items-center justify-center mx-auto mb-6 transform rotate-12">
                       <ShoppingCart className="text-orange-500" size={32} strokeWidth={1.5} />
                     </div>
                     <h3 className="text-xl font-medium italic uppercase tracking-tight text-zinc-900 dark:text-white">Your bag is empty</h3>
                     <p className="text-zinc-500 text-xs mt-2 max-w-[200px] mx-auto font-medium">Looks like you haven't added any deliciousness yet.</p>
                     <button
                       onClick={() => router.push("/")}
                       className="mt-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-3 rounded text-xs font-medium uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-zinc-200 dark:shadow-none"
                     >
                       Browse Food
                     </button>
                   </div>
                 ) : (
                   <>
                     <div className="space-y-4">
                       {Object.entries(groupedCart).map(([vendorId, group]) => {
                         const groupSubtotal = group.items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
                         const activePlate = activeMealGroups[vendorId]?.label;
                         const plateItems = [...group.items].sort((first, second) => String(first.meal_group_label || "Person 1").localeCompare(String(second.meal_group_label || "Person 1")));

                         return (
                         <div key={vendorId} className="bg-white dark:bg-zinc-900 rounded-[8px] p-2.5 sm:p-3 border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden relative">
                           {/* Store Header */}
                           <div className="flex justify-between items-center mb-3 pb-3 border-b border-zinc-50 dark:border-zinc-800">
                             <div className="flex items-center gap-2">
                               <div className="w-1.5 h-4 bg-orange-500 rounded-full" />
                               <h3 className="font-medium text-zinc-900 dark:text-white text-[11px] uppercase tracking-widest italic">{group.storeName}</h3>
                             </div>
                             <span className="text-[9px] font-medium text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded uppercase">
                               {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                             </span>
                           </div>

                           <div className="mb-2 flex items-center gap-2 rounded-md border border-orange-100 bg-orange-50/60 px-2 py-1.5 dark:border-orange-500/20 dark:bg-orange-500/10">
                             <div className="min-w-0 flex-1">
                               <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">Ordering for: {activePlate || "Person 1"}</p>
                               <details className="group mt-0.5">
                                 <summary className="cursor-pointer text-[9px] text-zinc-500 dark:text-zinc-400">Ordering for multiple people?</summary>
                                 <p className="mt-1 text-[9px] leading-4 text-zinc-600 dark:text-zinc-300">Add each person&apos;s items under their own plate, then checkout once. We&apos;ll label the items for easier packing.</p>
                               </details>
                             </div>
                             <button type="button" onClick={() => { startAnotherPersonPlate(vendorId); router.push(`/restaurants/${encodeURIComponent(vendorId)}`); }} className="shrink-0 rounded border border-orange-200 bg-white px-2 py-1.5 text-[8px] font-semibold uppercase tracking-wide text-orange-700 transition-colors hover:bg-orange-100 dark:border-orange-500/30 dark:bg-zinc-900 dark:text-orange-300" aria-label="Add another person's order">
                               Add person
                             </button>
                           </div>

                           <div className="space-y-2">
                             {plateItems.map((item, index) => {
                               const itemKey = item.cartId || index;
                               const plateLabel = item.meal_group_label || "Person 1";
                               const previousPlateLabel = index > 0 ? (plateItems[index - 1].meal_group_label || "Person 1") : null;

                               return (
                                 <div key={itemKey}>
                                   {plateLabel !== previousPlateLabel && (
                                     <div className="mb-1.5 flex items-center justify-between gap-2 rounded-md bg-zinc-100 px-2.5 py-1.5 dark:bg-zinc-800">
                                       <div>
                                         <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">{plateLabel}</span>
                                         {activePlate === plateLabel && <span className="ml-2 text-[10px] font-medium text-orange-600">Adding food here</span>}
                                       </div>
                                       <button
                                         type="button"
                                         onClick={() => {
                                           continuePersonPlate(vendorId, plateLabel);
                                           router.push(`/restaurants/${encodeURIComponent(vendorId)}`);
                                         }}
                                         className="flex shrink-0 items-center gap-1 rounded-md bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-orange-700 shadow-sm transition-colors hover:bg-orange-50 dark:bg-zinc-900 dark:text-orange-300"
                                       >
                                         <Plus size={10} strokeWidth={3} />
                                         Add items
                                       </button>
                                     </div>
                                   )}
                                 <div className="flex gap-2.5 group">

                                   <div className="relative h-14 w-14 rounded-md overflow-hidden bg-zinc-50 dark:bg-zinc-800 flex-shrink-0 shadow-inner sm:h-16 sm:w-16">
                                     <img
                                       src={item.image_url || "/placeholder.jpg"}
                                       alt={item.name}
                                       className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                     />
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                   </div>
                                   <div className="flex min-w-0 flex-1 flex-col justify-start">
                                     <div className="flex min-w-0 items-start justify-between gap-2">
                                       <div className="min-w-0">
                                         <h4 className="line-clamp-1 text-xs font-semibold leading-tight text-zinc-900 dark:text-white sm:text-sm">{item.name}</h4>
                                         {/* Portions and Options */}
                                         <div className="mt-1 space-y-0.5 text-[9px] text-zinc-500">
                                           <p className="w-fit max-w-full truncate rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
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
                                       <p className="shrink-0 text-xs font-semibold tabular-nums text-zinc-900 dark:text-white sm:text-sm">₦{(getItemPrice(item) * item.quantity).toLocaleString()}</p>
                                     </div>

                                     <div className="mt-auto flex items-center justify-between gap-1 pt-1.5">
                                       <p className="min-w-0 truncate text-[9px] font-medium text-zinc-400">₦{getItemPrice(item).toLocaleString()} / unit</p>

                                       <div className="flex shrink-0 items-center gap-1">

                                         {item.type !== "combo" && (
                                           <button
                                             type="button"
                                             onClick={() => handleEditClick(item)}
                                             disabled={isFetchingFood}
                                             className="flex h-8 items-center gap-1 rounded border border-zinc-100 bg-white px-1.5 text-[9px] font-semibold text-zinc-600 shadow-sm transition-all hover:text-orange-600 disabled:cursor-wait disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                             aria-label={`Edit choices for ${item.name}`}
                                           >
                                             {isFetchingFood && editingItem?.cartId === item.cartId ? <Loader2 size={11} className="animate-spin" /> : <Pencil size={11} />}
                                             Edit choices
                                           </button>
                                         )}

                                         <div className="flex items-center gap-0.5 rounded border border-zinc-100 bg-zinc-50 p-0.5 shadow-inner dark:border-zinc-800 dark:bg-zinc-800/50">
                                           <button
                                             type="button"
                                             onClick={() => decreaseQuantity(item.foodId, item.portionId, item.variantId, item.cartId)}
                                             className="flex h-7 w-7 items-center justify-center rounded bg-white text-zinc-600 shadow-sm transition-all hover:text-orange-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                                             aria-label={`Decrease quantity of ${item.name}`}
                                           >
                                             <Minus size={12} strokeWidth={3} />
                                           </button>
                                           <span className="w-5 text-center text-[10px] font-semibold tabular-nums text-zinc-900 dark:text-white">{item.quantity}</span>
                                           <button
                                             type="button"
                                             onClick={() => increaseQuantity(item.foodId, item.portionId, item.variantId, item.cartId)}
                                             className="flex h-7 w-7 items-center justify-center rounded bg-orange-500 text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-orange-600"
                                             aria-label={`Increase quantity of ${item.name}`}
                                           >
                                             <Plus size={12} strokeWidth={3} />
                                           </button>
                                         </div>
                                         <button
                                           type="button"
                                           onClick={() => removeFromCart(item.foodId, item.portionId, item.variantId, item.cartId)}
                                           className="flex h-8 w-8 items-center justify-center rounded border border-zinc-100 bg-white text-rose-500 shadow-sm transition-all hover:bg-rose-50 active:scale-90 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-rose-500/10"
                                           aria-label={`Remove ${item.name} from cart`}
                                         >
                                           <Trash2 size={14} />
                                         </button>
                                       </div>
                                     </div>
                                   </div>
                                 </div>
                                 </div>
                               )
                             })}
                           </div>
                           <div className="pt-4 border-t border-zinc-50 dark:border-zinc-800 flex items-center justify-between gap-3">
                             <div>
                               <p className="text-[8px] font-medium uppercase tracking-[0.2em] text-zinc-400">Restaurant Total</p>
                               <p className="text-lg font-medium italic text-zinc-900 dark:text-white">₦{groupSubtotal.toLocaleString()}</p>
                             </div>
                             <button
                               onClick={() => router.push(`/checkout?restaurantId=${encodeURIComponent(vendorId)}`)}
                               className="h-11 px-5 rounded bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-medium uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-lg dark:shadow-none"
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
               <div className="space-y-2">
                 {!user ? (
                   <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded border border-zinc-100 dark:border-zinc-800">
                     <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Package className="text-zinc-400" size={24} />
                     </div>
                     <p className="text-zinc-500 dark:text-zinc-400 font-medium">Please sign in to view your orders.</p>
                     <button onClick={() => router.push("/auth/signin")} className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-full font-semibold">Sign In</button>
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
                     <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">Couldn't Load Your Orders</h3>
                     <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm">
                       Something went wrong on our end. Your orders are safe — please try again.
                     </p>
                     <button
                       onClick={() => refetch()}
                       disabled={isRefetching}
                       className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded px-6 py-3 mb-4 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                     >
                       <RefreshCw size={20} className={isRefetching ? "animate-spin" : ""} />
                       Retry
                     </button>
                     <Link href="/support" className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors font-medium">
                       Contact support
                     </Link>
                   </motion.div>
                 ) : orders.length === 0 ? (
                   <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded border border-zinc-100 dark:border-zinc-800">
                     <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                       <ShoppingBag className="text-zinc-400" size={24} />
                     </div>
                     <p className="text-zinc-500 dark:text-zinc-400 font-medium">You have no orders yet.</p>
                     <button onClick={() => router.push("/")} className="mt-4 text-orange-500 font-semibold">Browse Restaurants</button>
                   </div>
                 ) : (
                   <>
                   <div className="no-scrollbar -mx-2 flex gap-2 overflow-x-auto px-2 pb-1" role="tablist" aria-label="Filter orders">
                     {orderFilterOptions.map((option) => {
                       const count = option.id === "all"
                         ? orders.length
                         : orders.filter((order) => getOrderCategory(order) === option.id).length;
                       const selected = orderFilter === option.id;
                       return (
                         <button
                           key={option.id}
                           type="button"
                           role="tab"
                           aria-selected={selected}
                           onClick={() => setOrderFilter(option.id)}
                           className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${selected
                             ? "border-orange-500 bg-orange-500 text-white"
                             : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                           }`}
                         >
                           {option.label}
                           <span className={`text-[10px] tabular-nums ${selected ? "text-white/80" : "text-zinc-400"}`}>{count}</span>
                         </button>
                       );
                     })}
                   </div>
                   {filteredOrders.length === 0 ? (
                     <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-4 py-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
                       <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">No {orderFilter} orders</p>
                       <button type="button" onClick={() => setOrderFilter("all")} className="mt-2 text-xs font-semibold text-orange-600">Show all orders</button>
                     </div>
                   ) : filteredOrders.map((order) => (
                     <div
                       key={order._id}
                       onClick={() => router.push(`/track-orders/${order.orderId}`)}
                       className="group cursor-pointer rounded-xl border border-zinc-100 bg-white p-2.5 transition-all hover:border-orange-100 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                     >
                       <div className="mb-2 flex items-center justify-between gap-2">
                         <div className="min-w-0">
                           <div className="flex items-center gap-1">
                             <span className="truncate text-xs font-semibold text-zinc-900 dark:text-white">Order #{order.orderId}</span>
                             <button
                               type="button"
                               onClick={(event) => copyOrderId(event, order.orderId)}
                               className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-zinc-100 bg-zinc-50 text-zinc-400 transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-orange-500/30 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
                               aria-label="Copy order ID"
                             >
                               <Copy size={11} />
                             </button>
                           </div>
                           <p className="mt-0.5 text-[9px] text-zinc-400">
                             {new Date(order.createdAt).toLocaleDateString(undefined, {
                               month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                             })}
                           </p>
                         </div>
                         <div className="flex shrink-0 flex-col items-end gap-1">
                           <div className="flex items-center gap-1.5">
                             <span className={`rounded-md border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide ${getOrderStatus(order) === "pending" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-100 dark:border-amber-900/30" :
                               ["processing", "accepted", "preparing", "ready_for_pickup", "out_for_delivery"].includes(getOrderStatus(order)) ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-100 dark:border-blue-900/30" :
                                 ["delivered", "completed"].includes(getOrderStatus(order)) ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-900/30" :
                                   "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-700"
                               }`}>
                               {getOrderStatus(order).replace(/_/g, " ")}
                             </span>
                           </div>
                         </div>
                       </div>

                       <div className="flex items-center justify-between rounded-lg bg-zinc-50/80 px-2 py-1.5 dark:bg-zinc-800/80">
                         <div className="flex -space-x-1.5">
                           {(Array.isArray(order.items) ? order.items : []).slice(0, 4).map((item, i) => (
                             <img key={i} src={item.image_url || "/placeholder.jpg"} className="h-6 w-6 rounded border-2 border-white object-cover dark:border-zinc-800" alt="" title={item.name} />
                           ))}
                           {Array.isArray(order.items) && order.items.length > 4 && (
                             <div className="flex h-6 w-6 items-center justify-center rounded border-2 border-zinc-50 bg-white text-[8px] font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-700 dark:text-zinc-300">
                               +{order.items.length - 4}
                             </div>
                           )}
                         </div>
                         <div className="text-right">
                           <p className="text-[9px] font-medium text-zinc-400">Amount paid</p>
                           <p className="text-xs font-semibold text-zinc-900 dark:text-white">₦{order.total?.toLocaleString()}</p>
                         </div>
                       </div>
                     </div>
                   ))}
                   </>
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
