"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";

export default function AddressModal({ isOpen, onClose, onSave, loading }) {
  const [address, setAddress] = useState({
    label: "Home",
    addressLine: "",
    city: "",
    state: "",
  });

  const handleSave = async () => {
    if (!address.addressLine || !address.city || !address.state) {
      toast.error("Please fill all address fields");
      return;
    }

    try {
      await onSave(address);
      toast.success("Address updated successfully!");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update address. Try again.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex justify-center items-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 w-11/12 max-w-md shadow-lg relative"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-500"
            >
              <X />
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Update Your Address
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full Address (e.g. 22 Lekki Phase 1 Rd)"
                value={address.addressLine}
                onChange={(e) =>
                  setAddress({ ...address, addressLine: e.target.value })
                }
                className="w-full border rounded-lg p-2"
              />
              <input
                type="text"
                placeholder="City"
                value={address.city}
                onChange={(e) =>
                  setAddress({ ...address, city: e.target.value })
                }
                className="w-full border rounded-lg p-2"
              />
              <input
                type="text"
                placeholder="State"
                value={address.state}
                onChange={(e) =>
                  setAddress({ ...address, state: e.target.value })
                }
                className="w-full border rounded-lg p-2"
              />
              <button
                disabled={loading}
                onClick={handleSave}
                className="bg-orange-500 text-white w-full py-2 rounded-lg mt-3 hover:bg-orange-600 transition"
              >
                {loading ? "Updating..." : "Save Address"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
