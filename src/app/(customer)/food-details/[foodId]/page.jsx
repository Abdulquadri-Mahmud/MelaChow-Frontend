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
  Plus
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

  // Modal State
  const [modalDetails, setModalDetails] = useState({
    isOpen: false,
    variant: null, // this will be a combo
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

              {/* If no combos and no portions, use Base Item */}
              {(!food.combos?.length && !food.portions?.length) && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openModal(null, null)}
                  className="bg-white rounded-[24px] p-4 flex items-center justify-between border border-gray-100 cursor-pointer group"
                >
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Standard Portion</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-gray-900">
                        {basePrice != null ? `₦${basePrice.toLocaleString()}` : "Select a portion"}
                      </p>
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

              {/* Combos Grid */}
              {food.combos?.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-2">
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
                        className="bg-white rounded-[24px] p-3 border border-gray-100 flex items-center gap-4"
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
                </>
              )}

              {/* Portions List */}
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
                        onClick={() => itemAvailability.available && openModal(null, portion)}
                        className={`bg-white rounded-[20px] p-4 flex items-center justify-between border border-gray-100 cursor-pointer group hover:border-orange-200 transition-colors ${!itemAvailability.available ? 'opacity-60 grayscale-[0.5]' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 text-xs font-bold">
                            {portion.label.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900">{portion.label}</span>
                            {portion.is_default && (
                              <div className="text-[10px] text-orange-500 font-bold">Default</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900">
                            ₦{portion.price_naira?.toLocaleString()}
                          </span>
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
