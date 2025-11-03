import React from "react";
import {
  MapPinIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";

export default function AddressList({
  addresses,
  handleEditAddress,
  handleDeleteAddressPrompt,
  setIsModalOpen, 
}) {
  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-lg mt-3">
      <div className="flex justify-between items- mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPinIcon className="w-5 h-5 text-orange-500" /> Addresses
        </h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 cursor-pointer bg-gray-800 py-2 px-6 rounded-md text-white"
        >
          <PlusCircleIcon className="w-5 h-5" /> Add
        </button>
      </div>

      <ul className="space-y-3">
        {addresses.map((addr, index) => (
          <li
            key={addr._id}
            className="border border-gray-200 p-3 text-sm rounded-md flex justify-between items-center"
          >
            <span>{addr.addressLine}</span>
            <div className="flex gap-3">
              <PencilSquareIcon
                onClick={() => handleEditAddress(index)}
                className="w-5 h-5 text-green-500 cursor-pointer"
              />
              <TrashIcon
                onClick={() => handleDeleteAddressPrompt(addr._id)}
                className="w-5 h-5 text-red-500 cursor-pointer"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
