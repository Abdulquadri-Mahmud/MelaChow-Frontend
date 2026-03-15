"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  Star,
  ChevronLeft,
  Heart,
  Info,
  Truck,
  Flame,
  AlertTriangle,
  Leaf,
  Plus,
  Minus,
  Check
} from "lucide-react";
import { useState, useEffect } from "react";

export default function PreviewModal({ open, onClose, food, variants = [], portions = [], choiceGroups = [] }) {
  const [selectedPortion, setSelectedPortion] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selections, setSelections] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedPortion(0);
      setSelectedVariant(0);
      setSelections({});
      setQuantity(1);
      setIsFavorite(false);
    }
  }, [open]);

  if (!open) return null;

  // Toggle Choice
  const toggleChoice = (groupIndex, group, option) => {
    setSelections((prev) => {
      const current = prev[groupIndex];
      const isMulti = group.maxSelect > 1;

      if (!isMulti) {
        // Radio behavior (Allow deselect in preview for flexibility)
        if (current?.name === option.name) {
          const newSel = { ...prev };
          delete newSel[groupIndex];
          return newSel;
        }
        return { ...prev, [groupIndex]: option };
      }

      // Checkbox behavior
      const list = Array.isArray(current) ? current : [];
      const exists = list.find((i) => i.name === option.name);

      if (exists) {
        return { ...prev, [groupIndex]: list.filter((i) => i.name !== option.name) };
      }
      if (list.length < group.maxSelect) {
        return { ...prev, [groupIndex]: [...list, option] };
      }
      return prev;
    });
  };

  // Calculate Total Price
  const basePrice = portions.length > 0
    ? (Number(portions[selectedPortion]?.price) || 0)
    : (Number(food.price) || 0);

  const variantPrice = (variants.length > 0 && variants[selectedVariant])
    ? (Number(variants[selectedVariant].price) || 0)
    : 0;

  const addonsPrice = Object.values(selections).reduce((acc, curr) => {
    if (Array.isArray(curr)) {
      return acc + curr.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    }
    return acc + (Number(curr.price) || 0);
  }, 0);

  const totalPrice = (basePrice + variantPrice + addonsPrice) * quantity;

  // Render Helpers
  const renderSpicyLevel = (level) => {
    if (!level) return null;
    const config = {
      mild: { color: "text-emerald-500", label: "Mild", icon: "🌱" },
      medium: { color: "text-yellow-500", label: "Medium", icon: "🌶️" },
      hot: { color: "text-orange-500", label: "Hot", icon: "🔥" },
      "extra-hot": { color: "text-red-500", label: "Extra Hot", icon: "💥" },
    };
    const c = config[level] || config.medium;
    return (
      <div className={`flex items-center gap-1 text-xs font-bold ${c.color} bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700 shadow-sm`}>
        <span>{c.icon}</span>
        <span>{c.label} Spiciness</span>
      </div>
    );
  };

  const renderDietaryInfo = (info) => {
    if (!info) return null;
    const config = {
      vegetarian: { label: "Vegetarian", icon: "🥗" },
      vegan: { label: "Vegan", icon: "🌱" },
      "contains-meat": { label: "Contains Meat", icon: "🍖" },
      halal: { label: "Halal", icon: "☪️" },
      keto: { label: "Keto", icon: "🥑" },
      "low-carb": { label: "Low Carb", icon: "🥦" },
    };
    // Normalize string just in case
    const c = config[info] || { label: info, icon: "Leaf" };
    return (
      <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md border border-green-100 dark:border-green-800">
        <span>{c.icon === "Leaf" ? <Leaf size={12} /> : c.icon}</span>
        <span>{c.label}</span>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md h-[90vh] bg-[#F8FAFC] dark:bg-[#0B1121] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border-8 border-white dark:border-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 pb-8 transition-all duration-300"
          >
            {/* Dynamic Notch/Header area for realism */}
            <div className="absolute top-0 left-0 right-0 h-7 z-20 flex justify-center pointer-events-none">
              <div className="w-32 h-6 bg-black rounded-b-2xl" />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32 relative bg-white dark:bg-[#0B1121]">

              {/* Header Image */}
              <div className="relative h-80 w-full">
                {food.images?.[0]?.url ? (
                  <img src={food.images[0].url} alt={food.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Navigation Overlay */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pt-4">
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${isFavorite ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" : "bg-white/20 text-white hover:bg-white/30"}`}
                  >
                    <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <h2 className="text-2xl font-bold leading-tight shadow-black drop-shadow-md">{food.name}</h2>
                  <div className="flex items-center gap-3 mt-2 text-white/90 text-sm font-medium">
                    <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg">
                      <Clock size={14} />
                      {food.estimatedDeliveryTime} min
                    </span>
                    <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg">
                      <Truck size={14} />
                      ₦{Number(food.deliveryFee).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="px-5 py-6 space-y-8 bg-white dark:bg-[#0B1121] rounded-t-3xl -mt-4 relative z-10">

                {/* Quick Stats / Metadata */}
                {/* Quick Stats / Metadata & Warnings */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {renderSpicyLevel(food.metadata?.spicyLevel)}
                    {renderDietaryInfo(food.metadata?.dietaryInfo)}
                    {food.metadata?.allergens?.length > 0 && (
                      food.metadata.allergens.map((alg, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-md border border-rose-100 dark:border-rose-800">
                          <AlertTriangle size={12} />
                          {typeof alg === 'string' ? alg : alg.label}
                        </div>
                      ))
                    )}
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md border border-amber-100 dark:border-amber-800">
                      <Star size={12} fill="currentColor" />
                      4.8 (120+)
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed">
                    {food.description || "No description provided."}
                  </p>
                </div>

                {/* Portions */}
                {portions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select Portion</h3>
                    <div className="space-y-2">
                      {portions.map((portion, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedPortion(prev => prev === idx ? null : idx)}
                          className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedPortion === idx
                            ? "border-[#FF6600] bg-orange-50 dark:bg-orange-900/10"
                            : "border-slate-100 dark:border-slate-800 hover:border-orange-200"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPortion === idx ? "border-[#FF6600]" : "border-gray-300"}`}>
                              {selectedPortion === idx && <div className="w-2.5 h-2.5 rounded-full bg-[#FF6600]" />}
                            </div>
                            <span className={`text-sm font-medium ${selectedPortion === idx ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>
                              {portion.label}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-[#FF6600]">
                            ₦{Number(portion.price).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Choice Groups */}
                {choiceGroups.map((group, gIdx) => {
                  const hasImages = group.options.some(o => o.image);
                  return (
                    <div key={gIdx} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{group.name}</h3>
                          {group.minSelect > 0 && <span className="text-xs font-bold text-rose-500">*</span>}
                        </div>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-md font-medium">
                          {group.minSelect > 0 ? `Required (${group.minSelect}-${group.maxSelect})` : `Optional (Max ${group.maxSelect})`}
                        </span>
                      </div>

                      <div className={hasImages ? "grid grid-cols-2 gap-3" : "space-y-2"}>
                        {group.options.map((option, oIdx) => {
                          const isSelected = group.maxSelect > 1
                            ? (selections[gIdx] || []).some(i => i.name === option.name)
                            : (selections[gIdx]?.name === option.name);

                          return (
                            <div
                              key={oIdx}
                              onClick={() => toggleChoice(gIdx, group, option)}
                              className={`relative rounded-xl border transition-all cursor-pointer ${hasImages
                                  ? "flex flex-col p-0 overflow-hidden"
                                  : "flex items-center justify-between p-3"
                                } ${isSelected
                                  ? "border-[#FF6600] bg-orange-50 dark:bg-orange-900/10"
                                  : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-orange-200"
                                }`}
                            >
                              {hasImages && (
                                <div className="w-full h-24 bg-gray-100 relative">
                                  {option.image ? (
                                    <img src={option.image} alt={option.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No Image</div>
                                  )}
                                  {isSelected && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#FF6600] text-white flex items-center justify-center shadow-md">
                                      <Check size={12} strokeWidth={3} />
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className={hasImages ? "p-3" : "flex items-center gap-3"}>
                                {!hasImages && (
                                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-[#FF6600] border-[#FF6600] text-white" : "border-gray-300 dark:border-gray-600"
                                    }`}>
                                    {isSelected && <Check size={12} strokeWidth={4} />}
                                  </div>
                                )}

                                <div className={hasImages ? "" : ""}>
                                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium block leading-tight">{option.name}</span>
                                  {Number(option.price) > 0 && (
                                    <span className="text-xs text-gray-500 font-medium mt-0.5 block">
                                      +₦{Number(option.price).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {!hasImages && Number(option.price) > 0 && (
                                <span className="text-sm text-gray-500 font-medium">
                                  +₦{Number(option.price).toLocaleString()}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Variants Selection */}
                {variants.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select Variant</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {variants.map((variant, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedVariant(prev => prev === idx ? null : idx)}
                          className={`relative overflow-hidden rounded-xl border-2 cursor-pointer transition-all flex flex-col ${selectedVariant === idx
                            ? "border-[#FF6600] bg-orange-50 dark:bg-orange-900/10"
                            : "border-slate-100 dark:border-slate-800 hover:border-orange-200"
                            }`}
                        >
                          {(variant.image || variant.images?.[0]?.url) && (
                            <div className="w-full h-24 overflow-hidden bg-gray-100 dark:bg-gray-800">
                              <img
                                src={variant.image || variant.images[0].url}
                                alt={variant.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-sm font-bold ${selectedVariant === idx ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>
                                {variant.name}
                              </span>
                              {selectedVariant === idx && (
                                <div className="w-4 h-4 rounded-full bg-[#FF6600] flex items-center justify-center">
                                  <Check size={10} className="text-white" strokeWidth={4} />
                                </div>
                              )}
                            </div>
                            <div className="text-xs font-bold text-[#FF6600]">
                              +₦{Number(variant.price).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {food.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {food.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Bottom Action */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/85 dark:bg-[#0B1121]/90 backdrop-blur-xl border-t-0 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-20">
              <div className="flex items-center gap-5 mb-5">
                <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 rounded-xl shadow-sm text-gray-600 dark:text-white hover:scale-105 transition-transform"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="font-bold text-gray-900 dark:text-white w-6 text-center text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 rounded-xl shadow-sm text-gray-600 dark:text-white hover:scale-105 transition-transform"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="flex-1 text-right">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Total</div>
                  <div className="text-2xl font-extrabold text-[#FF6600]">₦{totalPrice.toLocaleString()}</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-4 bg-[#FF6600] text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30 hover:bg-[#ff7b24] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Add to Order
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
