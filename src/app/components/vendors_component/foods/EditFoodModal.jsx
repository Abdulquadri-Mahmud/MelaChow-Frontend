"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { updateFood } from "@/app/hooks/useVendorFoodQuery";

export default function EditFoodModal({ isOpen, onClose, refreshFoods, food }) {
  const [formData, setFormData] = useState(food || {});
  const [variants, setVariants] = useState(food?.variants || []);

  useEffect(() => {
    if (food) {
      setFormData(food);
      setVariants(food.variants || []);
    }
  }, [food]);

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...formData, variants };
    try {
      await updateFood(food._id, payload);
      toast.success("Food updated successfully ✅");
      refreshFoods();
      onClose();
    } catch {
      toast.error("Failed to update food");
    }
  };

  if (!isOpen || !food) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit {food.name}</h2>
        <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium mb-1">Food Name</label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded-lg p-2 outline-[#FF6600]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-lg p-2 outline-[#FF6600]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Variants</label>
            {variants.map((variant, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={variant.name}
                  placeholder="Variant name"
                  onChange={(e) => handleVariantChange(i, "name", e.target.value)}
                  className="border rounded-lg p-2 w-1/2 outline-[#FF6600]"
                />
                <input
                  type="number"
                  value={variant.price}
                  placeholder="Price"
                  onChange={(e) => handleVariantChange(i, "price", e.target.value)}
                  className="border rounded-lg p-2 w-1/2 outline-[#FF6600]"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="border px-4 py-2 rounded-md text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#FF6600] text-white px-4 py-2 rounded-md hover:bg-orange-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
