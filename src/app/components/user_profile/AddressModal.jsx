import React, { useState, useEffect } from "react";
import { XMarkIcon, MapPinIcon, HomeIcon, BuildingOffice2Icon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

export default function AddressModal({
  isModalOpen,
  setIsModalOpen,
  currentAddress,
  handleSaveAddress,
}) {
  const [address, setAddress] = useState({
    addressLine: "",
    city: "",
    state: "",
    postalCode: "",
  });

  useEffect(() => {
    if (currentAddress) setAddress(currentAddress);
  }, [currentAddress]);

  if (!isModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsModalOpen(false)}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="bg-orange-500 p-6 text-white text-center">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <div className="mx-auto bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-3">
              <MapPinIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">
              {currentAddress ? "Edit Address" : "Add New Address"}
            </h3>
            <p className="text-orange-100 text-sm mt-1">
              Enter your precise location for faster delivery
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Address Line</label>
                <div className="relative">
                  <HomeIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="House No, Street, Area"
                    value={address.addressLine}
                    onChange={(e) =>
                      setAddress({ ...address, addressLine: e.target.value })
                    }
                    className="w-full bg-gray-50 border-gray-100 border focus:border-orange-500 focus:bg-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all focus:ring-4 focus:ring-orange-500/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">City</label>
                  <div className="relative">
                    <BuildingOffice2Icon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="City"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full bg-gray-50 border-gray-100 border focus:border-orange-500 focus:bg-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all focus:ring-4 focus:ring-orange-500/10"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">State</label>
                  <input
                    type="text"
                    placeholder="State"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full bg-gray-50 border-gray-100 border focus:border-orange-500 focus:bg-white rounded-xl py-3 px-4 text-sm outline-none transition-all focus:ring-4 focus:ring-orange-500/10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Postal Code</label>
                <input
                  type="text"
                  placeholder="Postal Code"
                  value={address.postalCode}
                  onChange={(e) =>
                    setAddress({ ...address, postalCode: e.target.value })
                  }
                  className="w-full bg-gray-50 border-gray-100 border focus:border-orange-500 focus:bg-white rounded-xl py-3 px-4 text-sm outline-none transition-all focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl text-gray-500 font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveAddress(address)}
                className="flex-[2] py-3 px-4 rounded-xl bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="w-5 h-5" />
                {currentAddress ? "Update Address" : "Save Address"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

