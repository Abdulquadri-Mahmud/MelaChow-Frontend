"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { createFood } from "@/app/hooks/useVendorFoodQuery";

export default function AddFoodModal({ isOpen, onClose, refreshFoods, vendorId }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Rice",
    price: "",
    deliveryFee: "",
    estimatedTime: "",
    tags: "",
    availability: true,
    images: [],
  });

  const [variants, setVariants] = useState([]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setFormData((prev) => ({ ...prev, images: previews }));
  };

  const handleAddVariant = () => {
    setVariants([...variants, { name: "", price: "" }]);
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleRemoveVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, variants };
    try {
      await createFood(vendorId, payload);
      toast.success("Food added successfully 🍛");
      refreshFoods();
      onClose();
    } catch (err) {
      toast.error("Failed to add food");
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Food</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium mb-1">Food Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded-lg p-2 outline-[#FF6600]"
              placeholder="e.g. Jollof Rice"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-lg p-2 outline-[#FF6600]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border rounded-lg p-2 outline-[#FF6600]"
              >
                <option>Rice</option>
                <option>Drinks</option>
                <option>Swallow</option>
                <option>Snacks</option>
                <option>Shawarma</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Price *</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full border rounded-lg p-2 outline-[#FF6600]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Delivery Fee</label>
              <input
                type="number"
                value={formData.deliveryFee}
                onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                className="w-full border rounded-lg p-2 outline-[#FF6600]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estimated Time (mins)</label>
              <input
                type="number"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                className="w-full border rounded-lg p-2 outline-[#FF6600]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full border rounded-lg p-2 outline-[#FF6600]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full border p-2 rounded-lg"
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              {formData.images.map((img, i) => (
                <img key={i} src={img} className="w-16 h-16 object-cover rounded-md border" />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Variants</label>
            {variants.map((variant, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={variant.name}
                  onChange={(e) => handleVariantChange(i, "name", e.target.value)}
                  className="border rounded-lg p-2 w-1/2 outline-[#FF6600]"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={variant.price}
                  onChange={(e) => handleVariantChange(i, "price", e.target.value)}
                  className="border rounded-lg p-2 w-1/2 outline-[#FF6600]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(i)}
                  className="text-red-600 font-semibold"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddVariant}
              className="text-[#FF6600] text-sm mt-1"
            >
              + Add Variant
            </button>
          </div>

          <div className="flex justify-between items-center mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.availability}
                onChange={(e) =>
                  setFormData({ ...formData, availability: e.target.checked })
                }
              />
              Available
            </label>

            <div className="flex gap-2">
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
                Save Food
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
