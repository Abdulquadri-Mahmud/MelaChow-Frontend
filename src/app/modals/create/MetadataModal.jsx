"use client";

import { useEffect,useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MetadataModal({ metadata, setMetadata }) {
  const [open, setOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("foodMetadata");
    if (stored) setMetadata(JSON.parse(stored));
  }, []);

  // Save to localStorage whenever metadata changes
  useEffect(() => {
    localStorage.setItem("foodMetadata", JSON.stringify(metadata));
  }, [metadata]);

  const handleChange = (field, value) => {
    setMetadata((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="border border-gray-200 p-3 rounded-2xl shadow shadow-gray-100">
      {/* Button to open modal */}
      <div className="flex justify-between items-center">
        <h3 className="bg-orange-100 px-3 py-2 rounded-tl-2xl rounded-br-2xl font-semibold">Current Metadata Preview:</h3>
        <button className="px-4 py-2 bg-orange-500 rounded-tl-2xl rounded-br-2xl text-white rounded-md" onClick={() => setOpen(true)}>
            Set Metadata
        </button>
      </div>

      {/* Preview section */}
      <div className="mt-2 border border-gray-100 rounded-2xl p-2 bg-orange-10 text-sm flex justify-between">
        <p><strong className="text-orange-500 font-semibold">Portion Size:</strong> {metadata.portionSize}</p>
        <p><strong className="text-orange-500 font-semibold">Spice Level:</strong> {metadata.spiceLevel}</p>
        <p><strong className="text-orange-500 font-semibold">Chef Special:</strong> {metadata.chefSpecial ? "Yes" : "No"}</p>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white p-6 rounded-xl w-96 shadow-lg"
            >
              <h2 className="text-lg font-bold mb-4">Food Metadata</h2>

              <div className="grid gap-3">
                <div>
                  <label className="block text-sm font-medium">Portion Size</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2 rounded mt-1"
                    value={metadata.portionSize}
                    onChange={(e) => handleChange("portionSize", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Spice Level</label>
                  <select
                    className="w-full border border-gray-300 p-2 rounded mt-1"
                    value={metadata.spiceLevel}
                    onChange={(e) => handleChange("spiceLevel", e.target.value)}
                  >
                    <option value="Mild">Mild</option>
                    <option value="Medium">Medium</option>
                    <option value="Hot">Hot</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={metadata.chefSpecial}
                    onChange={(e) => handleChange("chefSpecial", e.target.checked)}
                  />
                  <label>Chef Special</label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-300 rounded"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
