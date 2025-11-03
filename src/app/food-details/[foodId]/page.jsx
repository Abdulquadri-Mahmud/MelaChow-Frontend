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
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TbCurrencyNaira } from "react-icons/tb";
import axios from "axios";
import { useApi } from "@/app/context/ApiContext";

export default function FoodDetails() {
  const router = useRouter();
  const { foodId } = useParams();

  const {baseUrl} = useApi();

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

  const handleAddClick = (food) => {
    setSelectedFood(food);
    setIsModalOpen(true);
  };

  const handleAddToCart = (item) => {
    console.log("🛒 Added to cart:", item);
  };

  if (!isClient) return <div className="min-h-screen bg-white">Loading...</div>;

  return (
    <>
    {/* <Header2 title={data?.category || "Food Details"}/> */}
     {/* 🧭 Custom Header */}
      <header className="flex items-center px-3 py-2 bg-white sticky top-0 z-50">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <h1 className="md:text-lg text-sm font-semibold text-gray-800 capitalize">
          {data?.vendor?.storeName || "Food Details"} - {data?.vendor?.address
          ? ` ${data.vendor.address.city}`
          : "Address not available"}
        </h1>
      </header>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white rounded-2xl shadow overflow-hidden mt-3">
        {/* Rating + Open Hours */}
        <div className="flex items-center justify-center py-3 px-3 bg-gradient-to-r from-orange-50 to-white">
          {/* <div className="flex items-center gap-2 text-yellow-500 text-sm font-medium">
            <Star size={16} fill="currentColor" />
            <span>{data?.rating || 0}</span>
            <span className="text-gray-400 text-xs">({data?.ratingCount || 0})</span>
          </div> */}

          {/* 🕘 Vendor Opening Time (Clickable) */}
          <motion.div onClick={handleViewVendor} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 text-gray-600 text-sm cursor-pointer group">
            <Clock
              className="text-orange-500 group-hover:text-orange-600 transition"
              size={15}
            />
            <p className="text-sm font-medium text-gray-700 group-hover:text-orange-600 transition flex items-center">
              {openingMessage}
              <ChevronRight size={16} className="ml-1" />
            </p>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Preparation Time / Delivery Fee / Type */}
        <div className="flex flex-wrap justify-between md:justify-evenly items-center px-5 py-3 text-center text-gray-700">
          {/* Prep Time */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-gray-400">Preparation Time</p>
            <p className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <Clock size={13} color={accent} />
              {data?.estimatedDeliveryTime - 5 || "0"} - {data?.estimatedDeliveryTime || "0"} mins
            </p>
          </div>

          {/* Delivery Fee */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-gray-400">Delivery Fee</p>
            <p className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              <TbCurrencyNaira size={13} />
              {data?.deliveryFee}
            </p>
          </div>

          {/* Delivery Type */}
          {data?.vendor?.acceptsDelivery && (
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-gray-400">Delivery Type</p>
              <p className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                <Truck size={14} className="text-orange-500" />
                Instant Delivery
              </p>
            </div>
          )}
        </div>
      </motion.div>


        {/* Body */}
        <div className="md:p-6 p-3 pb-20 space-y-3">
          {isLoading ? (
            <FoodDetailsSkeleton/>
          ) : isError ? (
            <p className="text-center text-red-500">
              Failed to load food details.
            </p>
          ) : data ? (
            <>
              {/* Image Section */}
              <div className="relative w-full h-45 rounded-3xl overflow-hidden">
                {data?.images?.length > 1 ? (
                  <>
                    <motion.img
                      key={currentImage}
                      src={data.images[currentImage]?.url}
                      alt={data?.name}
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    />

                    {/* Image Controls */}
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/40 text-white p-2 rounded-full"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/40 text-white p-2 rounded-full"
                    >
                      ›
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {data.images.map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i === currentImage
                              ? "bg-orange-500"
                              : "bg-white/60"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <img
                    src={data?.images?.[0]?.url || "/placeholder.jpg"}
                    alt={data?.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Basic Info */}
              <div>
                <h3 className="md:text-3xl font-semibold text-gray-800 mb-2">
                  {data?.name}
                </h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  {data?.description ||
                    "No description provided for this dish."}
                </p>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600 col-span-2">
                  <Utensils size={16} color={accent} />
                  Category:
                  <span className="font-medium text-gray-800 ml-1">
                    {data?.category}
                  </span>
                </div>
              </div>

              {/* Metadata Section */}
              {data?.metadata && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-orange-50 rounded-xl border border-orange-100 w-full">
                  <div className="p-2">
                    <h4 className="text-md font-semibold text-orange-700 mb-3 flex items-center gap-2">
                      <Flame size={18} /> Dish Metadata
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 p-1 rounded-b-2xl gap-2 bg-white text-sm text-gray-700">
                    <p>
                      <strong className="text-orange-600 font-semibold">Portion Size:</strong>{" "}
                      {data.metadata.portionSize || "N/A"}
                    </p>
                    <p>
                      <strong className="text-orange-600 font-semibold">Spice Level:</strong>{" "}
                      {data.metadata.spiceLevel || "Not specified"}
                    </p>
                    <p>
                      <strong className="text-orange-600 font-semibold">Chef Special:</strong>{" "}
                      {data.metadata.chefSpecial ? (
                        <span className="text-green-600 font-semibold">
                          Yes
                        </span>
                      ) : (
                        "No"
                      )}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Tags */}
              <div className="overflow-x-auto scroll">
                {data?.tags?.length > 0 && (
                  <div className="flex gap-2">
                    {data.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="bg-orange-50 border border-orange-100 text-orange-600 text-xs px-3 py-1 rounded-full flex items-center gap-1"
                      >
                        <Tag size={12} /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Variants */}
              {data?.variants?.length > 0 && (
                <div className="mt-4">
                  <div className="grid gap-4">
                    {data?.variants?.length > 0 ? (
                      data.variants.map((variant, i) => (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 200, damping: 12 }}
                          className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl shadow-sm shadow-gray-100 hover:shadow-md p-3 md:p-4 transition-all"
                        >
                          {/* Left section — image + details */}
                          <div className="flex items-center gap-4">
                            {variant.image ? (
                              <img
                                src={variant.image}
                                alt={variant.name}
                                className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                                No Image
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-800 text-base leading-tight">
                                {variant.name}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {variant.description || "No description available"}
                              </p>
                              <p className="text-orange-600 font-semibold text-sm mt-1">
                                ₦{(variant.price || 0).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Right section — Add button */}
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => handleAddClick(variant)}
                              className="cursor-pointer bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-semibold text-xs md:text-sm px-5 py-2 rounded-full shadow-sm transition-all"
                            >
                              Add
                            </button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="bg-orange-100 text-orange-500 p-4 rounded-full mb-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 9h.008v.008H9.75V9zM4.5 12a7.5 7.5 0 1115 0 7.5 7.5 0 01-15 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">No variants found.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500">No food found.</p>
          )}
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
