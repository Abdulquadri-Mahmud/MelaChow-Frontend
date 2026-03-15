"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, User, MessageSquare, Filter, ChevronLeft, ChevronRight,
  Edit3, Send, X, Loader2, AlertCircle, RefreshCw, BarChart3,
  Clock, Image as ImageIcon
} from "lucide-react";
import { getRestaurantReviews, getRestaurantReviewsSummary, getFoodReviews, createReview } from "@/app/lib/api";
import toast from "react-hot-toast";

const ReviewsSection = ({ vendorId, vendor, foodList = [] }) => {
  // State management
  const [reviews, setReviews] = useState([]);
  const [reviewsSummary, setReviewsSummary] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRating, setSelectedRating] = useState('all');
  const [activeTab, setActiveTab] = useState('restaurant'); // 'restaurant' or 'food'
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Food reviews state
  const [selectedFood, setSelectedFood] = useState(null);

  const ITEMS_PER_PAGE = 10;

  // Rating filter options
  const ratingFilters = [
    { value: 'all', label: 'All' },
    { value: '5', label: '5★' },
    { value: '4', label: '4★' },
    { value: '3', label: '3★' },
    { value: '2', label: '2★' },
    { value: '1', label: '1★' }
  ];

  // Fetch restaurant reviews summary on mount
  useEffect(() => {
    if (vendorId) {
      fetchReviewsSummary();
    }
  }, [vendorId]);

  // Fetch reviews when filters change
  useEffect(() => {
    if (vendorId && activeTab === 'restaurant') {
      fetchRestaurantReviews();
    }
  }, [vendorId, currentPage, selectedRating, activeTab]);

  // Fetch food reviews when food tab is active and food is selected
  useEffect(() => {
    if (selectedFood && activeTab === 'food') {
      fetchFoodReviews(selectedFood._id);
    }
  }, [selectedFood, currentPage, selectedRating, activeTab]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRating, activeTab, selectedFood]);

  const fetchReviewsSummary = async () => {
    try {
      const response = await getRestaurantReviewsSummary(vendorId);
      if (response.success) {
        setReviewsSummary(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch reviews summary:", error);
    }
  };

  const fetchRestaurantReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const rating = selectedRating === 'all' ? null : parseInt(selectedRating);
      const response = await getRestaurantReviews(vendorId, currentPage, ITEMS_PER_PAGE, rating);
      
      if (response.success) {
        setReviews(response.data.reviews || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch restaurant reviews:", error);
      setError("Failed to load reviews. Please try again.");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodReviews = async (foodId) => {
    try {
      setLoading(true);
      setError(null);
      const rating = selectedRating === 'all' ? null : parseInt(selectedRating);
      const response = await getFoodReviews(foodId, currentPage, ITEMS_PER_PAGE, rating);
      
      if (response.success) {
        setReviews(response.data.reviews || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch food reviews:", error);
      setError("Failed to load food reviews. Please try again.");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      toast.error("Please add a comment");
      return;
    }

    try {
      setIsSubmittingReview(true);
      const reviewData = {
        vendorId,
        rating: reviewRating,
        comment: reviewComment
      };

      if (selectedFood && activeTab === 'food') {
        reviewData.foodId = selectedFood._id;
      }

      await createReview(reviewData);
      toast.success("Review submitted successfully!");
      setShowReviewForm(false);
      setReviewComment("");
      setReviewRating(5);
      
      // Refresh reviews and summary
      fetchReviewsSummary();
      if (activeTab === 'restaurant') {
        fetchRestaurantReviews();
      } else if (selectedFood) {
        fetchFoodReviews(selectedFood._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRatingFilter = (rating) => {
    setSelectedRating(rating);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedFood(null);
    setReviews([]);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} month${Math.ceil(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.ceil(diffDays / 365)} year${Math.ceil(diffDays / 365) > 1 ? 's' : ''} ago`;
  };

  const renderStars = (rating, size = 16) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={size}
        className={`${
          index < rating 
            ? "text-yellow-400 fill-yellow-400" 
            : "text-gray-200 fill-gray-200"
        }`}
      />
    ));
  };

  const renderRatingDistribution = () => {
    if (!reviewsSummary?.ratingDistribution) return null;

    const distribution = reviewsSummary.ratingDistribution;
    const totalReviews = Object.values(distribution).reduce((sum, count) => sum + count, 0);

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = distribution[rating] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          
          return (
            <div key={rating} className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600 w-8">{rating}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === page
                ? "bg-orange-500 text-white"
                : "border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Reviews Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Overall Rating */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
              {reviewsSummary && (
                <span className="text-sm text-gray-500">
                  ({reviewsSummary.totalReviews || 0} review{(reviewsSummary.totalReviews || 0) !== 1 ? 's' : ''})
                </span>
              )}
            </div>
            
            {reviewsSummary ? (
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    {reviewsSummary.averageRating?.toFixed(1) || '0.0'}
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {renderStars(Math.round(reviewsSummary.averageRating || 0), 20)}
                  </div>
                  <p className="text-sm text-gray-500">Overall Rating</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-2xl font-bold text-gray-400 mb-2">No ratings yet</div>
                <p className="text-sm text-gray-500">Be the first to leave a review!</p>
              </div>
            )}
          </div>

          {/* Rating Distribution */}
          {reviewsSummary?.ratingDistribution && (
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={20} className="text-gray-600" />
                <h3 className="font-semibold text-gray-900">Rating Distribution</h3>
              </div>
              {renderRatingDistribution()}
            </div>
          )}
        </div>

        {/* Rating Filters */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-gray-100">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700 mr-2">Filter by rating:</span>
          <div className="flex gap-2 flex-wrap">
            {ratingFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleRatingFilter(filter.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedRating === filter.value
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Review Action */}
      <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Have you ordered from {vendor?.storeName}?</h3>
          <p className="text-sm text-gray-600">Share your experience to help others make better choices.</p>
        </div>
        <button
          onClick={() => setShowReviewForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
        >
          <Edit3 size={18} /> Write a Review
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-2xl w-full">
        <button
          onClick={() => handleTabChange('restaurant')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'restaurant' 
              ? 'bg-white shadow-sm text-gray-900' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Restaurant Reviews
        </button>
        <button
          onClick={() => handleTabChange('food')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'food' 
              ? 'bg-white shadow-sm text-gray-900' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Food Reviews
        </button>
      </div>

      {/* Food Selection (when food tab is active) */}
      {activeTab === 'food' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Select a food item to see reviews:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {foodList.map((food) => (
              <button
                key={food._id}
                onClick={() => setSelectedFood(food)}
                className={`p-4 rounded-2xl border-2 transition-all text-left ${
                  selectedFood?._id === food._id
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {food.image || food.images?.[0]?.url ? (
                      <img
                        src={food.image || food.images?.[0]?.url}
                        alt={food.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={20} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{food.name}</h4>
                    <p className="text-sm text-gray-500">₦{food.price?.toLocaleString()}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Loading reviews...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h4 className="text-gray-900 font-bold mb-2">Failed to load reviews</h4>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => {
                if (activeTab === 'restaurant') {
                  fetchRestaurantReviews();
                } else if (selectedFood) {
                  fetchFoodReviews(selectedFood._id);
                }
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        ) : activeTab === 'food' && !selectedFood ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-gray-900 font-bold mb-2">Select a food item</h4>
            <p className="text-gray-500 text-sm">Choose a food item above to see its reviews</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-gray-900 font-bold mb-2">No reviews yet</h4>
            <p className="text-gray-500 text-sm">
              {activeTab === 'restaurant' 
                ? "Be the first to review this restaurant!" 
                : "Be the first to review this food item!"
              }
            </p>
          </div>
        ) : (
          <>
            {reviews.map((review, index) => (
              <motion.div
                key={review._id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0">
                    <User size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">
                          {review.userId?.firstname && review.userId?.lastname 
                            ? `${review.userId.firstname} ${review.userId.lastname}`
                            : review.userId?.firstname || "Anonymous"
                          }
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating, 14)}
                          </div>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Food info for food reviews */}
                    {review.foodId && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                        {review.foodId.images?.[0] && (
                          <img
                            src={review.foodId.images[0]}
                            alt={review.foodId.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{review.foodId.name}</p>
                          <p className="text-xs text-gray-500">₦{review.foodId.price?.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Pagination */}
            {renderPagination()}
          </>
        )}
      </div>

      {/* Review Form Modal */}
      <AnimatePresence>
        {showReviewForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReviewForm(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white rounded-[32px] p-6 shadow-2xl z-50 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {activeTab === 'food' && selectedFood 
                    ? `Review ${selectedFood.name}`
                    : `Review ${vendor?.storeName}`
                  }
                </h3>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      size={32}
                      className={`${
                        star <= reviewRating 
                          ? "text-yellow-400 fill-yellow-400" 
                          : "text-gray-200 fill-gray-100"
                      }`}
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
                disabled={isSubmittingReview || !reviewComment.trim()}
                className="w-full py-3 bg-gray-900 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingReview ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Submit Review <Send size={16} />
                  </>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewsSection;
