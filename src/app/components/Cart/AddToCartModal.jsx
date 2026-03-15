"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function AddToCartModal({ food, isOpen, onClose, onAdd }) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) setQuantity(1);
  }, [isOpen]);

  if (!food) return null;

  const totalPrice = (food.price * quantity).toFixed(2);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Enhanced Glassmorphism Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[8px]"
            onClick={onClose}
          />

          {/* Premium Pop Modal */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              mass: 1
            }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800"
          >
            {/* Glossy Image Section */}
            <div className="relative h-56 w-full p-3">
              <div className="relative w-full h-full rounded-[32px] overflow-hidden shadow-inner">
                <img
                  src={
                    Array.isArray(food?.images)
                      ? food.images[0]?.url
                      : food.image || "/images/placeholder-food.png"
                  }
                  alt={food.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2.5 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/40 transition-colors border border-white/20"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="px-6 pb-8 pt-2">
              <div className="space-y-1 mb-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">Add to Bag</p>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white italic uppercase tracking-tighter leading-none">{food.name}</h4>
                <p className="text-xs text-slate-400 font-medium line-clamp-2 mt-2">
                  {food.description || "A masterfully crafted selection prepared with the finest ingredients."}
                </p>
              </div>

              {/* Advanced Quantity Controls */}
              <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex-1 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-[24px] border border-slate-100 dark:border-slate-800">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-sm hover:bg-slate-50 transition-colors"
                  >
                    <Minus size={18} strokeWidth={2.5} />
                  </motion.button>

                  <div className="flex flex-col items-center">
                    <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{quantity}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Quantity</span>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="w-12 h-12 flex items-center justify-center bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-colors"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </motion.button>
                </div>
              </div>

              {/* High-Fidelity Add Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onAdd({ ...food, quantity });
                  onClose();
                }}
                className="w-full flex items-center justify-between bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-2 pl-6 rounded-[24px] shadow-2xl group transition-all"
              >
                <div className="flex flex-col items-start">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Total Cost</span>
                  <span className="text-sm font-black italic uppercase tracking-tighter">₦{(food.price * quantity)?.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-center gap-2 bg-orange-600 dark:bg-orange-500 py-3 px-6 rounded-2xl text-white shadow-lg group-hover:bg-orange-700 transition-colors">
                  <ShoppingBag size={18} strokeWidth={2.5} />
                  <span className="text-[11px] font-black uppercase tracking-widest">Confirm</span>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
