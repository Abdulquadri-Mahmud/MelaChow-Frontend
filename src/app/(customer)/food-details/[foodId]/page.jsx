"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import toast from 'react-hot-toast';
import {
  Clock,
  ArrowLeft,
  Truck,
  Store,
  Star,
  Plus,
  Minus,
  ShoppingCart
} from "lucide-react";
import { BiCartAdd } from "react-icons/bi";

import { useCart } from "@/app/context/CartContext";
import { isVendorOpen as isVendorOpenFn } from "@/app/lib/utils";
import { getPublicFoodDetail } from "@/app/lib/menuApi";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";
import FoodDetailsSkeleton from "@/app/skeleton/FoodDetailsSkeleton";

import FoodCustomizationModal from "@/app/components/Cart/FoodCustomizationModal";

export default function FoodDetails() {
  const router = useRouter();
  const { foodId } = useParams();
  const { addToCart, cart } = useCart();

  // Data State
  const [food, setFood] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Default customization state for base item
  const [selectedPortion, setSelectedPortion] = useState(null);
  const [selections, setSelections] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [portionQuantity, setPortionQuantity] = useState(1);

  // Modal State for combos
  const [modalDetails, setModalDetails] = useState({
    isOpen: false,
    variant: null, // this will be a combo
    portion: null
  });

  // Reset base customizer when food fetches
  useEffect(() => {
    if (food) {
        const defaultPortion = food?.portions?.find(p => p.is_default) || food?.portions?.[0] || null;
        setSelectedPortion(defaultPortion);
        setSelections({});
        setQuantity(1);
        setPortionQuantity(1);
    }
  }, [food]);

  // Initialize Client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch Food
  useEffect(() => {
    const fetchFood = async () => {
      try {
        setIsLoading(true);
        const res = await getPublicFoodDetail(foodId);
        let foodData = res?.food;

        if (foodData) {
          foodData.choiceGroups = foodData.choiceGroups || foodData.choice_groups || [];
        }

        setFood(foodData);
        setIsError(false);
      } catch (err) {
        console.error("❌ Failed to fetch food:", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (foodId) fetchFood();
  }, [foodId]);

  // Handlers
  const openModal = (variant = null, portion = null) => {
    setModalDetails({
      isOpen: true,
      variant,
      portion
    });
  };

  const closeModal = () => {
    setModalDetails(prev => ({ ...prev, isOpen: false }));
  };

  const handleAddToCart = (payload) => {
    addToCart(payload);
    toast.success("Added to Order!");
  };

  // Base Item Customizer Logic
  const basePriceNaira = (selectedPortion?.price_naira || 0) * portionQuantity;
  
  const addonsPrice = Object.values(selections).reduce((acc, sel) => {
      if (Array.isArray(sel)) {
          return acc + sel.reduce((s, o) => s + ((o.price_modifier_naira || 0) * (o.selectionQuantity || 1)), 0);
      }
      return acc + ((sel?.price_modifier_naira || 0) * (sel?.selectionQuantity || 1));
  }, 0);

  const totalUnit = (basePriceNaira + addonsPrice);
  const total = totalUnit * quantity;

  const isOptionSelected = (groupIndex, label) => {
      const sel = selections[groupIndex];
      if (Array.isArray(sel)) return sel.some(i => i.label === label);
      return sel?.label === label;
  };

  const toggleChoice = (groupIndex, group, option) => {
      setSelections(prev => {
          const current = prev[groupIndex];
          const isMulti = group.max_selections > 1;

          if (!isMulti) {
              if (current?.label === option.label) {
                  const n = { ...prev };
                  delete n[groupIndex];
                  return n;
              }
              return { ...prev, [groupIndex]: { ...option, selectionQuantity: 1 } };
          }

          const list = Array.isArray(current) ? current : [];
          const exists = list.find(i => i.label === option.label);
          if (exists) {
              return {
                  ...prev,
                  [groupIndex]: list.filter(i => i.label !== option.label)
              };
          }

          const totalInGroup = list.reduce((acc, curr) => acc + (curr.selectionQuantity || 1), 0);
          if (totalInGroup >= group.max_selections) {
              toast.error(`Max ${group.max_selections} total items for ${group.name}`);
              return prev;
          }

          return { ...prev, [groupIndex]: [...list, { ...option, selectionQuantity: 1 }] };
      });
  };

  const updateOptionQuantity = (groupIndex, optionLabel, delta, group) => {
      setSelections(prev => {
          const current = prev[groupIndex];
          const isMulti = group.max_selections > 1;

          if (!isMulti) {
              if (!current || current.label !== optionLabel) return prev;
              const newQty = (current.selectionQuantity || 1) + delta;
              if (newQty <= 0) {
                  const n = { ...prev };
                  delete n[groupIndex];
                  return n;
              }
              if (delta > 0 && newQty > group.max_selections) {
                  toast.error(`Max ${group.max_selections} selections for ${group.name}`);
                  return prev;
              }
              return { ...prev, [groupIndex]: { ...current, selectionQuantity: newQty } };
          }

          const list = Array.isArray(current) ? current : [];
          const index = list.findIndex(i => i.label === optionLabel);
          if (index === -1) return prev;

          const item = list[index];
          const newQty = (item.selectionQuantity || 1) + delta;
          
          if (newQty <= 0) {
              return {
                  ...prev,
                  [groupIndex]: list.filter(i => i.label !== optionLabel)
              };
          }

          const totalInGroup = list.reduce((acc, curr, i) => acc + (i === index ? newQty : (curr.selectionQuantity || 1)), 0);
          if (delta > 0 && totalInGroup > group.max_selections) {
              toast.error(`Max ${group.max_selections} selections for ${group.name}`);
              return prev;
          }

          const newList = [...list];
          newList[index] = { ...item, selectionQuantity: newQty };
          return { ...prev, [groupIndex]: newList };
      });
  };

  const handleAddToCartBaseItem = () => {
      if (food.portions?.length > 0 && !selectedPortion) {
          toast.error("Please select a size");
          return;
      }

      for (let i = 0; i < (food.choiceGroups || []).length; i++) {
          const group = food.choiceGroups[i];
          const sel = selections[i];
          let count = 0;
          if (Array.isArray(sel)) {
              count = sel.reduce((acc, curr) => acc + (curr.selectionQuantity || 1), 0);
          }
          else if (sel) {
              count = (sel.selectionQuantity || 1);
          }

          if (group.is_required && count < group.min_selections) {
              toast.error(
                  `Please select at least ${group.min_selections} option for "${group.name}"`
              );
              return;
          }
      }

      const selectedOptions = [];
      Object.keys(selections).forEach(key => {
          const gIdx = Number(key);
          const group = food.choiceGroups[gIdx];
          const sel = selections[key];
          const items = Array.isArray(sel) ? sel : (sel ? [sel] : []);
          items.forEach(opt => {
              selectedOptions.push({
                  group_id:             group._id,
                  group_name:           group.name,
                  option_id:            opt._id,
                  label:                opt.label,
                  price_modifier_naira: opt.price_modifier_naira,
                  quantity:             opt.selectionQuantity || 1
              });
          });
      });
      const payload = {
          type:         "item",                // ← ADD explicit type
          foodId:       food._id,
          portionId:    selectedPortion?._id || null, // ← camelCase
          vendorId:     food.vendor?._id,
          storeName:    food.vendor?.storeName || "",
          name:         food.name,
          image_url:    food.image_url || "",
          portion_label: selectedPortion?.label,
          portion_quantity: portionQuantity,
          price_naira:  totalUnit,
          quantity,
          selected_options: selectedOptions.map(opt => ({
              group_id:             opt.group_id,
              option_id:            opt.option_id,
              label:                opt.label,
              price_modifier_naira: opt.price_modifier_naira || 0,
              quantity:             opt.quantity,
          })),
          deliveryFee:  food.vendor?.deliveryFee || food.deliveryFee || 0,
          dietary_type: food.dietary_type,
          item_type:    food.item_type,
      };

      addToCart(payload);
      toast.success("Added to Order!");
      
      router.push('/orders?activeTab=cart');
  };

  const checkAvailability = () => {
    if (!food) return { available: false, reason: "Loading..." };

    if (food.is_available === false) {
      return { available: false, reason: "Currently Unavailable" };
    }

    if (food.is_in_stock === false) {
      return { available: false, reason: "Sold Out" };
    }

    return { available: true };
  };

  if (!isClient) return <div className="min-h-screen bg-white"></div>;

  const totalItems = cart.length;

  const vendorStatus = food?.vendor?.openingHours
    ? getVendorOpenAndCloseStatus(food.vendor.openingHours)
    : "Opening hours unavailable";
  
  const isVendorOpen = vendorStatus.startsWith("Open now");

  const itemAvailability = checkAvailability();

  // Derive base price from cheapest portion
  const basePrice = food?.portions?.length > 0
    ? Math.min(...food.portions.map(p => p.price_naira))
    : null;

  return (
    <>
      {/* 🧭 Header */}
      <header className="flex items-center justify-between px-4 py-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-50 border-b border-zinc-50 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:text-zinc-400 transition-all active:scale-90"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            className="cursor-pointer"
            onClick={() => food?.vendor?._id && router.push(`/restaurants/${food.vendor._id}`)}
          >
            <h1 className="text-[10px] font-semibold text-orange-600 uppercase tracking-[0.2em]">Restaurant</h1>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1 italic uppercase tracking-tighter hover:underline">
              {food?.vendor?.storeName || "Food Details"}
            </h2>
            <p className={`text-[10px] font-bold ${isVendorOpen ? 'text-emerald-500' : 'text-rose-500'}`}>
              {vendorStatus}
            </p>
          </div>
        </div>

        <Link href={'/orders?activeTab=cart'}>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative bg-zinc-900 dark:bg-zinc-100 p-2.5 rounded-2xl">
            <BiCartAdd className="text-white dark:text-zinc-900" size={24} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-orange-500 ring-4 ring-white dark:ring-zinc-900 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-black">
                {totalItems}
              </span>
            )}
          </motion.div>
        </Link>
      </header>

      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto pb-20">
        {isLoading ? (
          <div className="p-2"><FoodDetailsSkeleton /></div>
        ) : isError ? (
          <div className="text-center py-20 px-6">
            <div className="bg-red-50 text-red-500 p-2 rounded-[32px] border border-dashed border-red-200">
              <p className="font-bold">Oops! Failed to load the dish.</p>
              <button onClick={() => window.location.reload()} className="mt-4 text-sm underline font-black">Try Again</button>
            </div>
          </div>
        ) : food ? (
          <div className="space-y-6">

            {/* Main Info Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-1 pt-2">
              <div className="bg-white dark:bg-zinc-900 rounded-[40px] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
                {/* Image Section */}
                <div className="relative w-full bg-zinc-100 dark:bg-zinc-800 p-2">
                  <div className="w-full h-[250px] md:h-[300px] rounded-[32px] overflow-hidden relative">
                    <img
                      src={food?.image_url || "/placeholder.jpg"}
                      alt={food?.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Unavailability badge overlay */}
                    {!itemAvailability.available && (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="bg-black/80 backdrop-blur-md
                          text-white text-[10px] font-bold px-3 py-1
                          rounded-full uppercase tracking-widest
                          border border-white/20">
                          {itemAvailability.reason}
                        </div>
                      </div>
                    )}

                    <div className="absolute top-3 left-3 pr-6 flex flex-wrap gap-2 z-10">
                      {/* Item type badge */}
                      {food.item_type && (
                        <div className="bg-orange-500 text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-orange-500/20">
                          {food.item_type}
                        </div>
                      )}

                      {/* Platform category badge */}
                      {food.platform_category && (
                        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-zinc-800 dark:text-zinc-200 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest border border-zinc-100 dark:border-zinc-800 shadow-sm">
                          {food.platform_category.parent?.name && (
                            <span className="text-zinc-400 dark:text-zinc-500">
                              {food.platform_category.parent.name} ·{" "}
                            </span>
                          )}
                          {food.platform_category.name}
                        </div>
                      )}

                      {/* Dietary type badge */}
                      {food.dietary_type && food.dietary_type !== "mixed" && (
                        <div className={`text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest border border-white/20 backdrop-blur-md ${
                          food.dietary_type === "veg" || food.dietary_type === "vegan"
                            ? "bg-green-500 text-white"
                            : food.dietary_type === "halal"
                            ? "bg-teal-500 text-white"
                            : food.dietary_type === "non-veg"
                            ? "bg-red-500 text-white"
                            : "bg-zinc-800 text-white"
                        }`}>
                          {food.dietary_type}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div className="md:p-5 p-2 pb-4">
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight tracking-tight uppercase mb-2">
                    {food?.name}
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed italic font-medium">
                    "{food?.description || "A masterfully crafted dish prepared with the finest ingredients."}"
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {/* Rating Pill */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <Star size={12} className="text-orange-500 fill-orange-500" />
                      <span>{food.rating > 0 ? food.rating.toFixed(1) : "New"}</span>
                      <span className="text-zinc-300 dark:text-zinc-700">|</span>
                      <span className="text-zinc-500 dark:text-zinc-400">{food.ratingCount || 0} reviews</span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    {/* Time Stat */}
                    <div className="flex items-center gap-3 p-3 bg-zinc-50/80 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100/80 dark:border-zinc-700/80 backdrop-blur-sm">
                      <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl text-orange-500 shadow-sm ring-1 ring-zinc-100 dark:ring-zinc-800"><Clock size={18} /></div>
                      <div>
                        <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Est. Time</p>
                        <p className="text-sm font-black text-zinc-900 dark:text-white leading-none">{food?.prep_time_minutes ? `${food.prep_time_minutes} min` : `25 min`}</p>
                      </div>
                    </div>

                    {/* Delivery */}
                    <div className="flex items-center gap-3 p-3 bg-zinc-50/80 dark:bg-zinc-800/80 rounded-2xl border border-zinc-100/80 dark:border-zinc-700/80 backdrop-blur-sm">
                      <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl text-orange-500 shadow-sm ring-1 ring-zinc-100 dark:ring-zinc-800"><Truck size={18} /></div>
                      <div>
                        <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Delivery</p>
                        <p className="text-sm font-black text-zinc-900 dark:text-white leading-none">
                          {food?.deliveryFee ? `₦${food.deliveryFee.toLocaleString()}` : "Free"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* AVAILABLE OPTIONS SELECTION */}
            <div className="px-4 space-y-4">

              {/* Combos Grid (unchanged) */}
              {food.combos?.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                    <h3 className="text-lg font-black italic text-zinc-900 dark:text-white uppercase tracking-tight">
                      Available Deals 🎁
                    </h3>
                  </div>
                  <div className="grid gap-3">
                    {food.combos.map((combo, i) => (
                      <motion.div
                        key={combo._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white dark:bg-zinc-900 rounded-[28px] p-3 border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 hover:shadow-md transition-all group"
                      >
                        <div className="w-20 h-20 shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden">
                          <img
                            src={combo.image_url || "/placeholder.jpg"}
                            alt={combo.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-zinc-900 dark:text-white truncate italic uppercase tracking-tight">
                            {combo.name}
                          </h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 italic font-medium">
                            {combo.description || "Combo deal"}
                          </p>
                          <p className="text-sm font-black text-orange-600 mt-1">
                            ₦{combo.price_naira?.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => openModal(combo, null)}
                          disabled={!combo.is_available || !itemAvailability.available}
                          className={`w-auto px-4 py-2 shrink-0 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            (!combo.is_available || !itemAvailability.available)
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                              : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 active:scale-95 shadow-lg shadow-zinc-200 dark:shadow-none"
                          }`}
                        >
                          {(!combo.is_available || !itemAvailability.available)
                            ? (!combo.is_available ? "Unavailable" : "Unavail")
                            : <Plus size={20} />
                          }
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Portions Selector */}
              {food.portions?.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                    <h3 className="text-lg font-black italic text-zinc-900 dark:text-white uppercase tracking-tight">Select Portion</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {food.portions.map(portion => {
                      const isSelected = selectedPortion?._id === portion._id;
                      return (
                        <div
                          key={portion._id}
                          onClick={() => {
                            if (!itemAvailability.available) return;
                            if (!isSelected) {
                              setSelectedPortion(portion);
                            }
                          }}
                          className={`relative flex items-center justify-between p-4 rounded-[28px] border-2 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-orange-50/50 dark:bg-orange-500/10 border-orange-500 shadow-[0_0_20px_rgba(255,102,0,0.1)] dark:shadow-[0_0_30px_rgba(255,102,0,0.15)] scale-[1.01]"
                              : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-orange-200 dark:hover:border-orange-500/30"
                          } ${!itemAvailability.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex flex-col">
                            <span className={`text-xs font-black uppercase tracking-wider ${isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                              {portion.label}
                            </span>
                            <span className="text-[11px] font-black text-orange-500 mt-0.5">
                              {portion.price_naira ? `₦${portion.price_naira.toLocaleString()}` : 'Free'}
                            </span>
                          </div>

                          {isSelected && (
                            <div 
                              className="flex items-center gap-2.5 bg-white dark:bg-zinc-800 rounded-xl p-1 shadow-sm border border-zinc-100 dark:border-zinc-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button 
                                onClick={() => setPortionQuantity(Math.max(1, portionQuantity - 1))}
                                disabled={!itemAvailability.available}
                                className="w-[26px] h-[26px] flex items-center justify-center rounded-[8px] hover:bg-orange-50 dark:hover:bg-orange-500/20 text-orange-600 bg-zinc-50 dark:bg-zinc-900"
                              >
                                <Minus size={14} strokeWidth={3} />
                              </button>
                              <span className="text-[13px] font-black text-zinc-900 dark:text-white min-w-[12px] text-center tabular-nums">
                                {portionQuantity}
                              </span>
                              <button 
                                onClick={() => {
                                  if (portion.max_quantity && portionQuantity >= portion.max_quantity) {
                                    toast.error(`Max ${portion.max_quantity} reached`);
                                  } else {
                                    setPortionQuantity(portionQuantity + 1);
                                  }
                                }}
                                disabled={!itemAvailability.available}
                                className="w-[26px] h-[26px] flex items-center justify-center rounded-[8px] hover:bg-orange-50 dark:hover:bg-orange-500/20 text-orange-600 bg-zinc-50 dark:bg-zinc-900"
                              >
                                <Plus size={14} strokeWidth={3} />
                              </button>
                            </div>
                          )}

                          {!isSelected && (
                             <div className="w-[20px] h-[20px] rounded-full border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 shadow-inner" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Choice Groups */}
              {food.choiceGroups?.length > 0 && (
                <div className="space-y-4 mb-8">
                  {food.choiceGroups.map((group, gIdx) => (
                    <div key={group._id} className="bg-white dark:bg-zinc-900 rounded-[32px] p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                        <h4 className="text-[15px] font-black italic text-zinc-900 dark:text-white uppercase tracking-tight">
                          {group.name}
                        </h4>
                        {group.is_required && (
                          <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full ml-auto">
                            REQUIRED
                          </span>
                        )}
                        {!group.is_required && (
                          <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-2.5 py-1 rounded-full ml-auto uppercase tracking-wider">
                            OPTIONAL
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest mb-4">
                        {group.max_selections > 1 ? `Select up to ${group.max_selections}` : "Select one"}
                      </p>

                      <div className="space-y-3">
                        {group.options.filter(o => o.is_available).map(option => {
                          const isSelected = isOptionSelected(gIdx, option.label);
                          return (
                            <div key={option._id}
                                 onClick={() => itemAvailability.available && toggleChoice(gIdx, group, option)}
                                 className={`flex items-center gap-4 p-3 rounded-[20px] border-2 cursor-pointer transition-all ${
                                   isSelected ? "border-orange-500 bg-orange-50/50 dark:bg-orange-500/10 shadow-lg shadow-orange-500/5 rotate-1 scal-[1.02]" : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-orange-200 dark:hover:border-orange-500/30"
                                 } ${!itemAvailability.available ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              {/* Option Image */}
                              <div className="w-12 h-12 rounded-[14px] bg-zinc-50 dark:bg-zinc-800 overflow-hidden shrink-0 shadow-inner">
                                {option.image_url ? (
                                  <img src={option.image_url} alt={option.label} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[20px] opacity-50">🍽️</div>
                                )}
                              </div>
                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-[13px] text-zinc-900 dark:text-white truncate tracking-tight uppercase italic">{option.label}</p>
                                {option.price_modifier_naira > 0 ? (
                                  <p className="text-[11px] font-black text-orange-500">+₦{option.price_modifier_naira.toLocaleString()}</p>
                                ) : (
                                  <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Free</p>
                                )}
                              </div>
                              {/* Selection Indicator */}
                              {isSelected ? (
                                <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-800 rounded-xl p-1 shadow-sm border border-zinc-100 dark:border-zinc-700" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => updateOptionQuantity(gIdx, option.label, -1, group)} disabled={!itemAvailability.available} className="w-[26px] h-[26px] flex items-center justify-center rounded-[8px] hover:bg-orange-50 dark:hover:bg-orange-500/20 text-orange-600 bg-zinc-50 dark:bg-zinc-900">
                                    <Minus size={14} strokeWidth={3} />
                                  </button>
                                  <span className="text-[13px] font-black text-zinc-900 dark:text-white min-w-[12px] text-center">
                                    {Array.isArray(selections[gIdx]) ? selections[gIdx].find(i => i.label === option.label)?.selectionQuantity || 1 : selections[gIdx]?.selectionQuantity || 1}
                                  </span>
                                  <button onClick={() => updateOptionQuantity(gIdx, option.label, 1, group)} disabled={!itemAvailability.available} className="w-[26px] h-[26px] flex items-center justify-center rounded-[8px] hover:bg-orange-50 dark:hover:bg-orange-500/20 text-orange-600 bg-zinc-50 dark:bg-zinc-900">
                                    <Plus size={14} strokeWidth={3} />
                                  </button>
                                </div>
                              ) : (
                                <div className="w-[22px] h-[22px] rounded-full border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        ) : null}
      </div>

      {/* Base Item Add to Order Footer - Fixed Bottom Bar */}
      {food && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-100/50 dark:border-zinc-800/80 pb-safe z-40">
            <div className="max-w-2xl mx-auto flex items-center gap-4">
                
                {/* Quantity Control Container */}
                <div className="flex items-center gap-1 bg-zinc-100/80 dark:bg-zinc-900/80 rounded-[20px] p-1 h-[52px] border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner group transition-colors">
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={!itemAvailability.available}
                        className="w-[40px] h-full flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all disabled:opacity-50 text-zinc-600 dark:text-zinc-400 shadow-sm border border-zinc-100 dark:border-zinc-700"
                    >
                        <Minus size={18} strokeWidth={3}/>
                    </button>
                    <div className="w-10 flex flex-col items-center">
                         <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter leading-none mb-0.5">Qty</span>
                         <span className="text-base font-black text-zinc-900 dark:text-white tabular-nums leading-none">
                            {quantity}
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            if (selectedPortion?.max_quantity && quantity >= selectedPortion.max_quantity) {
                                toast.error(`Max ${selectedPortion.max_quantity} reached`);
                            } else {
                                setQuantity(quantity + 1);
                            }
                        }}
                        disabled={!itemAvailability.available}
                        className="w-[40px] h-full flex items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                    >
                        <Plus size={18} strokeWidth={3}/>
                    </button>
                </div>

                <button
                    onClick={handleAddToCartBaseItem}
                    disabled={!itemAvailability.available}
                    className="flex-1 h-[52px] py-1.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-black dark:hover:bg-white disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white dark:text-zinc-900 rounded-[20px] font-black text-[13px] uppercase tracking-[0.05em] italic flex items-center justify-between px-4 transition-all active:scale-[0.98] shadow-2xl shadow-zinc-200/50 dark:shadow-none group border border-zinc-800/50 dark:border-zinc-200/50 overflow-hidden"
                >
                    <div className="flex items-center gap-3 min-w-0">
                       {/* <div className="p-1.5 rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 group-hover:rotate-12 transition-transform shrink-0">
                          <ShoppingCart size={18} />
                       </div> */}
                       <span className={`truncate ${itemAvailability.available ? "text-white dark:text-zinc-900 group-hover:text-orange-500" : "text-zinc-400"}`}>
                          {itemAvailability.available ? "Add to Order" : "Sold Out"}
                       </span>
                    </div>
                    
                    {itemAvailability.available && (
                       <div className="flex items-center gap-3 shrink-0 ml-2">
                          <div className="w-[1.5px] h-5 bg-white/20 dark:bg-zinc-950/20 rounded-full" />
                          <span className="text-orange-500 tabular-nums font-black text-base">
                              ₦{total.toLocaleString()}
                          </span>
                       </div>
                    )}
                </button>
            </div>
        </div>
      )}

      <FoodCustomizationModal
        food={food}
        isOpen={modalDetails.isOpen}
        onClose={closeModal}
        onAdd={handleAddToCart}
        initialVariant={modalDetails.variant}
        initialPortion={modalDetails.portion}
      />
      </div>
    </>
  );
}
