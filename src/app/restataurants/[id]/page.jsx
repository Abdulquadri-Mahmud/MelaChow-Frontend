"use client";

import { ArrowLeft, Clock, Search, Star, ArrowRight, MapPin, MessageSquare, Send, User, X, Edit3 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useVendorFood } from "@/app/hooks/useVendorFoodQuery";
import VendorSkeleton from "@/app/skeleton/VendorSkeleton";
import { getVendorOpenStatus } from "@/app/lib/vendor-time/vendorTime";
import { useState, useMemo, useEffect } from "react";
import { createReview, getVendorReviews } from "@/app/lib/api";
import toast from "react-hot-toast";

export default function ViewVendor() {
  const { id } = useParams();
  const router = useRouter();

  const { foods, isLoading, isError } = useVendorFood(id);

  const foodList = foods?.data || [];
  const vendor = foodList?.[0]?.vendor;
  const deliveryFee = foodList?.[0]?.deliveryFee;
  const estimatedTime = foodList?.[0]?.estimatedDeliveryTime;
  const hours = vendor?.openHours || vendor?.openingHours;
  const openingMessage = hours
    ? getVendorOpenStatus(hours)
    : "Opening hours not available.";

  // Filter & search state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Reviews State
  const [activeTab, setActiveTab] = useState("menu"); // 'menu' | 'reviews'
  const [reviews, setReviews] = useState([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Extract unique categories (Flattening the categories array from each food item)
  const categories = useMemo(() => {
    const allCats = foodList.flatMap((f) => f.categories || [f.category]).filter(Boolean);
    return ["All", ...Array.from(new Set(allCats))];
  }, [foodList]);

  // Filtered foods logic
  const filteredFoods = useMemo(() => {
    let filtered = selectedCategory === "All"
      ? foodList
      : foodList.filter((food) => {
        // Supports both array 'categories' and string 'category'
        if (Array.isArray(food.categories)) {
          return food.categories.includes(selectedCategory);
        }
        return food.category === selectedCategory;
      });

    if (searchQuery.trim()) {
      filtered = filtered.filter((food) =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [foodList, selectedCategory, searchQuery]);

  useEffect(() => {
    if (id && activeTab === 'reviews') {
      fetchReviews();
    }
  }, [id, activeTab]);

  const fetchReviews = async () => {
    try {
      setIsReviewsLoading(true);
      const res = await getVendorReviews(id);
      setReviews(res.reviews || []);
    } catch (error) {
      //  console.error("Failed to fetch reviews", error);
      // Fallback/Mock if 403 or other
      // setReviews([]); 
      // Optionally mock for display if needed as per instructions
      // For now, let's leave valid empty state if failed.
    } finally {
      setIsReviewsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      toast.error("Please add a comment");
      return;
    }

    try {
      setIsSubmittingReview(true);
      await createReview({
        vendorId: id,
        rating: reviewRating,
        comment: reviewComment
      });
      toast.success("Review submitted successfully!");
      setShowReviewForm(false);
      setReviewComment("");
      setReviewRating(5);
      // Refresh reviews
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // console.log(vendor)
  return (
    <>
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-3 bg-white sticky top-0 z-50 shadow-sm border-b border-gray-50">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-sm font-semibold text-gray-800 truncate">
          {vendor?.storeName || "Restaurant Details"}
        </h1>
      </header>

      <div className="max-w-4xl mx-auto px-3 pb-24 pt-3 space-y-6">
        {isLoading ? (
          <VendorSkeleton />
        ) : isError ? (
          <div className="text-center py-10 bg-red-50 rounded-3xl border border-dashed border-red-200 mx-3">
            <p className="text-red-500 font-medium">Failed to load restaurant details</p>
            <button onClick={() => window.location.reload()} className="mt-4 bg-red-500 text-white px-6 py-2 rounded-full font-bold shadow-md">Retry</button>
          </div>
        ) : !vendor ? (
          // Fallback if vendor object is missing within foodList (unlikely if foods exist, but safe)
          <div className="md:col-span-2 col-span-1 text-center py-12">
            <p className="text-gray-500">No menu items available at the moment.</p>
          </div>
        ) : (
          <>
            {/* Vendor Info Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100" >
              {/* Banner */}
              <div className="relative w-full h-40">
                <img src={vendor.logo || "/vendor-banner-placeholder.jpg"} alt="Vendor Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                {/* Floating Logo */}
                <div className="absolute -bottom-6 left-6 p-1 bg-white rounded-2xl shadow-lg border border-gray-100">
                  <img src={vendor.logo || "/placeholder.jpg"} alt={vendor.storeName} className="w-20 h-20 rounded-xl object-cover" />
                </div>

                {/* Quick Badges */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {vendor.isPopular && (
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-md">🔥 POPULAR</span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="pt-10 p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-bold text-gray-900 text-2xl tracking-tight">{vendor.storeName}</h2>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin size={12} className="text-orange-500" />
                      {vendor.address?.city}, {vendor.address?.state}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end mb-1">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-gray-900 text-sm">
                        {vendor.rating || 0}
                        <span className="text-gray-500 font-normal text-xs ml-1">({vendor.ratingCount || 0})</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{vendor.ratingCount || 0} REVIEWS</p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mt-6 py-3 border-y border-gray-50">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Delivery Time</p>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-orange-500" />
                      <span className="font-bold text-sm text-gray-800">{estimatedTime} mins</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 border-l border-gray-50 pl-4">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Delivery Fee</p>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-gray-800">from | ₦{deliveryFee || 0}</span>
                    </div>
                  </div>
                  {vendor.acceptsDelivery && (
                    <div className="flex flex-col gap-1 border-l border-gray-50 pl-4">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Method</p>
                      <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-100 w-fit">INSTANT</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-2xl w-full">
              <button
                onClick={() => setActiveTab('menu')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'menu' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Menu
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'reviews' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Reviews
              </button>
            </div>

            {/* MENU CONTENT */}
            {activeTab === 'menu' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Filter & Search Section */}
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Search dishes or categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3 outline-none text-sm transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-50 focus:bg-white"
                  />
                </div>

                {/* Categories Scroll */}
                <div className="flex gap-2 overflow-x-auto scroll no-scrollbar pb-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-5 py-2.5 rounded-xl border text-sm font-bold whitespace-nowrap transition-all
                          ${selectedCategory === cat
                          ? "bg-gray-900 border-gray-900 text-white shadow-lg shadow-gray-200"
                          : "bg-white border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-600"
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Foods Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5 mt-4">
                  {filteredFoods.length === 0 ? (
                    <div className="col-span-full py-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <p className="text-gray-500 font-medium">No results found for "{searchQuery}"</p>
                    </div>
                  ) : (
                    filteredFoods.map((food, idx) => (
                      <motion.div
                        key={food._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => router.push(`/food-details/${food._id}`)}
                        className="bg-white border border-gray-100 rounded-[24px] p-3 cursor-pointer hover:shadow-xl hover:shadow-gray-100 hover:border-orange-100 transition-all flex gap-4 group h-fit"
                      >
                        <div className="relative w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0">
                          <img
                            src={food.image || food.images?.[0]?.url || food.variantImage || "/placeholder.jpg"}
                            alt={food.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            {/* Categories / Tags Display */}
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h4 className="text-sm font-bold text-gray-900 line-clamp-1 leading-tight">{food.name}</h4>
                              {(food.categories || [food.category]).slice(0, 1).map((cat) => (
                                <span key={cat} className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded capitalize shrink-0">
                                  {cat}
                                </span>
                              ))}
                            </div>

                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                              {food.description || "Fresh and delicious meal crafted just for you."}
                            </p>
                          </div>

                          <div className="flex justify-between items-end mt-2">
                            <p className="text-base font-black text-gray-900 tabular-nums">₦{food.price?.toLocaleString()}</p>
                            <div className="bg-gray-900 text-white p-2 rounded-xl shadow-lg group-hover:bg-orange-600 transition-colors">
                              <ArrowRight size={16} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* REVIEWS CONTENT */}
            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

                {/* Review Action */}
                <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Have you ordered from {vendor.storeName}?</h3>
                    <p className="text-sm text-gray-600">Share your experience to help others.</p>
                  </div>
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    <Edit3 size={18} /> Write a Review
                  </button>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {isReviewsLoading ? (
                    <div className="text-center py-10">
                      <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-gray-500 text-sm">Loading reviews...</p>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MessageSquare size={24} className="text-gray-300" />
                      </div>
                      <h4 className="text-gray-900 font-bold mb-1">No reviews yet</h4>
                      <p className="text-gray-400 text-sm">Be the first to create one!</p>
                    </div>
                  ) : (
                    reviews.map((review, i) => (
                      <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0">
                          <User size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-gray-900 text-sm">{review.user?.firstName || "Anonymous"}</h4>
                            <span className="text-[10px] text-gray-400">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: 5 }).map((_, starIdx) => (
                              <Star key={starIdx} size={12} className={`${starIdx < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                            ))}
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

          </>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowReviewForm(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-sm h-fit bg-white rounded-[32px] p-6 shadow-2xl z-50 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Rate & Review</h3>
                <button onClick={() => setShowReviewForm(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition"><X size={18} /></button>
              </div>

              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setReviewRating(star)} className="transition-transform hover:scale-110 active:scale-95">
                    <Star
                      size={32}
                      className={`${star <= reviewRating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-100"}`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience..."
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all mb-4 resize-none"
              />

              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
                className="w-full py-3 bg-gray-900 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isSubmittingReview ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> : <>Submit Review <Send size={16} /></>}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  );
}
