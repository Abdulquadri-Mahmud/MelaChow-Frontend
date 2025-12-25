"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Trash2, Edit3, CheckCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useApi } from "@/app/context/ApiContext";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import AddressSkeleton from "../skeleton/AddressSkeleton";

export default function AddressPage() {
  const router = useRouter();
  const { baseUrl } = useApi();
  const { user } = useUserStorage();
  const token = user?.token;

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [settingDefaultId, setSettingDefaultId] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({ state: "", city: "", addressLine: "" });

  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const states = ["Lagos", "Ogun"];
  const citiesByState = {
    Lagos: ["Ikorodu", "Aruna"],
    Ogun: ["Abeokuta", "Ijebu Remo", "Sagamu", "Saapade"],
  };

  /* ---------------- FETCH ADDRESSES ---------------- */
  const fetchAddresses = async () => {
    try {
      const res = await axios.get(`${baseUrl}/user/auth/my-address`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(res.data.addresses || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load addresses");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (token) fetchAddresses();
  }, [token]);

  /* ---------------- ADD / UPDATE ---------------- */
  const saveAddress = async () => {
    if (!form.state || !form.city || !form.addressLine) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);

    try {
      let res;

      if (!editingId) {
        res = await axios.post(
          `${baseUrl}/user/auth/address`,
          { ...form, isDefault: true },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Address added successfully");
      } else {
        res = await axios.patch(
          `${baseUrl}/user/auth/address/update-address`,
          { ...form },
          { params: { addressId: editingId }, headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Address updated successfully");
      }

      setAddresses(res.data.addresses);
      setForm({ state: "", city: "", addressLine: "" });
      setEditingId(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const confirmDelete = (id) => {
    setSelectedAddressId(id);
    setShowDeleteModal(true);
  };

  const deleteAddress = async () => {
    if (!selectedAddressId) return;
    setDeletingId(selectedAddressId);

    try {
      await axios.delete(`${baseUrl}/user/auth/address/delete-address`, {
        params: { addressId: selectedAddressId },
        headers: { Authorization: `Bearer ${token}` },
      });

      setAddresses(prev => prev.filter(addr => addr._id !== selectedAddressId));
      toast.success("Address removed successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete address");
    } finally {
      setDeletingId(null);
      setSelectedAddressId(null);
      setShowDeleteModal(false);
    }
  };

  /* ---------------- SET DEFAULT ---------------- */
  const setDefault = async (id) => {
    setSettingDefaultId(id);
    try {
      const res = await axios.patch(
        `${baseUrl}/user/auth/address/update-address`,
        { isDefault: true },
        { params: { addressId: id }, headers: { Authorization: `Bearer ${token}` } }
      );
      setAddresses(res.data.addresses);
      toast.success("Default address updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update default address");
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 bg-white border-b sticky top-0 z-40">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-semibold text-gray-900">Delivery Addresses</h1>
          <p className="text-xs text-gray-500">Manage where your orders should be delivered</p>
        </div>
      </header>

      <div className="max-w-md mx-auto md:p-6 p-2 space-y-3 pb-22">
        {fetching && <AddressSkeleton count={2} />}

        {!fetching && addresses.length === 0 && (
          <div className="bg-white border rounded-xl p-4 text-center">
            <MapPin className="mx-auto text-orange-400 mb-2" size={20} />
            <p className="text-sm font-medium text-gray-800">No address added yet</p>
            <p className="text-xs text-gray-500 mt-1">Add at least one delivery address to continue</p>
          </div>
        )}

        {/* Address List */}
        {addresses.map(addr => (
          <motion.div
            key={addr._id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border rounded-xl p-4 flex justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-orange-500" />
                <p className="text-sm text-gray-800">{addr.addressLine}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">{addr.city}, {addr.state}</p>

              {addr.isDefault && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-2">
                  <CheckCircle size={12} /> Default address
                </span>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(addr._id);
                    setForm({ state: addr.state, city: addr.city, addressLine: addr.addressLine });
                  }}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => confirmDelete(addr._id)}
                  disabled={deletingId === addr._id}
                  className={`p-2 rounded-full ${deletingId === addr._id ? "bg-red-50" : "hover:bg-red-50"} text-red-500`}
                >
                  {deletingId === addr._id ? "Deleting..." : <Trash2 size={14} />}
                </button>
              </div>

              {!addr.isDefault && (
                <button
                  onClick={() => setDefault(addr._id)}
                  disabled={settingDefaultId === addr._id}
                  className={`text-xs text-orange-500 hover:underline ${settingDefaultId === addr._id ? "opacity-50" : ""}`}
                >
                  {settingDefaultId === addr._id ? "Updating..." : "Set as default"}
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {/* Add / Edit Section */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white border rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-center text-gray-900">{editingId ? "Edit Address" : "Add New Address"}</h2>
          <p className="text-xs text-center text-gray-500 mb-4">
            {editingId
              ? "Update the address details for accurate delivery"
              : "Add a new delivery address to receive orders at this location"}
          </p>

          <div className="space-y-3">
            <select
              value={form.state}
              onChange={e => setForm({ ...form, state: e.target.value, city: "" })}
              className="w-full border rounded-lg p-2 text-sm"
            >
              <option value="">Select state</option>
              {states.map(s => <option key={s}>{s}</option>)}
            </select>

            <select
              value={form.city}
              disabled={!form.state}
              onChange={e => setForm({ ...form, city: e.target.value })}
              className="w-full border rounded-lg p-2 text-sm"
            >
              <option value="">Select city</option>
              {form.state && citiesByState[form.state].map(c => <option key={c}>{c}</option>)}
            </select>

            <input
              placeholder="House number, street, area"
              value={form.addressLine}
              onChange={e => setForm({ ...form, addressLine: e.target.value })}
              className="w-full border rounded-lg p-2 text-sm"
            />

            <button
              disabled={loading}
              onClick={saveAddress}
              className="w-full bg-orange-500 text-white py-2 rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? "Saving..." : editingId ? "Update Address" : "Save Address"}
            </button>
          </div>
        </motion.div>
      </div>

      {/* ---------------- DELETE MODAL ---------------- */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 text-center relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={16} />
            </button>
            <p className="text-sm text-gray-800 mb-4">Are you sure you want to delete this address?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={deleteAddress}
                className="bg-red-500 text-white py-1 px-4 rounded-lg hover:bg-red-600"
              >
                {deletingId ? "Deleting..." : "Yes, delete"}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-200 text-gray-800 py-1 px-4 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
