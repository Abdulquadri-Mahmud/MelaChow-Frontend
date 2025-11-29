"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { useApi } from "../context/ApiContext";
import axios from "axios";

export default function AddressModal({ user, token, isOpen, setIsOpen }) {
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
    Lagos: ["Ikorodu", "Aruna",],
    Ogun: ["Abeokuta", "Ijebu Remo", "Sagamu", "Saapade"],
  };

  const handleSave = async () => {
    if (!address.state || !address.city || !address.addressLine) {
      toast.error("State, city and full address are required");
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Address saved successfully!");
      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to save address. Try again."
      );
    }

    setLoading(false);
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
            className="bg-white rounded-2xl md:p-6 p-3 w-11/12 max-w-md shadow-lg relative"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-gray-500"
            >
              <X />
            </button>

            <h2 className="text-xl text-center font-semibold text-gray-800 mb-4">
              Where should we deliver? 📍
            </h2>

            <div className="space-y-3">
              {/* State Dropdown */}
              <select
                value={address.state}
                onChange={(e) => {
                  const selectedState = e.target.value;
                  setAddress({
                    ...address,
                    state: selectedState,
                    city: "", // Reset city when state changes
                  });
                }}
                className="w-full border rounded-lg p-2"
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>

              {/* City Dropdown — depends on state */}
              <select
                value={address.city}
                onChange={(e) =>
                  setAddress({ ...address, city: e.target.value })
                }
                className="w-full border rounded-lg p-2"
                disabled={!address.state}
              >
                <option value="">Select City</option>

                {address.state &&
                  citiesByState[address.state].map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
              </select>

              {/* Address Line */}
              <input
                type="text"
                placeholder="Full Address (House No, Street, Area)"
                value={address.addressLine}
                onChange={(e) =>
                  setAddress({ ...address, addressLine: e.target.value })
                }
                className="w-full border rounded-lg p-2"
              />

              <button
                disabled={loading}
                onClick={handleSave}
                className="bg-orange-500 text-white w-full py-2 rounded-lg mt-3 hover:bg-orange-600 transition"
              >
                {loading ? "Saving..." : "Save Address"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
