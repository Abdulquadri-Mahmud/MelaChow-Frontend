"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ImageIcon,
  X,
} from "lucide-react";

/***** PREVIEW MODAL *****/
export default function PreviewModal({ open, onClose, food, variants }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
          >
            <div className="flex items-start md:flex-row flex-col gap-4">
              <div className="sm:w-44 sm:h-32 h-72 w-full overflow-hidden rounded-lg shadow-md shadow-orange-200">
                <img src={food.images?.[0] || "/placeholder.jpg"} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{food.name}</h3>
                <p className="text-sm text-gray-600">{food.category} • {food.estimatedDeliveryTime} mins</p>
                <p className="mt-3 text-gray-700">{food.description}</p>

                <div className="mt-4 flex items-center gap-4">
                  <div className="text-2xl font-semibold">₦{Number(food.price || 0).toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Delivery ₦{Number(food.deliveryFee || 0).toLocaleString()}</div>
                </div>

                {variants?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Variants</h4>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {variants.map((v, i) => (
                        <div key={i} className="flex items-center justify-between bg-orange-100 rounded-md p-2">
                          <div className="flex items-center gap-3">
                            {v.image ? <img src={v.image} className="w-10 h-10 rounded-md object-cover" /> : <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center"><ImageIcon /></div>}
                            <div>
                              <div className="font-medium">{v.name}</div>
                              <div className="text-xs text-gray-500">₦{Number(v.price).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button  onClick={onClose}className="px-4 py-2 bg-[#FF6600] text-white rounded-md">Looks Great</button>
                  <button className="px-4 py-2 border rounded-md" onClick={onClose}>Close</button>
                </div>
              </div>
            </div>
            <button className="absolute top-6 right-2 px-2 py-2 bg-red-500 text-white cursor-pointer rounded-md" onClick={onClose}><X /></button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}