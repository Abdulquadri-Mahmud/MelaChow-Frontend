"use client";

import { useVendorFood } from "@/app/hooks/useVendorFoodQuery";
import { useState, useMemo, useEffect } from "react";
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
  Layers,
  List,
  Flame,
  Leaf,
  Tag,
  ChevronRight,
  ChevronLeft,
  Package,
  Filter,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Eye
} from "lucide-react";
import { useRouter } from "next/navigation";
import FoodDetailsModal from "@/app/modals/FoodDetailsModal";
import FoodListSkeleton from "@/app/skeleton/FoodListSkeleton";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import DeleteConfirmModal from "@/app/modals/DeleteConfirmModal";
import BackButton from "@/app/components/BackButton";

export default function Page() {
  const { vendorDetails } = useVendorStorage();
  const vendor = vendorDetails?.vendor?.id;

  const { foods, isLoading, deleteFood } = useVendorFood(vendor);
  const router = useRouter();

  const [deleting, setDeleting] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedFoodId, setSelectedFoodId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalData, setDeleteModalData] = useState({ open: false, food: null });

  const itemsPerPage = 8;

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
            color: "#FF6600",
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

  // Compute Stats
  const stats = useMemo(() => {
    if (!foods?.data) return { total: 0, active: 0, hidden: 0 };
    const total = foods.data.length;
    const active = foods.data.filter((f) => f.available).length;
    const hidden = total - active;
    return { total, active, hidden };
  }, [foods]);

  // Extract unique categories
  const categories = useMemo(() => {
    if (!foods?.data) return [];
    const cats = [...new Set(foods.data.map(f => f.category).filter(Boolean))];
    return cats.sort();
  }, [foods]);

  // Filter Logic
  const filteredFoods = useMemo(() => {
    if (!foods?.data) return [];
    let result = foods.data;

    // 1. Status Filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") result = result.filter(f => f.available);
      if (statusFilter === "hidden") result = result.filter(f => !f.available);
    }

    // 2. Category Filter
    if (categoryFilter !== "all") {
      result = result.filter(f => f.category === categoryFilter);
    }

    // 3. Search Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((food) => {
        if (food.name?.toLowerCase().includes(term)) return true;
        if (food.description?.toLowerCase().includes(term)) return true;
        if (food.category?.toLowerCase().includes(term)) return true;
        if (food.variants?.some(v => v.name?.toLowerCase().includes(term))) return true;
        return false;
      });
    }

    return result;
  }, [foods, searchTerm, statusFilter, categoryFilter]);

  // Pagination Logic
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFoods = filteredFoods.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFoods.length / itemsPerPage);

  // Delete Handler
  const handleDeleteFood = async () => {
    if (!deleteModalData.food) return;
    setDeleting(deleteModalData.food._id);
    setDeleteModalData({ open: false, food: null });
    try {
      await deleteFood({ id: deleteModalData.food._id, options: { deleteAll: true } });
    } finally {
      setDeleting(null);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const tabs = [
    { id: "all", label: "All Items", icon: Package },
    { id: "active", label: "Active", icon: CheckCircle2 },
    { id: "hidden", label: "Hidden", icon: AlertCircle },
  ];

  if (isLoading) return <FoodListSkeleton />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50 dark:bg-[#0F172A] pb-20">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <BackButton label="Back" className="mb-2" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Menu</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage, update and track your food items</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search foods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#FF6B00] outline-none transition-all shadow-sm text-slate-900 dark:text-white"
              />
            </div>
            <button
              onClick={() => router.push("create-food")}
              className="flex items-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus size={20} /> New Item
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Package size={80} className="text-blue-500" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Total Items</p>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg"><Package size={18} className="text-blue-600 dark:text-blue-400" /></div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </motion.div>

          {/* Active */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <CheckCircle2 size={80} className="text-emerald-500" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Active Menu</p>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg"><CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" /></div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.active}</p>
          </motion.div>

          {/* Hidden */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <AlertCircle size={80} className="text-rose-500" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Hidden / Draft</p>
              <div className="p-2 bg-rose-50 dark:bg-rose-900/10 rounded-lg"><AlertCircle size={18} className="text-rose-600 dark:text-rose-400" /></div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.hidden}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Header with Results Count and Clear Button */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-[#FF6B00]" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Filters</span>
            {(statusFilter !== "all" || categoryFilter !== "all" || searchTerm) && (
              <span className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full font-bold">
                {filteredFoods.length} {filteredFoods.length === 1 ? 'result' : 'results'}
              </span>
            )}
          </div>
          {(statusFilter !== "all" || categoryFilter !== "all") && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
              className="text-xs text-slate-500 hover:text-[#FF6B00] font-bold flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={14} /> Clear All Filters
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Package size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const count = tab.id === 'all' ? stats.total : (tab.id === 'active' ? stats.active : stats.hidden);
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${isActive
                    ? 'bg-[#FF6B00] text-white shadow-lg shadow-orange-500/20 scale-105'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                  <tab.icon size={16} /> {tab.label}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                categoryFilter === "all"
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              All Categories
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                categoryFilter === "all" ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"
              }`}>
                {foods?.data?.length || 0}
              </span>
            </button>
            {categories.map((cat) => {
              const count = foods?.data?.filter(f => f.category === cat).length || 0;
              const isActive = categoryFilter === cat;
              
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Visual Guide Card */}
      {!searchTerm && statusFilter === "all" && categoryFilter === "all" && currentFoods.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Utensils size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">Quick Guide</h3>
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                <strong>Click the 👁️ icon</strong> on any food card to view full details • Use <strong>Edit</strong> to modify items • <strong>Delete</strong> to remove from menu
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cards Grid */}
      <AnimatePresence mode="wait">
        {currentFoods.length > 0 ? (
          <motion.div
            key="foods-grid"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {currentFoods.map((food, index) => (
                <motion.div
                  key={food._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 transition-all overflow-hidden flex flex-col"
                >
                  {/* Image Area */}
                  <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={food.images?.[0]?.url || "/placeholder.jpg"}
                      alt={food.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                    {/* Status */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/20 shadow-md ${food.available ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
                        {food.available ? 'Active' : 'Hidden'}
                      </span>
                    </div>

                    {/* View Details Button - Enhanced */}
                    <button
                      onClick={() => router.push(`/vendors/food-details/${food._id}`)}
                      className="absolute top-3 left-3 group/btn"
                      title="View Full Details"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white transition-all shadow-lg opacity-0 group-hover:opacity-100 group-hover/btn:scale-110">
                          <Eye size={18} />
                        </div>
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-black/70 px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity">
                          View Details
                        </span>
                      </div>
                    </button>

                    {/* Chips */}
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-1 pr-2">
                      <span className="px-2 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-white text-[10px] uppercase font-bold tracking-wide flex items-center gap-1">
                        <Tag size={10} /> {food.category}
                      </span>
                      {food.metadata?.spicyLevel && food.metadata.spicyLevel !== "mild" && (
                        <span className="px-2 py-1 bg-orange-500/80 backdrop-blur-md border border-white/20 rounded-lg text-white text-[10px] font-bold">
                          {food.metadata.spicyLevel === "extra-hot" ? "🔥 HOT" : "🌶️ SPICY"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight line-clamp-1 group-hover:text-[#FF6B00] transition-colors">
                          {highlight(food.name, searchTerm)}
                        </h3>
                        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg text-amber-600 dark:text-amber-400 text-xs font-bold whitespace-nowrap">
                          <Star size={12} fill="currentColor" /> {food.rating}
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 font-medium line-clamp-2 min-h-[40px]">
                        {food.description || "No description provided."}
                      </p>
                    </div>

                    {/* Structure Info */}
                    <div className="flex items-center justify-between py-3 border-t border-slate-50 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        {(food.portions?.length > 0 || food.variants?.length > 0) && (
                          <div className="flex items-center gap-1 text-xs font-medium text-slate-500" title="Has Sizes/Options">
                            <Layers size={14} className="text-[#FF6B00]" />
                            <span>{food.portions?.length || food.variants?.length} Options</span>
                          </div>
                        )}
                        {food.choiceGroups?.length > 0 && (
                          <div className="flex items-center gap-1 text-xs font-medium text-slate-500" title="Has Add-ons">
                            <List size={14} className="text-blue-500" />
                            <span>{food.choiceGroups.length} Add-ons</span>
                          </div>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        ₦{(food.price || food.portions?.[0]?.price || food.variants?.[0]?.price || 0).toLocaleString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <button
                        onClick={() => router.push(`update-food/${food._id}`)}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/10 text-[#FF6B00] dark:text-orange-400 font-bold text-sm hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-all"
                      >
                        <Edit3 size={16} /> Edit
                      </button>
                      <button
                        disabled={deleting === food._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModalData({ open: true, food });
                        }}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold text-sm transition-all"
                      >
                        {deleting === food._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        {deleting === food._id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6"
              >
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-0">
                  Showing <span className="font-bold text-slate-900 dark:text-white">{indexOfFirstItem + 1}</span> to <span className="font-bold text-slate-900 dark:text-white">{Math.min(indexOfLastItem, filteredFoods.length)}</span> of <span className="font-bold text-slate-900 dark:text-white">{filteredFoods.length}</span> items
                </p>
                <div className="flex items-center gap-2">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400 transition-colors">
                    <ChevronLeft size={18} />
                  </motion.button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (totalPages > 7 && (page < currentPage - 1 || page > currentPage + 1) && page !== 1 && page !== totalPages) {
                        if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className="text-slate-400 px-1">...</span>;
                        return null;
                      }
                      return (
                        <motion.button key={page} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handlePageChange(page)} className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${currentPage === page ? "bg-[#FF6B00] text-white shadow-lg shadow-orange-500/20" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                          {page}
                        </motion.button>
                      );
                    })}
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400 transition-colors">
                    <ChevronRight size={18} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
              <Utensils size={48} className="text-slate-400" />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">No food items found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {statusFilter !== 'all' ? `No ${statusFilter} items found.` : "Start by creating your first delicious mastery."}
            </p>
            {statusFilter === 'all' && (
              <button onClick={() => router.push("create-food")} className="mt-6 flex items-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all">
                <Plus size={20} /> Create New Food
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {selectedFood && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedFood(null)} />
            <motion.div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-xl z-50 max-h-[80vh] overflow-y-auto" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 15, stiffness: 200 }}>
              <div className="flex justify-between items-center p-5 border-b border-gray-100" style={{ background: "#FFF8F4" }}>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Utensils size={18} color="#FF6B00" /> {selectedFood.name} — <span style={{ color: "#FF6B00" }}>Variants</span></h2>
                <button onClick={() => setSelectedFood(null)} className="p-2 rounded-full hover:bg-gray-100 transition"><X className="text-gray-600" /></button>
              </div>
              <div className="p-6">
                {selectedFood.variants?.length > 0 ? (
                  <div className="grid gap-3">
                    {selectedFood.variants.map((variant, i) => (
                      <motion.div key={i} whileHover={{ scale: 1.02 }} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          {variant.image && <img src={variant.image} alt={variant.name} className="w-12 h-12 rounded-md object-cover" />}
                          <div><p className="font-semibold text-gray-700">{variant.name}</p><p className="text-sm text-gray-500">₦{(variant.price || 0).toLocaleString()}</p></div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-10 text-gray-600">
                    <Utensils size={48} color="#FF6B00" className="mb-3" />
                    <p className="font-medium mb-2">No variants added for this food yet.</p>
                    <button onClick={() => router.push(`update-food/${selectedFood._id}`)} className="flex items-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow transition-all"><Plus size={16} /> Add Variant</button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <FoodDetailsModal foodId={selectedFoodId} open={isModalOpen} setOpen={setIsModalOpen} />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModalData.open}
        onClose={() => setDeleteModalData({ open: false, food: null })}
        onConfirm={handleDeleteFood}
        title="Delete Food Item"
        message="This will permanently remove this food item from your menu. All associated data will be deleted."
        itemName={deleteModalData.food?.name}
        isDeleting={deleting === deleteModalData.food?._id}
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
