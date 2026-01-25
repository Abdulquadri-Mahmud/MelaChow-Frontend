"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Building2, Home, Navigation, ChevronDown, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useApi } from "../context/ApiContext";
import axios from "axios";

export default function AddressModal({ user, isOpen, setIsOpen }) {
  const [loading, setLoading] = useState(false);
  const { baseUrl } = useApi();

  const [address, setAddress] = useState({
    city: "",
    state: "",
    addressLine: "",
  });

  const states = ["Lagos", "Ogun"];

  // State -> Cities mapping
  const citiesByState = {
    Lagos: ["Ikorodu", "Aruna"],
    Ogun: ["Abeokuta", "Ijebu Remo", "Sagamu", "Saapade"],
  };

  const handleSave = async () => {
    if (!address.state || !address.city || !address.addressLine) {
      toast.error("Please fill in all address details");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${baseUrl}/user/auth/address`,
        {
          addressLine: address.addressLine,
          city: address.city,
          state: address.state,
          isDefault: true,
        },
        {
          withCredentials: true, // ✅ Use cookie-based auth
        }
      );

      toast.success("Delivery address saved!");
      setIsOpen(false);
      // Use a slight delay before reload to let toast be seen
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to save address. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-6 sm:p-0">
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />

          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header with Background Pattern */}
            <div className="relative bg-orange-500 px-6 py-8 text-white overflow-hidden">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-orange-400/20 blur-3xl" />
              <div className="absolute bottom-0 left-0 -ml-10 -mb-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-4 rounded-2xl bg-white/20 p-3 backdrop-blur-md">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Add Delivery Address
                </h2>
                <p className="mt-2 text-orange-50/90 text-sm sm:text-base max-w-xs">
                  Tell us where to bring your delicious meals!
                </p>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* State Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 ml-1">State</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                      <Navigation className="h-4 w-4" />
                    </div>
                    <select
                      value={address.state}
                      onChange={(e) => {
                        const selectedState = e.target.value;
                        setAddress({
                          ...address,
                          state: selectedState,
                          city: "",
                        });
                      }}
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-10 text-sm outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 cursor-pointer"
                    >
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* City Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 ml-1">City</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <select
                      value={address.city}
                      onChange={(e) =>
                        setAddress({ ...address, city: e.target.value })
                      }
                      disabled={!address.state}
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-10 text-sm outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <option value="">Select City</option>
                      {address.state &&
                        citiesByState[address.state].map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Line */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 ml-1">Full Delivery Address</label>
                <div className="relative group">
                  <div className="absolute left-3 top-4 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                    <Home className="h-4 w-4" />
                  </div>
                  <textarea
                    placeholder="House No, Street name, Landmark..."
                    value={address.addressLine}
                    onChange={(e) =>
                      setAddress({ ...address, addressLine: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  onClick={handleSave}
                  className="group relative flex-[2] overflow-hidden rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600 hover:shadow-orange-500/40 disabled:opacity-70"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Saving Address...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Confirm Address</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Footer Tip */}
            <div className="bg-gray-50 px-8 py-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                Ensuring accurate delivery every time
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

