"use client";

import { useFoods, useVendorFood } from "@/app/hooks/useVendorFoodQuery";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Star,
  Utensils,
  Clock,
  Pencil,
  Plus,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import FoodListSkeleton from "@/app/components/skeletons/FoodListSkeleton";
import FoodDetailsModal from "@/app/components/modals/FoodDetailsModal";
import { getVendorId } from "@/app/utils/vendor/api/vendorId";

export default function Page() {
  const { foods, isLoading, deleteFood } = useVendorFood(getVendorId());

  console.log(getVendorId);

  const [deleting, setDeleting] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);

  const [selectedFoodId, setSelectedFoodId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();

  const itemsPerPage = 6;
  const accent = "#FF6600";

  // Escape regex special chars for highlight
  const escapeRegExp = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Highlight matching search term
  const highlight = (text = "", term = "") => {
    if (!term) return text;
    const re = new RegExp(`(${escapeRegExp(term)})`, "gi");
    const parts = String(text).split(re);
    return parts.map((part, i) =>
      re.test(part) ? (
        <mark
          key={i}
          style={{
            background: "transparent",
            color: accent,
            fontWeight: 700,
          }}
        >
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  // Filter foods by search term
  const filteredFoods = useMemo(() => {
    if (!foods?.data) return [];
    if (!searchTerm) return foods.data;
    const term = searchTerm.toLowerCase();

    return foods.data.filter((food) => {
      if (food.name?.toLowerCase().includes(term)) return true;
      if (food.description?.toLowerCase().includes(term)) return true;
      if (food.category?.toLowerCase().includes(term)) return true;
      if (Array.isArray(food.tags)) {
        if (food.tags.some((t) => t.toLowerCase().includes(term))) return true;
      }
      if (Array.isArray(food.variants)) {
        const vMatch = food.variants.some((v) => {
          if (v.name?.toLowerCase().includes(term)) return true;
          if (v.price?.toString().includes(term)) return true;
          return false;
        });
        if (vMatch) return true;
      }
      return false;
    });
  }, [foods, searchTerm]);

  // Compute stats
  const stats = useMemo(() => {
    if (!foods?.data) return { total: 0, available: 0, unavailable: 0 };
    const total = foods.data.length;
    const available = foods.data.filter((f) => f.available).length;
    const unavailable = total - available;
    return { total, available, unavailable };
  }, [foods]);

  const totalPages = Math.ceil((filteredFoods?.length || 0) / itemsPerPage);
  const paginatedFoods = filteredFoods?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading)
    return (
      <div>
        <FoodListSkeleton />
      </div>
    );

  return (
    <div className="space-y-6 flex-1">
      {/* ===== Stats Section with Progress Bars ===== */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-4 mb-4 bg-white p-4 rounded-xl shadow shadow-gray-100">
        {[
          {
            label: "Total Items",
            value: stats.total,
            color: "orange",
            percent:
              stats.total > 0
                ? Math.round((stats.available / 100) * 100)
                : 0,
          },
          {
            label: "Available",
            value: stats.available,
            color: "green",
            percent:
              stats.total > 0
                ? Math.round((stats.available / 100) * 100)
                : 0,
          },
          {
            label: "Unavailable",
            value: stats.unavailable,
            color: "red",
            percent:
              stats.total > 0
                ? Math.round((stats.unavailable / 100) * 100)
                : 0,
          },
        ].map((s, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-4 rounded-2xl border border-gray-50 text-center"
          >
            <h2 className={`text-sm font-semibold text-${s.color}-600`}>
              {s.label}
            </h2>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>

            {/* Progress Bar */}
            <div className="mt-3 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.percent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  s.color === "orange"
                    ? "bg-orange-500"
                    : s.color === "green"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              ></motion.div>
            </div>

            {/* <p className="text-xs text-gray-500 mt-1">
              {s.percent}% of total
            </p> */}
          </motion.div>
        ))}
      </div>

      {/* ===== Sticky Search Header ===== */}
      <div className="sticky -top-3 z-30">
        <div className="flex flex-col bg-white md:p-3 p-2 rounded-xl justify-between items-center gap-3 shadow-sm shadow-gray-100">
          <h1 className="md:block hidden text-2xl font-semibold text-gray-600 mb-3">
            <span className="bg-orange-500 rounded-full p-1 mr-2">
              <span className="bg-white rounded-full">🍳</span>
            </span> 
            Culinary Masterpieces
          </h1>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-72 w-full">
              <Search
                size={18}
                className="absolute left-3 top-2.5 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by name, tag, variant, price..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-gray-100 pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm"
              />
            </div>

            {/* Add Food */}
            <button type="button"
              onClick={() => router.push("create-food")}
              className="md:block hidden flex items-center gap-2 cursor-pointer bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg shadow transition-all"
            >
              <Plus size={18} /> Create New Food
            </button>
          </div>
        </div>
      </div>

      {/* ===== Empty / Results ===== */}
      {filteredFoods?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-100 shadow-sm text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="bg-orange-50 p-4 rounded-full mb-3">
              <Search size={36} className="text-orange-500" />
            </div>

            <h3 className="text-gray-800 font-semibold text-lg mb-1">
              No Results Found
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
              We couldn’t find any foods matching your search.  
              Try adjusting your filters or search term.
            </p>

            <button type="button"
              onClick={() => setSearchTerm("")}
              className="mt-4 text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-1 transition-all"
            >
              <X size={14} /> Clear Search
            </button>
          </motion.div>
        </div>
      ) : (
        <>
          {/* ===== Food Cards ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 md:gap-6 gap-3">
            {paginatedFoods?.map((food) => (
              <motion.div
                key={food._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-white relative rounded-2xl shadow-md shadow-gray-100 overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Image */}
                <div className="relative">
                  <img
                    src={food.images?.[0]?.url || "/placeholder.jpg"}
                    alt={food.name}
                    className="w-full h-48 object-cover"
                  />
                  <span
                    className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full ${
                      food.available
                        ? "bg-green-500 text-white"
                        : "bg-gray-400 text-white"
                    }`}
                  >
                    {food.available ? "Available" : "Unavailable"}
                  </span>
                  <button type="button" onClick={() => {
                      setSelectedFoodId(food._id);
                      setIsModalOpen(true);
                    }}
                    className="absolute bottom-2 left-2 rounded-tl-2xl bg-white/90 border border-orange-400 text-orange-600 flex items-center justify-center gap-2 text-sm py-2 px-3 rounded-md cursor-pointer hover:bg-orange-50 transition-all"
                  >
                    <Utensils size={16} /> View
                  </button>
                </div>

                {/* Details */}
                <div className="p-2">
                  <h3 className="truncate text-lg font-semibold text-gray-800 mb-1">
                    {highlight(food.name, searchTerm)}
                  </h3>
                  {/* <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {highlight(food.description || "", searchTerm)}
                  </p> */}

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star size={16} />
                      <span className="text-sm">
                        {food.rating} ({food.ratingCount})
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      ₦{(food.price || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Utensils size={12} />{" "}
                      {highlight(food.category || "", searchTerm)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {food.estimatedDeliveryTime} mins
                    </span>
                  </div>

                  {/* <div className="flex flex-wrap gap-1 mb-4">
                    {food.tags?.slice(0, 4).map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-full"
                      >
                        {highlight(`#${tag}`, searchTerm)}
                      </span>
                    ))}
                  </div> */}

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => setSelectedFood(food)}
                      className="absolute top-2 left-2 rounded-tl-2xl bg-white/90 border border-orange-400 text-orange-600 flex items-center justify-center gap-2 text-sm py-2 px-3 rounded-md cursor-pointer hover:bg-orange-50 transition-all"
                    >
                      <Utensils size={16} /> Variants
                    </button>

                    <button type="button"
                      onClick={() =>
                        router.push(`update-food/${food._id}`)
                      }
                      className="rounded-bl-2xl flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 rounded-md transition-all"
                    >
                      <Pencil size={16} /> Update
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setDeleting(food._id);

                          // ✅ Use the new format for deleting everything
                          await deleteFood({
                            id: food._id,
                            options: { deleteAll: true },
                          });
                        } finally {
                          setDeleting(null);
                        }
                      }}
                      disabled={deleting === food._id}
                      className={`rounded-br-2xl flex-1 flex items-center justify-center gap-2 text-white text-sm py-2 rounded-md transition-all ${
                        deleting === food._id
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-red-500 hover:bg-red-600"
                      }`}
                    >
                      {deleting === food._id ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} /> Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ===== Pagination ===== */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-10">
              <button type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className={`px-4 py-2 rounded-md font-medium ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
              >
                Previous
              </button>

              <span className="text-gray-700 text-sm">
                Page {currentPage} of {totalPages}
              </span>

              <button type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className={`px-4 py-2 rounded-md font-medium ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* ===== Variants Modal ===== */}
      <AnimatePresence>
        {selectedFood && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFood(null)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-xl z-50 max-h-[80vh] overflow-y-auto"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
            >
              <div
                className="flex justify-between items-center p-5 border-b border-gray-100"
                style={{ background: "#FFF8F4" }}
              >
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Utensils size={18} color={accent} /> {selectedFood.name} —{" "}
                  <span style={{ color: accent }}>Variants</span>
                </h2>
                <button type="button"
                  onClick={() => setSelectedFood(null)}
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <X className="text-gray-600" />
                </button>
              </div>

              <div className="p-6">
                {selectedFood.variants?.length > 0 ? (
                  <div className="grid gap-3">
                    {selectedFood.variants.map((variant, i) => (
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
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-10 text-gray-600">
                    <Utensils size={48} color={accent} className="mb-3" />
                    <p className="font-medium mb-2">
                      No variants added for this food yet.
                    </p>
                    <button type="button"
                      onClick={() =>
                        router.push(`update-food/${selectedFood._id}`)
                      }
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow transition-all"
                    >
                      <Plus size={16} /> Add Variant
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <FoodDetailsModal
        foodId={selectedFoodId}
        open={isModalOpen}
        setOpen={setIsModalOpen}
      />
    </div>
  );
}
