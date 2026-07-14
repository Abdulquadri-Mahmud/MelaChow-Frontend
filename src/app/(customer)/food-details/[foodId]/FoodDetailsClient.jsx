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
  ShoppingCart,
  Package,
  MessageSquare
} from "lucide-react";
import { BiCartAdd } from "react-icons/bi";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

import { useCart } from "@/app/context/CartContext";
import { isVendorOpen as isVendorOpenFn } from "@/app/lib/utils";
import { getPublicFoodDetail } from "@/app/lib/menuApi";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";
import FoodCustomizationModal from "@/app/components/Cart/FoodCustomizationModal";
import { useFoodModalStore } from "@/app/store/foodModalStore";
import { useComboModalStore } from "@/app/store/comboModalStore";
import FoodDetailsSkeleton from "@/app/skeleton/FoodDetailsSkeleton";

export default function FoodDetails({ initialData, foodId: propFoodId, isModal, onClose }) {
  const router = useRouter();
  const params = useParams();
  const foodId = propFoodId || params.foodId;
  const { addToCart, cart } = useCart();

  const isFoodComplete = (f) => f && f.portions !== undefined && (f.choiceGroups !== undefined || f.choice_groups !== undefined);

  // Data State
  const initialFood = initialData?.food || (initialData?.success ? null : initialData);
  const [food, setFood] = useState(initialFood && Object.keys(initialFood).length > 0 ? initialFood : null);
  const [isLoading, setIsLoading] = useState(isModal ? true : !isFoodComplete(food));
  const [isError, setIsError] = useState(false);

  // console.log('[FoodDetailsClient] ðŸ¥— initialData:', initialData);
  // console.log('[FoodDetailsClient] ðŸ¥¦ food state:', food);
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

  // Swipeable Tabs State
  const [activeTab, setActiveTab] = useState("details"); // "details" | "reviews"
  const [swiperInstance, setSwiperInstance] = useState(null);

  // Reviews State
  const [reviewsData, setReviewsData] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState(null);

  const resetSelections = () => {
    if (food) {
      const portions = Array.isArray(food?.portions) ? food.portions : [];
      const defaultPortion = portions.find(p => p.is_default) || portions[0] || null;
      setSelectedPortion(defaultPortion);
      setSelections({});
      setQuantity(1);
      setPortionQuantity(1);
    }
  };

  const getFoodVendor = (item = food) => item?.vendor || item?.restaurant || item?.restaurantId || null;
  const getFoodVendorId = (item = food) => {
    const vendor = getFoodVendor(item);
    return vendor?._id || vendor?.id || item?.vendorId || item?.vendor_id || item?.restaurantId || item?.restaurant_id || "";
  };

  // Reset base customizer when food fetches
  useEffect(() => {
    resetSelections();
  }, [food]);

  // Initialize Client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update Swiper height when data changes
  useEffect(() => {
    if (swiperInstance) {
      setTimeout(() => {
        swiperInstance.update();
        swiperInstance.updateAutoHeight();
      }, 300);
    }
  }, [food, activeTab, swiperInstance]);

  // Fetch Food (only if initialData is missing)
  useEffect(() => {
    const fetchFood = async () => {
      // Only skip if we already have the full food object (portions AND choiceGroups check)
      if (!isModal && isFoodComplete(food)) return;

      try {
        if (!isFoodComplete(food)) setIsLoading(true);
        const res = await getPublicFoodDetail(foodId);
        let foodData = res?.food;

        if (foodData) {
          foodData.choiceGroups = foodData.choiceGroups || foodData.choice_groups || [];
          const fallbackVendor = getFoodVendor(food);
          if (!foodData.vendor && fallbackVendor) foodData.vendor = fallbackVendor;
        }

        setFood(foodData);
        setIsError(false);
      } catch (err) {
        console.error("Failed to fetch food:", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (foodId) fetchFood();
  }, [foodId, initialData, isModal]);

  // Fetch Reviews
  const fetchFoodReviews = async (page = 1, rating = null) => {
    if (!foodId) return;
    setReviewsLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (rating) params.append('rating', rating);
      const res = await fetch(`/api/public/reviews/food/${foodId}?${params}`);
      const json = await res.json();
      if (json.success) setReviewsData(json.data);
    } catch (e) {
      console.error('Failed to fetch food reviews', e);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reviews' && !reviewsData) {
      fetchFoodReviews(reviewsPage, ratingFilter);
    }
  }, [activeTab]);

  const handleRatingFilter = (star) => {
    const newFilter = ratingFilter === star ? null : star;
    setRatingFilter(newFilter);
    setReviewsPage(1);
    fetchFoodReviews(1, newFilter);
  };

  const handleReviewsPage = (newPage) => {
    setReviewsPage(newPage);
    fetchFoodReviews(newPage, ratingFilter);
    // Maybe scrollTo section?
  };

  const openComboModal = useComboModalStore(state => state.openComboModal);

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
    resetSelections();
  };

  // Base Item Customizer Logic
  const effectivePortion = selectedPortion || food?.portions?.find((portion) => portion.is_default) || food?.portions?.[0] || null;
  const basePriceNaira = (effectivePortion?.price_naira || 0) * portionQuantity;

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
    if (option.is_available === false || (option.track_stock && option.stock_quantity <= 0)) {
      toast.error(`${option.label} is sold out`);
      return;
    }
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
        if (delta > 0 && current.track_stock && newQty * quantity > current.stock_quantity) {
          toast.error(`Only ${current.stock_quantity} ${current.label} left`);
          return prev;
        }
        return { ...prev, [groupIndex]: { ...current, selectionQuantity: newQty } };
      }

      const list = Array.isArray(current) ? current : [];
      const index = list.findIndex(i => i.label === optionLabel);
      if (index === -1) return prev;

      const item = list[index];
      const newQty = (item.selectionQuantity || 1) + delta;

      if (delta > 0 && item.track_stock && newQty * quantity > item.stock_quantity) {
        toast.error(`Only ${item.stock_quantity} ${item.label} left`);
        return prev;
      }

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
    if (food.portions?.length > 0 && !effectivePortion) {
      toast.error("Please select a size");
      return;
    }

    const choiceGroups = food.choiceGroups || food.choice_groups || [];
    for (let i = 0; i < choiceGroups.length; i++) {
      const group = choiceGroups[i];
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
      const group = choiceGroups[gIdx];
      const sel = selections[key];
      const items = Array.isArray(sel) ? sel : (sel ? [sel] : []);
      items.forEach(opt => {
        if (opt.track_stock && (opt.selectionQuantity || 1) * quantity > opt.stock_quantity) return;
        selectedOptions.push({
          group_id: group._id,
          group_name: group.name,
          option_id: opt._id,
          label: opt.label,
          price_modifier_naira: opt.price_modifier_naira,
          quantity: opt.selectionQuantity || 1
        });
      });
    });
    const selectedCount = Object.values(selections).reduce((sum, sel) => sum + (Array.isArray(sel) ? sel.length : sel ? 1 : 0), 0);
    if (selectedOptions.length < selectedCount) {
      toast.error("One of your selected options no longer has enough stock");
      return;
    }
    const vendor = getFoodVendor(food);
    const vendorId = getFoodVendorId(food);

    if (!vendorId) {
      toast.error("Restaurant details are still loading. Please try again.");
      return;
    }

    const payload = {
      type: "item",                //ADD explicit type
      foodId: food._id,
      portionId: effectivePortion?._id || null, // camelCase
      vendorId,
      restaurantId: vendorId,
      storeName: vendor?.storeName || "",
      name: food.name,
      image_url: food.image || food.image_url || "",
      portion_label: effectivePortion?.label,
      portion_quantity: portionQuantity,
      price_naira: totalUnit,
      quantity,
      selected_options: selectedOptions.map(opt => ({
        group_id: opt.group_id,
        option_id: opt.option_id,
        label: opt.label,
        price_modifier_naira: opt.price_modifier_naira || 0,
        quantity: opt.quantity,
      })),
      deliveryFee: vendor?.deliveryFee || food.deliveryFee || 0,
      dietary_type: food.dietary_type,
      item_type: food.item_type,
    };

    addToCart(payload);
    resetSelections();
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

  const content = (
    <>
      {/*­ Header */}
      <header className="flex items-center justify-between px-2 py-2.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-50 border-b border-zinc-50 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (onClose) onClose();
              else router.back();
            }}
            className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:text-zinc-400 transition-all active:scale-90"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            className="cursor-pointer"
            onClick={() => food?.vendor?._id && router.push(`/restaurants/${food.vendor._id}`)}
          >
          <h2 className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-1 italic capitalize tracking-tighter hover:underline">
              {food?.vendor?.storeName || "Food Details"}
            </h2>
          </div>
        </div>

        <button
          onClick={() => {
            if (isModal && onClose) onClose();
            router.push('/orders?activeTab=cart');
          }}
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative bg-zinc-900 dark:bg-zinc-100 p-2 rounded-xl">
            <BiCartAdd className="text-white dark:text-zinc-900" size={22} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-orange-500 ring-4 ring-white dark:ring-zinc-900 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-medium">
                {totalItems}
              </span>
            )}
          </motion.div>
        </button>
      </header>

    <div className={`pb-1 border-b border-zinc-100 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 ${isModal ? "flex-1 overflow-y-auto no-scrollbar" : ""}`}>
        <div className="max-w-4xl mx-auto pb-8">
          {isLoading ? (
            <div className="p-2"><FoodDetailsSkeleton /></div>
          ) : isError ? (
            <div className="text-center py-20 px-6">
              <div className="bg-red-50 text-red-500 p-2 rounded-[32px] border border-dashed border-red-200">
                <p className="font-medium">Oops! Failed to load the dish.</p>
                <button onClick={() => window.location.reload()} className="mt-4 text-sm underline font-medium">Try Again</button>
              </div>
            </div>
          ) : food ? (
            <>
              {/* ðŸ·ï¸ TAB TOGGLE */}
              {/* <div className="px-4 sticky pt-1 top-[60px] z-20 mb-3">
                <div className="flex bg-zinc-200/50 dark:bg-zinc-800/50 p-0.5 rounded-xl w-full max-w-sm mx-auto backdrop-blur-md border border-white/20 dark:border-zinc-800/50">
                  {[
                    { id: 'details', label: 'Details', icon: Package },
                    { id: 'reviews', label: `Reviews${food?.totalReviews ? ` (${food.totalReviews})` : ''}`, icon: MessageSquare },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        swiperInstance?.slideTo(tab.id === 'details' ? 0 : 1);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-medium capitalize tracking-widest transition-all duration-300 ${activeTab === tab.id
                          ? "bg-white dark:bg-zinc-700 text-orange-600"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                    >
                      <tab.icon size={12} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div> */}

              <Swiper
                onSwiper={setSwiperInstance}
                onSlideChange={(swiper) => {
                  setActiveTab(swiper.activeIndex === 0 ? 'details' : 'reviews');
                }}
                speed={400}
                simulateTouch={true}
                touchRatio={1}
                autoHeight={true}
                observer={true}
                observeParents={true}
                className="w-full relative z-10"
              >
                {/* SLIDE 1: DETAILS */}
                <SwiperSlide>
                  <div className="space-y-4 pb-4">
                    {/* Main Info Card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-1 pt-2">
                      <div className="bg-white dark:bg-zinc-900 rounded-[8px] border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                        {/* Image Section */}
                        <div className="relative w-full bg-zinc-100 dark:bg-zinc-800 p-1">
                          <div className="w-full h-[140px] md:h-[185px] rounded-[18px] overflow-hidden relative">
                            <img
                              src={food?.image || food?.image_url || "/placeholder.jpg"}
                              alt={food?.name}
                              className="w-full h-full object-cover"
                            />
                            {/* Unavailability badge overlay */}
                            {!itemAvailability.available && (
                              <div className="absolute top-2.5 right-2.5 z-10">
                                <div className="bg-medium/80 backdrop-blur-md
                                text-white text-[9px] font-medium px-2 py-0.5
                                rounded-full capitalize tracking-widest
                                border border-white/20">
                                  {itemAvailability.reason}
                                </div>
                              </div>
                            )}

                            <div className="absolute top-2.5 left-2.5 pr-4 flex flex-wrap gap-1.5 z-10">
                              {/* Item type badge */}
                              {food.item_type && (
                                <div className="bg-orange-500 text-white text-[8px] font-semibold px-2 py-0.5 rounded-full capitalize tracking-widest shadow-orange-500/20">
                                  {food.item_type}
                                </div>
                              )}

                              {/* Platform category badge */}
                              {food.platform_category && (
                                <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-zinc-800 dark:text-zinc-200 text-[8px] font-semibold px-2 py-0.5 rounded-full capitalize tracking-widest border border-zinc-100 dark:border-zinc-800">
                                  {food.platform_category.parent?.name && (
                                    <span className="text-zinc-400 dark:text-zinc-500">
                                      {food.platform_category.parent.name} Â·{" "}
                                    </span>
                                  )}
                                  {food.platform_category.name}
                                </div>
                              )}

                              {/* Dietary type badge */}
                              {food.dietary_type && food.dietary_type !== "mixed" && (
                                <div className={`text-[10px] font-semibold px-3 py-1 rounded-full capitalize tracking-widest border border-white/20 backdrop-blur-md ${food.dietary_type === "veg" || food.dietary_type === "vegan"
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
                        <div className="md:p-3 p-2 pb-2">
                          <h3 className="text-base font-medium text-zinc-900 dark:text-white leading-tight tracking-tight capitalize mb-0.5">
                            {food?.name}
                          </h3>
                          <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed italic font-medium">
                            "{food?.description || "A masterfully crafted dish prepared with the finest ingredients."}"
                          </p>

                            {/* Rating Pill */}
                          {/* <div className="flex flex-wrap gap-2 mt-3">
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-100 dark:border-zinc-800">
                              <Star size={10} className="text-orange-500 fill-orange-500" />
                              <span>{food.rating > 0 ? food.rating.toFixed(1) : "New"}</span>
                              <span className="text-zinc-300 dark:text-zinc-700">|</span>
                              <span className="text-zinc-500 dark:text-zinc-400">{food.totalReviews || food.ratingCount || 0} reviews</span>
                            </div>
                          </div> */}

                          {/* Quick Stats */}
                          <div className="grid grid-cols-2 gap-2 mt-2.5">
                            {/* Time Stat */}
                            <div className="flex items-center gap-2 p-1.5 bg-zinc-50/80 dark:bg-zinc-800/80 rounded-lg border border-zinc-100/80 dark:border-zinc-700/80 backdrop-blur-sm">
                              <div className="p-1 bg-white dark:bg-zinc-900 rounded-md text-orange-500 ring-1 ring-zinc-100 dark:ring-zinc-800"><Clock size={14} /></div>
                              <div>
                                <p className="text-[8px] font-medium text-zinc-400 dark:text-zinc-500 capitalize tracking-widest mb-0.5">Prep time</p>
                                <p className="text-sm font-medium text-zinc-900 dark:text-white leading-none">{food?.prep_time_minutes ? `${food.prep_time_minutes} min` : `25 min`}</p>
                              </div>
                            </div>

                            {/* Delivery */}
                            <div className={`flex items-center gap-2 p-1.5 rounded-lg border backdrop-blur-sm ${!food?.deliveryFee || food?.deliveryFee === 0
                                ? "bg-green-50/80 dark:bg-green-500/10 border-green-100/80 dark:border-green-500/20"
                                : "bg-zinc-50/80 dark:bg-zinc-800/80 border-zinc-100/80 dark:border-zinc-700/80"
                              }`}>
                              <div className={`p-1 bg-white dark:bg-zinc-900 rounded-md ring-1 ${!food?.deliveryFee || food?.deliveryFee === 0
                                  ? "text-green-500 ring-green-100 dark:ring-green-500/20"
                                  : "text-orange-500 ring-zinc-100 dark:ring-zinc-800"
                                }`}><Truck size={14} /></div>
                              <div>
                                <p className="text-[8px] font-medium text-zinc-400 dark:text-zinc-500 capitalize tracking-widest mb-0.5">Delivery</p>
                                <p className={`text-sm font-medium leading-none ${!food?.deliveryFee || food?.deliveryFee === 0
                                    ? "text-green-500"
                                    : "text-zinc-900 dark:text-white"
                                  }`}>
                                  {!food?.deliveryFee || food?.deliveryFee === 0 ? "Free" : `₦${food.deliveryFee.toLocaleString()}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <div className="px-1 space-y-4">

                      {/* Combos Grid (unchanged) */}
                      {food.combos?.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                            <h3 className="text-lg font-medium italic text-zinc-900 dark:text-white capitalize tracking-tight">
                              Available Deals ðŸŽ 
                            </h3>
                          </div>
                          <div className="grid gap-3">
                            {food.combos.map((combo, i) => (
                              <motion.div
                                key={combo._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white dark:bg-zinc-900 rounded-[28px] p-3 border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 hover transition-all group"
                              >
                                <div className="w-20 h-20 shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden">
                                  <img
                                    src={combo.image_url || "/placeholder.jpg"}
                                    alt={combo.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-zinc-900 dark:text-white truncate italic capitalize tracking-tight">
                                    {combo.name}
                                  </h4>
                                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1 italic font-medium">
                                    {combo.description || "Combo deal"}
                                  </p>
                                  <p className="text-sm font-medium text-zinc-500 mt-1">
                                    ₦{combo.price_naira?.toLocaleString()}
                                  </p>
                                </div>
                                <button
                                  onClick={() => openComboModal(combo._id, { combo, vendor: getFoodVendor(food) })}
                                  disabled={!combo.is_available || !itemAvailability.available}
                                  className={`w-auto px-4 py-2 shrink-0 rounded-xl text-sm font-medium capitalize tracking-widest transition-all ${(!combo.is_available || !itemAvailability.available)
                                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                                      : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 active:scale-95 dark:shadow-none"
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
                         <div className="bg-white dark:bg-zinc-900 rounded-[8px] p-3 border border-zinc-100 dark:border-zinc-800 mb-4">
                           <div className="flex items-center gap-1.5 mb-3">
                             <div className="w-1 h-5 bg-orange-500 rounded-full" />
                             <h3 className="text-base font-medium italic text-zinc-900 dark:text-white capitalize tracking-tight">Select Portion</h3>
                           </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
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
                                  className={`relative flex items-center justify-between p-1 rounded-[10px] border-2 transition-all cursor-pointer ${isSelected
                                      ? "bg-orange-50/50 dark:bg-orange-500/10 border-orange-500 shadow-[0_0_20px_rgba(255,102,0,0.1)] dark:shadow-[0_0_30px_rgba(255,102,0,0.15)] scale-[1.01]"
                                      : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-orange-200 dark:hover:border-orange-500/30"
                                    } ${!itemAvailability.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <div className="flex flex-col">
                                    <span className={`text-sm font-medium capitalize tracking-wider ${isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                      {portion.label}
                                    </span>
                                    <span className="text-[11px] font-medium text-zinc-500 mt-0.5">
                                      {portion.price_naira ? `₦${portion.price_naira.toLocaleString()}` : 'Free'}
                                    </span>
                                  </div>

                                  {isSelected && (
                                    <div
                                      className="flex items-center gap-2.5 bg-white dark:bg-zinc-800 rounded-xl p-1 border border-zinc-100 dark:border-zinc-700"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={() => setPortionQuantity(Math.max(1, portionQuantity - 1))}
                                        disabled={!itemAvailability.available}
                                        className="w-[26px] h-[26px] flex items-center justify-center rounded-[8px] hover:bg-orange-50 dark:hover:bg-orange-500/20 text-orange-600 bg-zinc-50 dark:bg-zinc-900"
                                      >
                                        <Minus size={14} strokeWidth={3} />
                                      </button>
                                      <span className="text-[13px] font-medium text-zinc-900 dark:text-white min-w-[12px] text-center tabular-nums">
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
                       {(food.choiceGroups?.length > 0 || food.choice_groups?.length > 0) && (
                         <div className="space-y-3 mb-4 relative z-10">
                           {(food.choiceGroups || food.choice_groups).map((group, gIdx) => (
                             <div key={group._id} className="bg-white dark:bg-zinc-900 rounded-[8px] p-2.5 border border-zinc-100 dark:border-zinc-800 flex flex-col">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-1 h-5 bg-orange-500 rounded-full" />
                                <h4 className="text-[13px] font-medium italic text-zinc-900 dark:text-white capitalize tracking-tight">
                                  {group.name}
                                </h4>
                                {group.is_required && (
                                  <span className="text-[8px] font-medium text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full ml-auto capitalize tracking-widest">
                                    REQUIRED
                                  </span>
                                )}
                                {!group.is_required && (
                                  <span className="text-[8px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-2 py-0.5 rounded-full ml-auto capitalize tracking-widest">
                                    OPTIONAL
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium capitalize tracking-[0.15em] mb-3">
                                {group.max_selections > 1 ? `Select up to ${group.max_selections}` : "Select one"}
                              </p>

                              <div className="space-y-2">
                                {(group.options || []).map(option => {
                                  const isSelected = isOptionSelected(gIdx, option.label);
                                  const optionUnavailable = option.is_available === false || (option.track_stock && option.stock_quantity <= 0);
                                  return (
                                    <div key={option._id}
                                      onClick={() => itemAvailability.available && !optionUnavailable && toggleChoice(gIdx, group, option)}
                                      className={`flex items-center gap-2.5 p-2 rounded-[12px] border-2 cursor-pointer transition-all ${isSelected ? "border-orange-500 bg-orange-50/50 dark:bg-orange-500/10" : "border-zinc-50 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                                        } ${!itemAvailability.available || optionUnavailable ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                      {option.image_url ? (
                                        <img src={option.image_url} alt={option.label} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-zinc-100 dark:border-zinc-800" />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-orange-600/10 text-orange-600 flex items-center justify-center shrink-0">
                                          <Plus size={12} strokeWidth={4} />
                                        </div>
                                      )}
                                      {/* Details */}
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-[11px] text-zinc-900 dark:text-white truncate capitalize italic">{option.label}</p>
                                        {optionUnavailable && <p className="text-[8px] font-black uppercase tracking-widest text-rose-500">Sold out</p>}
                                        {!optionUnavailable && option.track_stock && option.stock_quantity <= (option.low_stock_threshold ?? 5) && <p className="text-[8px] font-black uppercase tracking-widest text-amber-500">Only {option.stock_quantity} left</p>}
                                        {option.price_modifier_naira > 0 ? (
                                          <p className="text-[10px] font-medium text-zinc-500">+₦{option.price_modifier_naira.toLocaleString()}</p>
                                        ) : (
                                          <p className="text-[8px] font-medium text-zinc-400 dark:text-zinc-500 capitalize tracking-widest mt-0.5">Free</p>
                                        )}
                                      </div>
                                      {/* Selection Indicator */}
                                      {isSelected ? (
                                        <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-100 dark:border-zinc-700" onClick={e => e.stopPropagation()}>
                                          <button onClick={() => updateOptionQuantity(gIdx, option.label, -1, group)} disabled={!itemAvailability.available} className="w-[22px] h-[22px] flex items-center justify-center rounded-[6px] hover:bg-orange-50 dark:hover:bg-orange-500/20 text-orange-600 bg-zinc-50 dark:bg-zinc-900">
                                            <Minus size={12} strokeWidth={3} />
                                          </button>
                                          <span className="text-[11px] font-medium text-zinc-900 dark:text-white min-w-[10px] text-center">
                                            {Array.isArray(selections[gIdx]) ? selections[gIdx].find(i => i.label === option.label)?.selectionQuantity || 1 : selections[gIdx]?.selectionQuantity || 1}
                                          </span>
                                          <button onClick={() => updateOptionQuantity(gIdx, option.label, 1, group)} disabled={!itemAvailability.available} className="w-[22px] h-[22px] flex items-center justify-center rounded-[6px] hover:bg-orange-50 dark:hover:bg-orange-500/20 text-orange-600 bg-zinc-50 dark:bg-zinc-900">
                                            <Plus size={12} strokeWidth={3} />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="w-[18px] h-[18px] rounded-full border-2 border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900" />
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
                </SwiperSlide>

                {/* SLIDE 2: REVIEWS */}
                <SwiperSlide>
                  <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 pb-24">
                    {reviewsLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 size={32} className="animate-spin text-zinc-500" />
                        <p className="text-[11px] font-medium capitalize tracking-widest text-slate-400">Loading Reviews...</p>
                      </div>
                    ) : reviewsData ? (
                      <>
                        {/* Overall Stats */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 border border-zinc-100 dark:border-zinc-800">
                          <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="text-center shrink-0">
                              <p className="text-6xl font-medium text-zinc-900 dark:text-white leading-none">
                                {reviewsData.food.averageRating || '—'}
                              </p>
                              <div className="flex justify-center gap-0.5 mt-2">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star key={s} size={14}
                                    className={s <= Math.round(reviewsData.food.averageRating) ? 'fill-orange-500 text-orange-500' : 'text-zinc-200 dark:text-zinc-700'}
                                  />
                                ))}
                              </div>
                              <p className="text-[10px] font-medium text-zinc-400 capitalize tracking-widest mt-1">
                                {reviewsData.food.totalReviews} review{reviewsData.food.totalReviews !== 1 ? 's' : ''}
                              </p>
                            </div>

                            <div className="flex-1 w-full space-y-2">
                              {[5, 4, 3, 2, 1].map(star => {
                                const pct = reviewsData.ratingPercentages?.[star] || 0;
                                const count = reviewsData.ratingDistribution?.[star] || 0;
                                return (
                                  <button
                                    key={star}
                                    onClick={() => handleRatingFilter(star)}
                                    className={`w-full flex items-center gap-3 group transition-opacity ${ratingFilter && ratingFilter !== star ? 'opacity-40' : 'opacity-100'
                                      }`}
                                  >
                                    <span className="text-[10px] font-medium text-zinc-500 w-4 shrink-0">{star}</span>
                                    <Star size={10} className="fill-orange-400 text-orange-400 shrink-0" />
                                    <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="text-[9px] font-medium text-zinc-400 w-6 text-right shrink-0">{count}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Review Cards List */}
                        {reviewsData.reviews.length === 0 ? (
                          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[40px] border border-dashed border-zinc-200 dark:border-zinc-800 overflow-hidden relative group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform rotate-3 group-hover:rotate-6 transition-transform">
                              <MessageSquare size={40} className="text-zinc-300 dark:text-zinc-600" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-medium italic capitalize tracking-tight text-zinc-900 dark:text-white mb-2">No feedback yet</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-[200px] mx-auto font-medium leading-relaxed capitalize tracking-widest opacity-80">
                              Be the first to share your thoughts on this dish!
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {reviewsData.reviews.map((review, idx) => {
                              const user = review.userId;
                              const initials = user ? `${user.firstname?.[0] || ''}${user.lastname?.[0] || ''}`.toUpperCase() : '?';
                              const date = new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                              return (
                                <div key={review._id || idx} className="bg-white dark:bg-zinc-900 rounded-[28px] p-4 border border-zinc-100 dark:border-zinc-800 space-y-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl overflow-hidden bg-orange-500 flex items-center justify-center text-white font-medium text-sm shrink-0 shadow-orange-500/20">
                                      {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[13px] font-medium text-zinc-900 dark:text-white truncate">
                                        {user ? `${user.firstname} ${user.lastname}` : 'Anonymous'}
                                      </p>
                                      <p className="text-[10px] font-medium text-zinc-400 capitalize tracking-widest">{date}</p>
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} size={12}
                                          className={s <= review.rating ? 'fill-orange-500 text-orange-500' : 'text-zinc-200 dark:text-zinc-700'}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed italic">
                                    "{review.comment}"
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Pagination */}
                        {reviewsData.pagination?.totalPages > 1 && (
                          <div className="flex items-center justify-between pt-4">
                            <button
                              onClick={() => handleReviewsPage(reviewsPage - 1)}
                              disabled={!reviewsData.pagination.hasPrev}
                              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] font-medium capitalize tracking-widest text-zinc-600 disabled:opacity-30"
                            >
                              <ChevronLeft size={14} /> Prev
                            </button>
                            <span className="text-[10px] font-medium text-zinc-400 capitalize tracking-widest">
                              Page {reviewsPage} of {reviewsData.pagination.totalPages}
                            </span>
                            <button
                              onClick={() => handleReviewsPage(reviewsPage + 1)}
                              disabled={!reviewsData.pagination.hasNext}
                              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] font-medium capitalize tracking-widest text-zinc-600 disabled:opacity-30"
                            >
                              Next <ChevronRightIcon size={14} />
                            </button>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </SwiperSlide>
              </Swiper>
            </>
          ) : null}
        </div>
      </div>

        {/* Base Item Add to Order Footer - Fixed Bottom Bar */}
        {food && (
          <div className="fixed inset-x-0 bottom-0 p-2.5 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-100/50 dark:border-zinc-800/80 z-[10001] shadow-[0_-12px_30px_rgba(15,23,42,0.08)]" style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}>
            <div className="max-w-2xl mx-auto flex items-center gap-3">

              {/* Quantity Control Container */}
              <div className="flex items-center gap-1 bg-zinc-100/80 dark:bg-zinc-900/80 rounded p-0.5 px-1 h-[46px] border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner group transition-colors">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!itemAvailability.available}
                  className="w-[30px] h-[30px] flex items-center justify-center rounded bg-white dark:bg-zinc-900 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all disabled:opacity-50 text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-700"
                >
                  <Minus size={16} strokeWidth={3} />
                </button>
                <div className="w-8 flex flex-col items-center">
                  <span className="text-[8px] font-medium text-zinc-400 capitalize tracking-tighter leading-none mb-0.5">Qty</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white tabular-nums leading-none">
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
                  className="w-[30px] h-[30px] flex items-center justify-center rounded bg-orange-500 text-white shadow-orange-500/20 active:scale-95 transition-all"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>

              <button
                onClick={handleAddToCartBaseItem}
                disabled={!itemAvailability.available}
                className="flex-1 h-[46px] py-1 bg-zinc-900 dark:bg-zinc-100 hover:bg-medium dark:hover:bg-white disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white dark:text-zinc-900 rounded font-medium text-[12px] capitalize tracking-[0.05em] italic flex items-center justify-between px-3.5 transition-all active:scale-[0.98] group border border-zinc-800/50 dark:border-zinc-200/50 overflow-hidden"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* <div className="p-1.5 rounded-xl bg-orange-500 text-white shadow-orange-500/20 group-hover:rotate-12 transition-transform shrink-0">
                          <ShoppingCart size={18} />
                       </div> */}
                  <span className={`truncate ${itemAvailability.available ? "text-white dark:text-zinc-900 group-hover:text-orange-500" : "text-zinc-400"}`}>
                    {itemAvailability.available ? "Proceed to order" : "Sold Out"}
                  </span>
                </div>

                {itemAvailability.available && (
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <div className="w-[1.5px] h-5 bg-white/20 dark:bg-zinc-950/20 rounded-full" />
                    <span className="text-orange-500 tabular-nums font-medium text-base">
                      {total.toLocaleString()}
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
    </>
  );

  if (isModal) {
    return (
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[9999] bg-zinc-50 dark:bg-zinc-950 flex flex-col overflow-hidden w-full h-full"
      >
        {content}
      </motion.div>
    );
  }

  return content;
}
