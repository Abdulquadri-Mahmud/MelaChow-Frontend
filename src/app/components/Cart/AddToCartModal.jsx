"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

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
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 80, damping: 18 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-lg p-5 pb-20"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800 text-lg">Add to Cart</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X size={22} />
              </button>
            </div>

            {/* Food Info */}
            <div className="relative w-full h-52 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={
                    Array.isArray(food?.images)
                      ? food.images[0]?.url
                      : food.image || "/images/placeholder-food.png"
                  }
                  alt={food.name}
                  className="object-cover"
                />
              </div>
            <div className="flex gap-4 mb-5">
              
              <div className="flex-1">
                <h4 className="text-base font-semibold text-gray-800">{food.name}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {food.description || "No description available."}
                </p>
                <p className="text-orange-600 font-semibold mt-2">
                  ₦{food?.price?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex justify-between items-center bg-orange-100 p-3 rounded-xl mb-5">
              <button onClick={() => setQuantity((prev) => Math.max(1, prev - 1))} className="w-10 h-10 flex items-center justify-center bg-white rounded-full hover:bg-gray-100 transition">
                <Minus size={18} />
              </button>
              <span className="text-lg font-semibold text-orange-700">{quantity}</span>
              <button onClick={() => setQuantity((prev) => prev + 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-full hover:bg-gray-100 transition">
                <Plus size={18} />
              </button>
            </div>

            {/* Add to Cart Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onAdd({ ...food, quantity });
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-full font-semibold shadow-md transition"
            >
              <ShoppingBag size={18} />
              Add ₦{(food.price * quantity)?.toLocaleString()}
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
