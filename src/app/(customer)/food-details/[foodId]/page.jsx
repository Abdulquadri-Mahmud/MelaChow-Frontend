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
  const basePriceNaira = selectedPortion?.price_naira || (food?.price ? Number(food.price) : 0);
  
  const addonsPrice = Object.values(selections).reduce((acc, sel) => {
      if (Array.isArray(sel)) {
          return acc + sel.reduce((s, o) => s + ((o.price_modifier_naira || 0) * (o.selectionQuantity || 1)), 0);
      }
      return acc + ((sel?.price_modifier_naira || 0) * (sel?.selectionQuantity || 1));
  }, 0);

  const totalUnit = basePriceNaira + addonsPrice;
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
          price_naira:  totalUnit,
          quantity,
          selected_options: selectedOptions.map(opt => ({
              group_id:             opt.group_id,
              option_id:            opt.option_id,
              label:                opt.label,
              price_modifier_naira: opt.price_modifier_naira || 0,
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

  const isVendorOpen = food?.vendor?.openingHours
    ? isVendorOpenFn(food.vendor.openingHours)
    : null;

  const openingMessage = isVendorOpen === true
    ? "Open now"
    : isVendorOpen === false
    ? "Currently closed"
    : "Opening hours unavailable";

  const itemAvailability = checkAvailability();

  // Derive base price from cheapest portion
  const basePrice = food?.portions?.length > 0
    ? Math.min(...food.portions.map(p => p.price_naira))
    : null;

  return (
    <>
      {/* 🧭 Header */}
      <header className="flex items-center justify-between px-4 py-4 bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-2xl bg-gray-50 hover:bg-orange-50 hover:text-orange-600 transition-all active:scale-90"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            className="cursor-pointer"
            onClick={() => food?.vendor?._id && router.push(`/restaurants/${food.vendor._id}`)}
          >
            <h1 className="text-[10px] font-semibold text-orange-600 uppercase tracking-[0.2em]">Restaurant</h1>
            <h2 className="text-sm font-bold text-gray-900 line-clamp-1 italic uppercase tracking-tighter hover:underline">
              {food?.vendor?.storeName || "Food Details"}
            </h2>
            <p className={`text-[10px] font-bold ${openingMessage.includes('Open now') ? 'text-emerald-500' : 'text-rose-500'}`}>
              {openingMessage}
            </p>
          </div>
        </div>

        <Link href={'/orders?activeTab=cart'}>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative bg-gray-900 p-2.5 rounded-2xl">
            <BiCartAdd className="text-white" size={24} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-orange-500 ring-4 ring-white text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-black">
                {totalItems}
              </span>
            )}
          </motion.div>
        </Link>
      </header>

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
              <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden">
                {/* Image Section */}
                <div className="relative w-full bg-gray-100 p-2">
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
                        <div className="bg-white/90 backdrop-blur-md text-gray-800 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest border border-gray-100 shadow-sm">
                          {food.platform_category.parent?.name && (
                            <span className="text-gray-400">
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
                            : "bg-gray-800 text-white"
                        }`}>
                          {food.dietary_type}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div className="md:p-5 p-2 pb-4">
                  <h3 className="text-2xl font-bold text-gray-800 leading-tight tracking-tight uppercase mb-2">
                    {food?.name}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed italic font-medium">
                    "{food?.description || "A masterfully crafted dish prepared with the finest ingredients."}"
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {/* Rating Pill */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                      <Star size={12} className="text-orange-500 fill-orange-500" />
                      <span>{food.rating > 0 ? food.rating.toFixed(1) : "New"}</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-500">{food.ratingCount || 0} reviews</span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    {/* Time Stat */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-100/80 backdrop-blur-sm">
                      <div className="p-2 bg-white rounded-xl text-orange-500 shadow-sm ring-1 ring-gray-100"><Clock size={18} /></div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Est. Time</p>
                        <p className="text-sm font-black text-gray-900 leading-none">{food?.prep_time_minutes ? `${food.prep_time_minutes} min` : `25 min`}</p>
                      </div>
                    </div>

                    {/* Delivery */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-100/80 backdrop-blur-sm">
                      <div className="p-2 bg-white rounded-xl text-orange-500 shadow-sm ring-1 ring-gray-100"><Truck size={18} /></div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Delivery</p>
                        <p className="text-sm font-black text-gray-900 leading-none">
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
                    <div className="w-1 h-5 bg-orange-500 rounded-full" />
                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
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
                        className="bg-white rounded-[24px] p-3 border border-gray-100 flex items-center gap-3"
                      >
                        <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-2xl overflow-hidden">
                          <img
                            src={combo.image_url || "/placeholder.jpg"}
                            alt={combo.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">
                            {combo.name}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-1 italic">
                            {combo.description || "Combo deal"}
                          </p>
                          <p className="text-sm font-bold text-orange-600 mt-1">
                            ₦{combo.price_naira?.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => openModal(combo, null)}
                          disabled={!combo.is_available || !itemAvailability.available}
                          className={`w-auto px-4 py-2 shrink-0 rounded-xl text-xs font-bold transition-all ${
                            (!combo.is_available || !itemAvailability.available)
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-gray-900 text-white active:scale-95"
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
                <div className="bg-white rounded-[24px] p-3 border border-gray-100 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Select Portion</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:overflow-x-auto sm:scrollbar-none sm:snap-x">
                    {food.portions.map(portion => (
                      <button
                        key={portion._id}
                        onClick={() => itemAvailability.available && setSelectedPortion(portion)}
                        disabled={!itemAvailability.available}
                        className={`sm:shrink-0 h-14 px-4 rounded-xl border-2 text-xs font-bold transition-all sm:snap-center ${
                          selectedPortion?._id === portion._id
                            ? "bg-orange-500 border-orange-500 text-white"
                            : "bg-white border-gray-100 text-gray-600 hover:border-orange-200"
                        } ${!itemAvailability.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[13px]">{portion.label}</span>
                          <span className={`${selectedPortion?._id === portion._id ? 'text-white/90' : 'text-gray-400'} font-black text-[10px]`}>
                            {portion.price_naira ? `₦${portion.price_naira.toLocaleString()}` : 'Free'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Choice Groups */}
              {food.choiceGroups?.length > 0 && (
                <div className="space-y-4 mb-8">
                  {food.choiceGroups.map((group, gIdx) => (
                    <div key={group._id} className="bg-white rounded-[24px] p-3 border border-gray-100 flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                        <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">
                          {group.name}
                        </h4>
                        {group.is_required && (
                          <span className="text-[9px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full ml-auto">
                            REQUIRED
                          </span>
                        )}
                        {!group.is_required && (
                          <span className="text-[9px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full ml-auto">
                            OPTIONAL
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 font-medium mb-4">
                        {group.max_selections > 1 ? `Select up to ${group.max_selections}` : "Select one"}
                      </p>

                      <div className="space-y-3">
                        {group.options.filter(o => o.is_available).map(option => {
                          const isSelected = isOptionSelected(gIdx, option.label);
                          return (
                            <div key={option._id}
                                 onClick={() => itemAvailability.available && toggleChoice(gIdx, group, option)}
                                 className={`flex items-center gap-3 p-3 rounded-[16px] border-2 cursor-pointer transition-all ${
                                   isSelected ? "border-orange-500 bg-orange-50/50" : "border-gray-100 bg-white hover:border-orange-200"
                                 } ${!itemAvailability.available ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              {/* Option Image */}
                              <div className="w-12 h-12 rounded-[14px] bg-gray-50 overflow-hidden shrink-0">
                                {option.image_url ? (
                                  <img src={option.image_url} alt={option.label} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[20px]">🍽️</div>
                                )}
                              </div>
                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-[13px] text-gray-900 truncate tracking-tight">{option.label}</p>
                                {option.price_modifier_naira > 0 ? (
                                  <p className="text-[11px] font-black text-orange-500">+₦{option.price_modifier_naira.toLocaleString()}</p>
                                ) : (
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Free</p>
                                )}
                              </div>
                              {/* Selection Indicator */}
                              {isSelected ? (
                                <div className="flex items-center gap-2.5 bg-white rounded-xl p-1 shadow-sm border border-gray-100" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => updateOptionQuantity(gIdx, option.label, -1, group)} disabled={!itemAvailability.available} className="w-[26px] h-[26px] flex items-center justify-center rounded-[8px] hover:bg-orange-50 text-orange-600 bg-gray-50">
                                    <Minus size={14} strokeWidth={3} />
                                  </button>
                                  <span className="text-[13px] font-black text-gray-900 min-w-[12px] text-center">
                                    {Array.isArray(selections[gIdx]) ? selections[gIdx].find(i => i.label === option.label)?.selectionQuantity || 1 : selections[gIdx]?.selectionQuantity || 1}
                                  </span>
                                  <button onClick={() => updateOptionQuantity(gIdx, option.label, 1, group)} disabled={!itemAvailability.available} className="w-[26px] h-[26px] flex items-center justify-center rounded-[8px] hover:bg-orange-50 text-orange-600 bg-gray-50">
                                    <Plus size={14} strokeWidth={3} />
                                  </button>
                                </div>
                              ) : (
                                <div className="w-[22px] h-[22px] rounded-full border-2 border-gray-200 bg-gray-50" />
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
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-lg border-t border-gray-100 pb-safe z-40" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
            <div className="max-w-4xl mx-auto flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-100 rounded-[14px] p-1 h-[52px]">
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={!itemAvailability.available}
                        className="w-[42px] h-full flex items-center justify-center rounded-[10px] hover:bg-white transition-colors disabled:opacity-50 text-gray-600"
                    >
                        <Minus size={20} strokeWidth={2.5}/>
                    </button>
                    <span className="w-6 text-center font-black text-gray-900 text-[15px]">
                        {quantity}
                    </span>
                    <button
                        onClick={() => {
                            if (selectedPortion?.max_quantity && quantity >= selectedPortion.max_quantity) {
                                toast.error(`Maximum quantity allowed is ${selectedPortion.max_quantity}`);
                            } else {
                                setQuantity(quantity + 1);
                            }
                        }}
                        disabled={!itemAvailability.available}
                        className="w-[42px] h-full flex items-center justify-center rounded-[10px] hover:bg-white transition-colors disabled:opacity-50 text-gray-600"
                    >
                        <Plus size={20} strokeWidth={2.5}/>
                    </button>
                </div>

                <button
                    onClick={handleAddToCartBaseItem}
                    disabled={!itemAvailability.available}
                    className="flex-1 h-[52px] bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-[16px] font-black text-sm uppercase tracking-widest flex items-center justify-between px-5 transition-all active:scale-[0.98] shadow-lg shadow-orange-500/20"
                >
                    <span className="flex items-center gap-2.5">
                       <ShoppingCart size={18} />
                       {itemAvailability.available ? "Add to Order" : "Unavailable"}
                    </span>
                    {itemAvailability.available && (
                       <span className="bg-white/20 px-3 py-1.5 rounded-lg text-[13px]">
                           ₦{total.toLocaleString()}
                       </span>
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
    </>
  );
}
