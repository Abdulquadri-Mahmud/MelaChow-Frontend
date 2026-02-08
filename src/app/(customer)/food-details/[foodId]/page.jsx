"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import Link from "next/link";
import toast from 'react-hot-toast';
import {
  Clock,
  ArrowLeft,
  Truck,
  Store,
  Star,
  Leaf,
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar
} from "lucide-react";
import { TbCurrencyNaira } from "react-icons/tb";
import { BiCartAdd } from "react-icons/bi";
import { Utensils } from "lucide-react";

import { useApi } from "@/app/context/ApiContext";
import { useCart } from "@/app/context/CartContext";
import { getVendorOpenStatus } from "@/app/lib/vendor-time/vendorTime";
import FoodDetailsSkeleton from "@/app/skeleton/FoodDetailsSkeleton";
import FoodCustomizationModal from "@/app/components/Cart/FoodCustomizationModal";

export default function FoodDetails() {
  const router = useRouter();
  const { foodId } = useParams();
  const { baseUrl } = useApi();
  const { addToCart, cart } = useCart();

  // Data State
  const [food, setFood] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // UI State
  const [currentImage, setCurrentImage] = useState(0);
  const [nutritionOpen, setNutritionOpen] = useState(false);

  // Modal State
  const [modalDetails, setModalDetails] = useState({
    isOpen: false,
    variant: null,
    portion: null
  });

  // Initialize Client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch Food
  useEffect(() => {
    const fetchFood = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(
          `${baseUrl}/vendors/foods/get-food?id=${foodId}`
        );
        const foodData = res?.data?.data;
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
  }, [foodId, baseUrl]);

  console.log(food);

  // Image Navigation
  const nextImage = () => {
    if (!food?.images?.length) return;
    setCurrentImage((prev) => (prev + 1) % food.images.length);
  };

  const prevImage = () => {
    if (!food?.images?.length) return;
    setCurrentImage((prev) =>
      prev === 0 ? food.images.length - 1 : prev - 1
    );
  };

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

  const handleViewVendor = () => {
    if (food?.vendor?._id) {
      router.push(`/view-vendor/${food.vendor._id}`);
    }
  };


  // --- RENDER HELPERS ---
  const renderSpicyLevel = (level) => {
    if (!level) return null;
    const config = {
      mild: { color: "text-emerald-500", label: "Mild", icon: "🌱" },
      medium: { color: "text-yellow-500", label: "Medium", icon: "🌶️" },
      hot: { color: "text-orange-500", label: "Hot", icon: "🔥" },
      "extra-hot": { color: "text-red-500", label: "Extra Hot", icon: "💥" },
    };
    const c = config[level] || config.medium;
    return (
      <div className={`flex items-center gap-1 text-xs font-bold ${c.color} bg-white px-2 py-1 rounded-md border border-slate-100`}>
        <span>{c.icon}</span>
        <span>{c.label} Spiciness</span>
      </div>
    );
  };

  const renderDietaryInfo = (info) => {
    if (!info) return null;
    const config = {
      vegetarian: { label: "Vegetarian", icon: "🥗" },
      vegan: { label: "Vegan", icon: "🌱" },
      "contains-meat": { label: "Contains Meat", icon: "🍖" },
      halal: { label: "Halal", icon: "☪️" },
      keto: { label: "Keto", icon: "🥑" },
      "low-carb": { label: "Low Carb", icon: "🥦" },
    };
    const c = config[info] || { label: info, icon: "Leaf" };
    return (
      <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
        <span>{c.icon === "Leaf" ? <Leaf size={12} /> : c.icon}</span>
        <span>{c.label}</span>
      </div>
    );
  };

  const getDiscountedPrice = (price) => {
    if (!food?.discount?.active) return null;
    if (food.discount.expiresAt && new Date(food.discount.expiresAt) < new Date()) return null;

    let finalPrice = Number(price);
    if (food.discount.flatAmount > 0) {
      finalPrice = Math.max(0, finalPrice - Number(food.discount.flatAmount));
    } else if (food.discount.percentage > 0) {
      finalPrice = Math.max(0, finalPrice - (finalPrice * (Number(food.discount.percentage) / 100)));
    } else {
      return null;
    }

    return finalPrice;
  };

  const checkAvailability = () => {
    if (!food) return { available: false, reason: "Loading..." };

    // 1. Manual switch
    if (food.available === false) {
      return { available: false, reason: "Currently Unavailable" };
    }

    // 2. Global Stock
    if (food.stock !== null && food.stock !== undefined && Number(food.stock) <= 0) {
      return { available: false, reason: "Sold Out" };
    }

    // 3. Schedule
    if (food.availabilitySchedule?.enabled) {
      const now = new Date();
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const currentDay = days[now.getDay()];

      if (!food.availabilitySchedule.days.includes(currentDay)) {
        return { available: false, reason: "Not Available Today" };
      }

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = food.availabilitySchedule.startTime.split(':').map(Number);
      const [endH, endM] = food.availabilitySchedule.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
        return { available: false, reason: `Order between ${food.availabilitySchedule.startTime} - ${food.availabilitySchedule.endTime}` };
      }
    }

    return { available: true };
  };


  if (!isClient) return <div className="min-h-screen bg-white"></div>;

  const totalItems = cart.length;
  const openingMessage = food?.vendor?.openingHours
    ? getVendorOpenStatus(food.vendor.openingHours)
    : "Opening hours not available.";

  const itemAvailability = checkAvailability();

  // Calculate display price (base)
  const basePrice = Number(food?.price) || 0;
  const discountedBasePrice = getDiscountedPrice(basePrice);

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

          <div>
            <h1 className="text-[10px] font-semibold text-orange-600 uppercase tracking-[0.2em]">Restaurant</h1>
            <h2 className="text-sm font-bold text-gray-900 line-clamp-1 italic uppercase tracking-tighter">
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
                    {food?.images?.length > 1 ? (
                      <>
                        <motion.img
                          key={currentImage}
                          src={food.images[currentImage]?.url || food.images[currentImage]}
                          alt={food?.name}
                          className="w-full h-full object-cover"
                          initial={{ opacity: 0, scale: 1.1 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.6 }}
                        />
                        <div className="absolute inset-0 flex justify-between items-center px-2">
                          <button onClick={prevImage} className="bg-black/20 backdrop-blur-md text-white w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-black/40 transition-colors">‹</button>
                          <button onClick={nextImage} className="bg-black/20 backdrop-blur-md text-white w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-black/40 transition-colors">›</button>
                        </div>
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {food.images.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImage ? "w-6 bg-orange-500" : "w-1.5 bg-white/40"}`} />
                          ))}
                        </div>
                      </>
                    ) : (
                      <img src={food?.images?.[0]?.url || food?.images?.[0] || "/placeholder.jpg"} alt={food?.name} className="w-full h-full object-cover" />
                    )}

                    <div className="absolute top-3 left-3 pr-6 flex flex-wrap gap-2">
                      <div className="bg-orange-500 text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-orange-500/20">{food.category}</div>
                      {food.foodType && (
                        <div className={`text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest border border-white/20 backdrop-blur-md ${food.foodType === 'veg' ? 'bg-green-500 text-white' :
                          food.foodType === 'non-veg' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'
                          }`}>
                          {food.foodType === 'veg' ? 'Veg 🟢' : food.foodType === 'non-veg' ? 'Non-Veg 🔴' : food.foodType}
                        </div>
                      )}
                      {food.metadata?.chefSpecial && (
                        <div className="bg-white/95 backdrop-blur-md text-gray-900 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-widest border border-gray-100 shadow-sm">👨‍🍳 Chef Special</div>
                      )}

                      {/* Availability Schedule Badge */}
                      {food.availabilitySchedule?.enabled && (
                        <div className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/20 flex items-center gap-1.5">
                          <Clock size={10} className="text-orange-400" />
                          <span>{food.availabilitySchedule.startTime} - {food.availabilitySchedule.endTime}</span>
                        </div>
                      )}

                      {!itemAvailability.available && (
                        <div className="bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/20">
                          {itemAvailability.reason}
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
                    {renderSpicyLevel(food.metadata?.spiceLevel)}
                    {renderDietaryInfo(food.metadata?.dietaryInfo)}
                    {food.metadata?.allergens?.length > 0 && (
                      food.metadata.allergens.map((alg, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
                          <AlertTriangle size={12} />
                          {typeof alg === 'string' ? alg : alg.label}
                        </div>
                      ))
                    )}
                    {/* Rating Pill */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                      <Star size={12} className="text-orange-500 fill-orange-500" />
                      <span>{food.rating > 0 ? food.rating.toFixed(1) : "New"}</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-500">{food.ratingCount || 0} reviews</span>
                    </div>
                    {/* Order Count Pill */}
                    {food.orderCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                        <Store size={12} />
                        {food.orderCount}+ Orders
                      </div>
                    )}
                    {/* Stock Pill */}
                    {typeof food.stock === 'number' && (
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                        📦 {food.stock} Left
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  {/* Quick Stats & Discount */}
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    {/* Time Stat */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-100/80 backdrop-blur-sm">
                      <div className="p-2 bg-white rounded-xl text-orange-500 shadow-sm ring-1 ring-gray-100"><Clock size={18} /></div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Est. Time</p>
                        <p className="text-sm font-black text-gray-900 leading-none">{food?.prepTime ? `${food.prepTime} min` : `${food?.estimatedDeliveryTime || 25} min`}</p>
                      </div>
                    </div>

                    {/* Delivery & Discount Stat */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-100/80 backdrop-blur-sm relative overflow-hidden group">
                      <div className="p-2 bg-white rounded-xl text-orange-500 shadow-sm ring-1 ring-gray-100 z-10"><Truck size={18} /></div>
                      <div className="z-10 flex-1">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Delivery</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-gray-900 leading-none">₦{food?.deliveryFee || 0}</p>
                          {/* Integrated Discount Badge */}
                          {discountedBasePrice !== null && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-red-100 text-red-600 text-[10px] font-bold leading-none animate-pulse">
                              {food.discount.percentage > 0 ? `-${food.discount.percentage}%` : `Save ₦${food.discount.flatAmount}`}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Decorative Background Icon */}
                      {discountedBasePrice !== null && (
                        <div className="absolute -right-2 -bottom-2 text-red-500/5 transform rotate-12 group-hover:scale-110 transition-transform">
                          <Utensils size={40} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Nutrition Info (Collapsible) */}
                  {food.nutrition && Object.values(food.nutrition).some(v => v) && (
                    <div className="mt-4 border border-gray-100 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setNutritionOpen(!nutritionOpen)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Info size={16} className="text-gray-400" />
                          <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Nutrition Info</span>
                        </div>
                        {nutritionOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </button>
                      <AnimatePresence>
                        {nutritionOpen && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="bg-white"
                          >
                            <div className="p-4 grid grid-cols-3 gap-4">
                              {Object.entries(food.nutrition).map(([key, val]) => val && (
                                <div key={key} className="text-center">
                                  <div className="text-[10px] text-gray-400 uppercase font-bold">{key}</div>
                                  <div className="text-sm font-bold text-gray-900">{val}</div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>


            {/* AVAILABLE OPTIONS SELECTION */}
            <div className="px-4 space-y-4">

              {/* If no variants and no portions, use Base Item */}
              {(!food.variants?.length && !food.portions?.length) && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openModal(null, null)}
                  className="bg-white rounded-[24px] p-4 flex items-center justify-between border border-gray-100 cursor-pointer group"
                >
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Standard Portion</p>
                    <div className="flex items-center gap-2">
                      {discountedBasePrice !== null ? (
                        <>
                          <p className="text-lg font-bold text-orange-600">₦{discountedBasePrice.toLocaleString()}</p>
                          <p className="text-xs font-bold text-gray-400 line-through">₦{Number(food.price).toLocaleString()}</p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-gray-900">₦{Number(food.price).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  {(!itemAvailability.available) ? (
                    <button disabled className="px-4 py-2 rounded-full bg-gray-100 text-gray-400 text-xs font-bold uppercase cursor-not-allowed">
                      {itemAvailability.reason}
                    </button>
                  ) : (
                    <button className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                      <Plus size={24} />
                    </button>
                  )}
                </motion.div>
              )}

              {/* Variants Grid */}
              {food.variants?.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Select Variant</h3>
                  </div>
                  <div className="grid gap-3">
                    {food.variants.map((variant, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-[24px] p-3 border border-gray-100 flex items-center gap-4 overflow-hidden"
                      >
                        {/* Variant Image */}
                        <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-2xl overflow-hidden">
                          <img
                            src={variant.image || variant.images?.[0]?.url || "/placeholder.jpg"}
                            alt={variant.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{variant.name}</h4>
                          <p className="text-xs text-gray-500 line-clamp-1 italic">{variant.description || "Tasty variant"}</p>
                          {(() => {
                            const vPrice = Number(variant.price);
                            const vDiscPrice = getDiscountedPrice(vPrice);
                            return vDiscPrice !== null ? (
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm font-bold text-orange-600">₦{vDiscPrice.toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-gray-400 line-through decoration-gray-400">₦{vPrice.toLocaleString()}</p>
                              </div>
                            ) : (
                              <p className="text-sm font-bold text-orange-600 mt-1">₦{vPrice.toLocaleString()}</p>
                            );
                          })()}
                        </div>

                        {/* Add Button */}
                        {(() => {
                          const isVariantStockOut = !variant.stock || Number(variant.stock) <= 0;

                          return (
                            <button
                              onClick={() => !isVariantStockOut && itemAvailability.available && openModal(variant, null)}
                              disabled={isVariantStockOut || !itemAvailability.available}
                              className={`w-auto px-4 py-2 shrink-0 rounded-xl flex items-center justify-center transition-all font-bold text-xs ${isVariantStockOut || !itemAvailability.available
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gray-900 text-white active:scale-95"
                                }`}
                            >
                              {isVariantStockOut ? "Sold Out" : !itemAvailability.available ? "Unavail" : <Plus size={20} />}
                            </button>
                          );
                        })()}
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

              {/* Portions List (If Valid) */}
              {food.portions?.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-2 mt-4">
                    <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Select Portion</h3>
                  </div>
                  <div className="space-y-2">
                    {food.portions.map((portion, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => openModal(null, portion)}
                        className="bg-white rounded-[20px] p-4 flex items-center justify-between border border-gray-100 cursor-pointer group hover:border-orange-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 text-xs font-bold">
                            {portion.label.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900">{portion.label}</span>
                            <div className="text-xs text-gray-400 font-medium">Portion Size</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {(() => {
                            const pPrice = Number(portion.price);
                            const pDiscPrice = getDiscountedPrice(pPrice);
                            return pDiscPrice !== null ? (
                              <div className="flex flex-col items-end leading-tight">
                                <span className="font-bold text-orange-600">₦{pDiscPrice.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-gray-400 line-through">₦{pPrice.toLocaleString()}</span>
                              </div>
                            ) : (
                              <span className="font-bold text-gray-900">₦{pPrice.toLocaleString()}</span>
                            );
                          })()}
                          <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-900 group-hover:text-white transition-colors flex items-center justify-center">
                            <Plus size={16} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

            </div>
          </div>
        ) : null}
      </div>

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
