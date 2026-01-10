"use client";

import Header2 from "@/app/components/App_Header/Header2";
import AddToCartModal from "@/app/components/Cart/AddToCartModal";
import { getVendorOpenStatus } from "@/app/lib/vendor-time/vendorTime";
import FoodDetailsSkeleton from "@/app/skeleton/FoodDetailsSkeleton";
import { motion } from "framer-motion";
import {
  Utensils,
  Clock,
  Tag,
  Flame,
  ArrowLeft,
  Truck,
  ChevronRight,
  Store,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TbCurrencyNaira } from "react-icons/tb";
import axios from "axios";
import { useApi } from "@/app/context/ApiContext";
import { useCart } from "@/app/context/CartContext";
import Link from "next/link";
import { BiCartAdd } from "react-icons/bi";
import toast from 'react-hot-toast';


export default function FoodDetails() {
  const router = useRouter();
  const { foodId } = useParams();

  const { baseUrl } = useApi();

  const { addToCart, cart } = useCart();

  const [food, setFood] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedFood, setSelectedFood] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dragRef = useRef(null);
  const accent = "#FF6600";

  // ✅ Fetch food by ID
  useEffect(() => {
    const fetchFood = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(
          `${baseUrl}/vendors/foods/get-food?id=${foodId}`
        );
        setFood(res?.data?.data);
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

  // ✅ Ensure this runs client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const data = food;

  // console.log(food);

  const openingMessage = data?.vendor?.openingHours
    ? getVendorOpenStatus(data.vendor.openingHours)
    : "Opening hours not available.";

  const nextImage = () => {
    if (!data?.images?.length) return;
    setCurrentImage((prev) => (prev + 1) % data.images.length);
  };

  const prevImage = () => {
    if (!data?.images?.length) return;
    setCurrentImage((prev) =>
      prev === 0 ? data.images.length - 1 : prev - 1
    );
  };

  const handleViewVendor = () => {
    if (data?.vendor?._id) {
      router.push(`/view-vendor/${data.vendor._id}`);
    }
  };

  const handleAddClick = (variant) => {
    if (!variant) return;

    // Build payload for AddToCartModal
    const payload = {
      // Basic identifiers
      foodId: data._id,              // Main food ID
      variantId: variant._id,        // Variant ID
      restaurantId: data.vendor._id, // Vendor/restaurant ID
      storeName: data?.vendor?.storeName, // Vendor/restaurant ID

      // Names & pricing
      name: data.name,               // Food name
      variantName: variant.name,     // Variant name
      price: variant.price || 0,     // Price
      image: variant.image || data.images?.[0]?.url || "", // Variant or food image
      quantity: 1,                   // Default quantity
      notes: "",                     // Optional notes

      // Vendor & delivery info
      estimatedDeliveryTime: {
        min: (data.estimatedDeliveryTime - 5) || 0,
        max: data.estimatedDeliveryTime || 0,
      },
      deliveryFee: data.deliveryFee || 0,
      deliveryType: data.vendor?.acceptsDelivery ? "Instant Delivery" : "Pickup",

      // Dish metadata
      metadata: {
        portionSize: data.metadata?.portionSize || "N/A",
        spiceLevel: data.metadata?.spiceLevel || "Not specified",
        chefSpecial: data.metadata?.chefSpecial || false,
      },

      // Optional category/tags
      category: data.category || "Uncategorized",
      tags: data.tags || [],
    };

    setSelectedFood(payload);
    setIsModalOpen(true);
  };

  const handleAddToCart = (item) => {
    addToCart(item); // ✅ Add to global 
    // console.log(item)
    // toast.success("🛒 Added to cart:", item)
  };

  if (!isClient) return <div className="min-h-screen bg-white">Loading...</div>;

  const totalItems = cart.length;

  return (
    <>

      {/* <Header2 title={data?.category || "Food Details"}/> */}
      {/* 🧭 Custom Header */}
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
              {data?.vendor?.storeName || "Food Details"}
            </h2>
          </div>
        </div>

        <Link href={'/orders?activeTab=cart'}>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative bg-gray-900 p-2.5 rounded-2xl shadow-lg shadow-gray-200">
            <BiCartAdd className="text-white" size={24} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-orange-500 ring-4 ring-white text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-black">
                {totalItems}
              </span>
            )}
          </motion.div>
        </Link>
      </header>

      <div className="max-w-4xl mx-auto pb-24">
        {isLoading ? (
          <div className="p-4"><FoodDetailsSkeleton /></div>
        ) : isError ? (
          <div className="text-center py-20 px-6">
            <div className="bg-red-50 text-red-500 p-6 rounded-[32px] border border-dashed border-red-200">
              <p className="font-bold">Oops! Failed to load the dish.</p>
              <button onClick={() => window.location.reload()} className="mt-4 text-sm underline font-black">Try Again</button>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-3">
            {/* Main Info Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-3 pt-3">
              <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden">
                {/* Image Section */}
                <div className="relative w-full bg-gray-100 p-2">
                  <div className="w-full h-[200px] rounded-[32px] overflow-hidden relative shadow-inner">
                    {data?.images?.length > 1 ? (
                      <>
                        <motion.img
                          key={currentImage}
                          src={data.images[currentImage]?.url}
                          alt={data?.name}
                          className="w-full h-full object-cover"
                          initial={{ opacity: 0, scale: 1.1 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.6 }}
                        />

                        {/* Image Navigation */}
                        <div className="absolute inset-0 flex justify-between items-center px-4">
                          <button onClick={prevImage} className="bg-white/20 backdrop-blur-md text-white w-10 h-10 rounded-2xl flex items-center justify-center border border-white/20 hover:bg-white/40 transition-colors">‹</button>
                          <button onClick={nextImage} className="bg-white/20 backdrop-blur-md text-white w-10 h-10 rounded-2xl flex items-center justify-center border border-white/20 hover:bg-white/40 transition-colors">›</button>
                        </div>

                        {/* Progress Dots */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {data.images.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImage ? "w-6 bg-orange-500" : "w-1.5 bg-white/40"}`} />
                          ))}
                        </div>
                      </>
                    ) : (
                      <img src={data?.images?.[0]?.url || "/placeholder.jpg"} alt={data?.name} className="w-full h-full object-cover" />
                    )}

                    {/* Floating Badges */}
                    <div className="absolute top-3 left-3 pr-6 flex justify-between w-full gap-2">
                      <div className="bg-orange-500 text-white text-[10px] font-semibold px-3 py-1 rounded-full shadow-lg uppercase tracking-widest">{data.category}</div>
                        {data.metadata?.chefSpecial && (
                          <div className="bg-white/95 backdrop-blur-md text-gray-900 text-[10px] font-semibold px-3 py-1 rounded-full shadow-lg uppercase tracking-widest border border-gray-100">👨‍🍳 Chef Special</div>
                        )}
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div className="p-2">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-xl font-bold text-gray-700 leading-tight tracking-tight uppercase">
                      {data?.name}
                    </h3>
                  </div>

                  <p className="text-gray-500 text-sm leading-relaxed mt-2 italic font-medium">
                    "{data?.description || "A masterfully crafted dish prepared with the finest ingredients and a touch of passion."}"
                  </p>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-3 py-3 border-y border-gray-50">
                    <div className="space-y-1">
                      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Estimated</p>
                      <div className="flex items-center gap-1.5 text-gray-900">
                        <Clock size={14} className="text-orange-500" />
                        <span className="text-sm font-semibold">{data?.estimatedDeliveryTime || 25} MINS</span>
                      </div>
                    </div>
                    <div className="space-y-1 border-x border-gray-50 px-4">
                      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Delivery</p>
                      <div className="flex items-center gap-1.5 text-gray-900">
                        <TbCurrencyNaira size={18} className="text-orange-500" />
                        <span className="text-sm font-semibold">{data?.deliveryFee || 0}</span>
                      </div>
                    </div>
                    <div className="space-y-1 pl-4">
                      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Spice</p>
                      <div className="flex items-center gap-1.5 text-gray-900">
                        <Flame size={14} className="text-orange-500" />
                        <span className="text-sm font-semibold uppercase">{data.metadata?.spiceLevel || 'Mild'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {data?.tags?.length > 0 && (
                    <div className="pb-2 flex flex-wrap gap-2 mt-3">
                      {data.tags.map((tag, i) => (
                        <span key={i} className="text-[9px] font-semibold text-gray-400 border border-gray-100 px-3 py-1 rounded-full uppercase tracking-widest group-hover:border-orange-200 group-hover:text-orange-600 transition-colors">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Vendor Status Info */}
            <div className="px-2">
              <motion.div onClick={handleViewVendor} whileHover={{ x: 5 }} className="bg-gray-900 rounded-[32px] p-3 flex justify-between items-center cursor-pointer shadow-xl shadow-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                    <Store size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-widest">Provided by</p>
                    <h4 className="text-white font-bold tracking-tight italic uppercase">{data?.vendor?.storeName}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] font-semibold px-3 py-1 rounded-full border shadow-sm ${openingMessage.includes('Open now') ? 'border-emerald-500/50 text-emerald-400' : 'border-rose-500/50 text-rose-400'}`}>
                    {openingMessage}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Selection Section */}
            <div className="px-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-gray-900 rounded-full"></div>
                <h3 className="text-xl font-semibold text-gray-900 tracking-tight uppercase">Select Options</h3>
              </div>

              {data?.variants?.length > 0 ? (
                <div className="grid gap-4">
                  {data.variants.map((variant, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group bg-white border border-gray-100 rounded-[32px] p-2 flex items-center justify-between hover:shadow-2xl hover:shadow-gray-100 transition-all duration-500"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 rounded-[16px] overflow-hidden bg-gray-50 flex-shrink-0">
                          {variant.image ? (
                            <img src={variant.image} alt={variant.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300"><Utensils size={32} /></div>
                          )}
                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900  text-sm">{variant.name}</h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic font-medium">{variant.description || "A premium variant crafted for your satisfaction."}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="font-bold text-gray-900 tabular-nums">₦{variant.price?.toLocaleString()}</span>
                            <span className="text-[10px] font-semibold text-orange-500 bg-orange-50 px-2.5 py-0.5 rounded-lg uppercase tracking-tighter">Verified Price</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddClick(variant)}
                        className="w-10 h-10 rounded-[20px] bg-gray-900 text-white flex items-center justify-center hover:bg-orange-600 active:scale-90 transition-all shadow-lg shadow-gray-200"
                      >
                        <BiCartAdd size={20} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-[40px] border border-dashed border-gray-200 mx-4">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No variations available for this dish</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <AddToCartModal
        food={selectedFood}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddToCart}
      />
    </>
  );
}
