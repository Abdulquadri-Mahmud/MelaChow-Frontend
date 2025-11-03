"use client";

import { useFoodById } from "@/app/hooks/useVendorFoodQuery";
import { motion, AnimatePresence } from "framer-motion";
import { X, Utensils, Star, Clock, Tag, Flame } from "lucide-react";
import { useRef, useState } from "react";

export default function FoodDetailsModal({ foodId, open, setOpen }) {
  const { food, isLoading, isError } = useFoodById(foodId);
  const [currentImage, setCurrentImage] = useState(0);
  const dragRef = useRef(null);
  const accent = "#FF6600";
  const data = food?.data;

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

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />

          {/* Fullscreen Modal */}
          <motion.div
            ref={dragRef}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 150) setOpen(false); // Swipe down to close
            }}
            className="fixed inset-0 bg-white z-50 flex flex-col overflow-y-auto rounded-t-3xl md:rounded-none"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
          >
            {/* Header */}
            <div
              className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white z-10"
              style={{ background: "#FFF8F4" }}
            >
              <div className="flex items-center gap-2">
                <Utensils size={20} color={accent} />
                <h2 className="text-lg font-bold text-gray-800">
                  Food Details
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <X className="text-gray-600" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 pb-20 space-y-6">
              {isLoading ? (
                <p className="text-center text-gray-500 animate-pulse">
                  Loading food details...
                </p>
              ) : isError ? (
                <p className="text-center text-red-500">
                  Failed to load food details.
                </p>
              ) : data ? (
                <>
                  {/* Image Section */}
                  <div className="relative w-full h-72 rounded-3xl overflow-hidden shadow-lg">
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
                    <h3 className="text-3xl font-bold text-gray-800 mb-2">
                      {data?.name}
                    </h3>
                    <p className="text-gray-600 text-base leading-relaxed">
                      {data?.description ||
                        "No description provided for this dish."}
                    </p>
                  </div>

                  {/* Meta Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={16} color={accent} />
                      {data?.estimatedDeliveryTime || "N/A"} mins
                    </div>
                    <div className="flex items-center gap-2 text-yellow-500">
                      <Star size={16} />
                      {data?.rating || 0} ({data?.ratingCount || 0})
                    </div>
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
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-orange-50 p-5 rounded-xl border border-orange-100 mt-4"
                    >
                      <h4 className="text-md font-semibold text-orange-700 mb-3 flex items-center gap-2">
                        <Flame size={18} /> Dish Metadata
                      </h4>
                      <div className="grid gap-2 text-sm text-gray-700">
                        <p>
                          <strong>Portion Size:</strong>{" "}
                          {data.metadata.portionSize || "N/A"}
                        </p>
                        <p>
                          <strong>Spice Level:</strong>{" "}
                          {data.metadata.spiceLevel || "Not specified"}
                        </p>
                        <p>
                          <strong>Chef Special:</strong>{" "}
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

                  {/* Price */}
                  <div className="text-4xl font-bold text-gray-900 mt-6">
                    ₦{(data?.price || 0).toLocaleString()}
                  </div>

                  {/* Tags */}
                  {data?.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
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

                  {/* Variants */}
                  {data?.variants?.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-700 mb-2">
                        Variants
                      </h4>
                      <div className="grid gap-3">
                        {data.variants.map((variant, i) => (
                          <motion.div
                            key={i}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl p-3 shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              {variant.image && (
                                <img
                                  src={variant.image}
                                  alt={variant.name}
                                  className="w-12 h-12 rounded-md object-cover"
                                />
                              )}
                              <div>
                                <p className="font-semibold text-gray-700">
                                  {variant.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  ₦{(variant.price || 0).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500">No food found.</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
