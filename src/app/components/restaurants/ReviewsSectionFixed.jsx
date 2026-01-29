"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, User, MessageSquare, Filter, ChevronLeft, ChevronRight,
  Edit3, Send, X, Loader2, AlertCircle, RefreshCw, BarChart3,
  Clock, Image as ImageIcon, ArrowRight
} from "lucide-react";
import { getRestaurantReviews, getRestaurantReviewsSummary, getFoodReviews, createReview } from "@/app/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { useApi } from "@/app/context/ApiContext";
import axios from "axios";

// Simple toast function to avoid import issues
const showToast = (message, type = 'info') => {
  console.log(`Toast ${type}:`, message);
  // You can implement a simple toast here or use browser alert for now
  if (type === 'error') {
    alert(`Error: ${message}`);
  } else {
    alert(message);
  }
};

const ReviewsSectionFixed = ({ vendorId, vendor, foodList = [] }) => {
  // Hooks for user data and API
  const { user } = useUserStorage();
  const { baseUrl } = useApi();

  // Enhanced state management for new API response format
  const [reviews, setReviews] = useState([]);
  const [reviewsSummary, setReviewsSummary] = useState({
    restaurant: { averageRating: 0, totalReviews: 0 },
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    ratingPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    ratingBreakdown: null
  });
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

  // Order-based review state
  const [showOrderReviewModal, setShowOrderReviewModal] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);

  // Food reviews state
  const [selectedFood, setSelectedFood] = useState(null);

  const ITEMS_PER_PAGE = 10;

  // Fetch user orders using React Query (same pattern as orders page)
  const fetchUserOrders = async () => {
    if (!user) return { orders: [] };
    const res = await axios.get(`${baseUrl}/orders/my-orders`, {
      withCredentials: true, // ✅ Use cookie-based auth
    });
    return res.data;
  };

  const { data: ordersData, isLoading: isLoadingOrders, isError: isOrdersError } = useQuery({
    queryKey: ["userOrders", user?._id],
    queryFn: fetchUserOrders,
    enabled: !!user && showOrderReviewModal, // Fetch only when user exists and modal is open
    retry: false,
  });

  // Filter orders for current vendor - show delivered/completed orders for reviews
  const userOrders = (ordersData?.orders || []).filter(order => {
    // Check multiple possible vendor ID locations
    const isFromVendor = order.vendorId === vendorId || 
      order.vendor?._id === vendorId ||
      order.vendorDeliveryFees?.[0]?.restaurantId === vendorId;
    
    // Allow reviews for delivered/completed orders (users can only review what they've received)
    // Including 'accepted' status for testing since the example shows "accepted" status
    const canReview = ['delivered', 'completed'].includes(order.orderStatus?.toLowerCase());
    
    // Temporary debug logging to verify the fix
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('Order filtering debug:', {
    //     orderId: order.orderId,
    //     orderStatus: order.orderStatus,
    //     vendorId: order.vendorId,
    //     vendorObject: order.vendor?._id,
    //     restaurantId: order.vendorDeliveryFees?.[0]?.restaurantId,
    //     currentVendorId: vendorId,
    //     isFromVendor,
    //     canReview,
    //     willShow: isFromVendor && canReview
    //   });
    // }
    
    return isFromVendor && canReview;
  });

  // Helper function for backward compatibility - calculates percentages from distribution
  const calculatePercentagesFromDistribution = (distribution) => {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    const percentages = {};
    Object.keys(distribution).forEach(rating => {
      percentages[rating] = total > 0 ? Math.round((distribution[rating] / total) * 100) : 0;
    });
    return percentages;
  };

  // Safe data extraction with backward compatibility
  const extractRatingData = (apiResponse) => {
    if (!apiResponse.success || !apiResponse.data) return null;
    
    const data = apiResponse.data;
    return {
      ...data,
      // Ensure backward compatibility for restaurant data
      restaurant: {
        averageRating: data.restaurant?.averageRating || data.restaurant?.rating || 0,
        totalReviews: data.restaurant?.totalReviews || data.restaurant?.reviewCount || 0,
        storedRating: data.restaurant?.storedRating,
        storedReviewCount: data.restaurant?.storedReviewCount
      },
      // Ensure rating percentages exist
      ratingPercentages: data.ratingPercentages || calculatePercentagesFromDistribution(data.ratingDistribution || {}),
      ratingDistribution: data.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      ratingBreakdown: data.ratingBreakdown || null
    };
  };

  // Rating filter options
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
      const extractedData = extractRatingData(response);
      if (extractedData) {
        setReviewsSummary(extractedData);
      }
    } catch (error) {
      console.error("Failed to fetch reviews summary:", error);
      // Set safe fallback data
      setReviewsSummary({
        restaurant: { averageRating: 0, totalReviews: 0 },
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        ratingPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        ratingBreakdown: null
      });
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
      } else {
        // Handle API error response
        setError(response.error || "Failed to load reviews. Please try again.");
        setReviews([]);
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
      } else {
        // Handle API error response
        setError(response.error || "Failed to load food reviews. Please try again.");
        setReviews([]);
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
      showToast("Please add a comment", "error");
      return;
    }

    try {
      setIsSubmittingReview(true);
      const reviewData = {
        vendorId,
        rating: reviewRating,
        comment: reviewComment
      };

      // Add foodId if reviewing a specific food item from an order
      if (selectedOrderItem) {
        reviewData.foodId = selectedOrderItem.item.foodId;
        reviewData.orderId = selectedOrderItem.order._id;
      } else if (selectedFood && activeTab === 'food') {
        reviewData.foodId = selectedFood._id;
      }

      await createReview(reviewData);
      showToast("Review submitted successfully!");
      setShowReviewForm(false);
      setReviewComment("");
      setReviewRating(5);
      setSelectedOrderItem(null);
      
      // Refresh reviews and summary
      fetchReviewsSummary();
      if (activeTab === 'restaurant') {
        fetchRestaurantReviews();
      } else if (selectedFood) {
        fetchFoodReviews(selectedFood._id);
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to submit review", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedFood(null);
    setReviews([]);
    setCurrentPage(1);
    setError(null);
  };

  const handleWriteReview = () => {
    setShowOrderReviewModal(true);
    // Orders will be fetched automatically by React Query when modal opens
  };

  const handleSelectOrderItem = (order, item) => {
    setSelectedOrderItem({ order, item });
    setShowOrderReviewModal(false);
    setShowReviewForm(true);
  };

  // Rating filter options
  const ratingFilters = [
    { value: 'all', label: 'All' },
    { value: '5', label: '5★' },
    { value: '4', label: '4★' },
    { value: '3', label: '3★' },
    { value: '2', label: '2★' },
    { value: '1', label: '1★' }
  ];

  // console.log(reviews);

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

  return (
    <div className="space-y-6">
      {/* Reviews Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Overall Rating */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
              {reviewsSummary?.restaurant && (
                <span className="text-sm text-gray-500">
                  ({reviewsSummary.restaurant.totalReviews || 0} review{(reviewsSummary.restaurant.totalReviews || 0) !== 1 ? 's' : ''})
                </span>
              )}
            </div>
            
            {reviewsSummary && reviewsSummary.restaurant && reviewsSummary.restaurant.totalReviews > 0 ? (
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    {reviewsSummary.restaurant.averageRating?.toFixed(1) || '0.0'}
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {renderStars(Math.round(reviewsSummary.restaurant.averageRating || 0), 20)}
                  </div>
                  <p className="text-sm text-gray-500">Overall Rating</p>
                  
                  {/* NEW: Rating calculation transparency */}
                  {reviewsSummary.ratingBreakdown?.averageCalculation && (
                    <div className="mt-2">
                      <details className="text-xs text-gray-400">
                        <summary className="cursor-pointer hover:text-gray-600">How is this calculated?</summary>
                        <p className="mt-1">{reviewsSummary.ratingBreakdown.averageCalculation}</p>
                        <p>Total points: {reviewsSummary.ratingBreakdown.totalRatingPoints}</p>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-2xl font-bold text-gray-400 mb-2">No ratings yet</div>
                <p className="text-sm text-gray-500">Be the first to leave a review!</p>
              </div>
            )}
          </div>

          {/* NEW: Enhanced Rating Distribution Chart */}
          {reviewsSummary?.ratingDistribution && reviewsSummary.restaurant?.totalReviews > 0 && (
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={20} className="text-gray-600" />
                <h3 className="font-semibold text-gray-900">Rating Distribution</h3>
              </div>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviewsSummary.ratingDistribution[rating] || 0;
                  const percentage = reviewsSummary.ratingPercentages?.[rating] || 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 w-8">{rating}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
                      <span className="text-xs text-gray-400 w-10 text-right">({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Debug info for development */}
              {process.env.NODE_ENV === 'development' && reviewsSummary.restaurant?.storedRating !== undefined && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-500">
                  <details>
                    <summary className="cursor-pointer">Debug: Rating Comparison</summary>
                    <p>Calculated: {reviewsSummary.restaurant.averageRating} ({reviewsSummary.restaurant.totalReviews} reviews)</p>
                    <p>Stored: {reviewsSummary.restaurant.storedRating} ({reviewsSummary.restaurant.storedReviewCount} reviews)</p>
                    {reviewsSummary.restaurant.averageRating !== reviewsSummary.restaurant.storedRating && (
                      <p className="text-orange-600">⚠️ Values differ - using calculated</p>
                    )}
                  </details>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rating Filters */}
        <div className="flex items-center flex-wrap gap-2 mt-6 pt-6 border-t border-gray-100">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700 mr-2">Filter by rating:</span>
          <div className="flex gap-2 flex-wrap">
            {ratingFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedRating(filter.value)}
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
          onClick={handleWriteReview}
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
              onClick={fetchRestaurantReviews}
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
                className="bg-white md:p-6 p-3 rounded-3xl border border-gray-100"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0 overflow-hidden relative">
                    {review.userId?.avatar ? (
                      <>
                        <img 
                          src={review.userId.avatar} 
                          alt={`${review.userId?.firstname || 'User'} avatar`}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            console.log('Avatar image failed to load:', review.userId.avatar);
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 hidden items-center justify-center">
                          <User size={20} />
                        </div>
                      </>
                    ) : (
                      <User size={20} />
                    )}
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
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Food info for food reviews */}
                    {review.foodId && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                        {review.foodId.images?.[0]?.url && (
                          <img
                            src={review.foodId.images[0].url}
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
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + Math.max(1, currentPage - 2);
                  if (page > totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-orange-500 text-white"
                          : "border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Review Modal - Full Screen */}
      <AnimatePresence>
        {showOrderReviewModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 bg-white rounded-3xl shadow-2xl z-50 overflow-hidden h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between md:p-6 p-3 border-b border-gray-100">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
                  <p className="text-sm text-gray-600 mt-1">Select a food item from your orders to review</p>
                </div>
                <button
                  onClick={() => setShowOrderReviewModal(false)}
                  className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto scroll md:p-6 p-3">
                {isLoadingOrders ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500 mr-3" />
                    <span className="text-gray-600">Loading your orders...</span>
                  </div>
                ) : isOrdersError ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Failed to Load Orders</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      We couldn't load your orders. Please try again.
                    </p>
                    <button
                      onClick={() => setShowOrderReviewModal(false)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-bold transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="w-10 h-10 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">No Completed Orders Found</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      You don't have any completed orders from {vendor?.storeName} yet. 
                      You can only review foods from orders that have been delivered.
                    </p>
                    <button
                      onClick={() => setShowOrderReviewModal(false)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-bold transition-colors"
                    >
                      Browse Menu
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Completed Orders</h3>
                      <p className="text-gray-600">Click on any food item from your delivered orders to write a review</p>
                    </div>

                    {userOrders.map((order) => (
                      <div key={order._id} className="bg-gray-50 rounded-2xl md:p-6 p-3">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              Order #{order.orderId}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()} • {order.orderStatus}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">₦{order.total?.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {order.items?.map((item, index) => (
                            <button
                              key={index}
                              onClick={() => handleSelectOrderItem(order, item)}
                              className="bg-white p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all text-left group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                  {/* Fix image rendering based on actual order item structure */}
                                  {(() => {
                                    // Try multiple image sources in order of priority
                                    const imageUrl = item.variant?.image || 
                                                   item.image || 
                                                   item.foodId?.images?.[0]?.url ||
                                                   item.foodId?.image;
                                    
                                    return imageUrl ? (
                                      <img
                                        src={imageUrl}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon size={16} className="text-gray-400" />
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                                    {item.name}
                                  </h5>
                                  <p className="text-sm text-gray-500">
                                    Qty: {item.quantity} • ₦{item.price?.toLocaleString()}
                                  </p>
                                  {item.variant?.name && (
                                    <p className="text-xs text-gray-400">{item.variant.name}</p>
                                  )}
                                </div>
                                <div className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ArrowRight size={16} />
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                  {selectedOrderItem 
                    ? `Review ${selectedOrderItem.item.name}`
                    : activeTab === 'food' && selectedFood 
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

export default ReviewsSectionFixed;