import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

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
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[9999]">
      <div className="bg-white p-6 rounded-lg w-96 relative">
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          {currentAddress ? "Edit Address" : "Add New Address"}
        </h3>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Address Line"
            value={address.addressLine}
            onChange={(e) =>
              setAddress({ ...address, addressLine: e.target.value })
            }
            className="border border-gray-200 p-2 w-full rounded-md"
          />
          <input
            type="text"
            placeholder="City"
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            className="border border-gray-200 p-2 w-full rounded-md"
          />
          <input
            type="text"
            placeholder="State"
            value={address.state}
            onChange={(e) => setAddress({ ...address, state: e.target.value })}
            className="border border-gray-200 p-2 w-full rounded-md"
          />
          <input
            type="text"
            placeholder="Postal Code"
            value={address.postalCode}
            onChange={(e) =>
              setAddress({ ...address, postalCode: e.target.value })
            }
            className="border border-gray-200 p-2 w-full rounded-md"
          />
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={() => setIsModalOpen(false)}
            className="py-2 px-4 rounded-md text-gray-600 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSaveAddress(address)}
            className="py-2 px-4 rounded-md bg-orange-500 text-white hover:bg-orange-600 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
