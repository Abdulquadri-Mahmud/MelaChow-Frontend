"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Trash2, Edit3, CheckCircle, X, Plus, ChevronRight } from "lucide-react";
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
        withCredentials: true, // ✅ Use cookie-based auth
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
    fetchAddresses();
  }, []);

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
          { withCredentials: true }
        );
        toast.success("Address added successfully");
      } else {
        res = await axios.patch(
          `${baseUrl}/user/auth/address/update-address`,
          { ...form },
          { params: { addressId: editingId }, withCredentials: true }
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
        withCredentials: true,
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
        { params: { addressId: id }, withCredentials: true }
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
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-5 bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Delivery Addresses</h1>
          <p className="text-xs font-medium text-gray-400">Manage your saved locations</p>
        </div>
      </header>

      <div className="max-w-xl mx-auto md:p-8 p-4 space-y-4 pb-24">
        {fetching && <AddressSkeleton count={3} />}

        <AnimatePresence mode="popLayout">
          {!fetching && addresses.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-dashed border-gray-200 rounded-3xl p-10 text-center"
            >
              <div className="mx-auto w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
                <MapPin className="text-orange-500" size={32} />
              </div>
              <h3 className="text-base font-bold text-gray-800">No addresses yet</h3>
              <p className="text-sm text-gray-400 mt-2 max-w-[200px] mx-auto">Add a delivery address to start ordering your favorite meals</p>
            </motion.div>
          )}

          {/* Address List */}
          {addresses.map((addr, index) => (
            <motion.div
              key={addr._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`group relative bg-white border transition-all duration-300 rounded-2xl p-5 flex justify-between items-start gap-4 ${addr.isDefault
                ? "border-orange-200 shadow-md shadow-orange-500/5 ring-1 ring-orange-100"
                : "border-gray-100 hover:border-orange-100 hover:shadow-lg hover:shadow-gray-200/50"
                }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`p-2 rounded-lg ${addr.isDefault ? "bg-orange-500 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500"} transition-colors`}>
                    <MapPin size={18} />
                  </div>
                  <h3 className="font-bold text-gray-800 text-[15px]">{addr.addressLine}</h3>
                </div>
                <p className="text-[13px] font-medium text-gray-400 ml-10">{addr.city}, {addr.state}</p>

                {addr.isDefault && (
                  <div className="ml-10 mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle size={12} strokeWidth={3} /> Default Delivery Location
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="flex gap-1.5 bg-gray-50/50 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      setEditingId(addr._id);
                      setForm({ state: addr.state, city: addr.city, addressLine: addr.addressLine });
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-white transition-all shadow-sm shadow-transparent hover:shadow-gray-200/50"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => confirmDelete(addr._id)}
                    disabled={deletingId === addr._id}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white transition-all shadow-sm shadow-transparent hover:shadow-gray-200/50 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {!addr.isDefault && (
                  <button
                    onClick={() => setDefault(addr._id)}
                    disabled={settingDefaultId === addr._id}
                    className={`text-[11px] font-bold text-orange-500 hover:text-orange-600 px-3 py-1.5 rounded-lg border border-orange-100 hover:bg-orange-50 transition-all ${settingDefaultId === addr._id ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {settingDefaultId === addr._id ? "Updating..." : "Set as Default"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add / Edit Section */}
        <motion.div
          layout
          className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xl shadow-gray-200/40 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Plus className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{editingId ? "Update Address" : "Add New Address"}</h2>
              <p className="text-[11px] font-medium text-gray-400">
                {editingId ? "Modify your current address details" : "Register a new location for your deliveries"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">State</label>
                <div className="relative">
                  <select
                    value={form.state}
                    onChange={e => setForm({ ...form, state: e.target.value, city: "" })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm font-medium outline-none focus:border-orange-500 focus:bg-white transition-all appearance-none cursor-pointer pr-10"
                  >
                    <option value="">Select state</option>
                    {states.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">City</label>
                <div className="relative">
                  <select
                    value={form.city}
                    disabled={!form.state}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm font-medium outline-none focus:border-orange-500 focus:bg-white transition-all appearance-none disabled:opacity-50 cursor-pointer pr-10"
                  >
                    <option value="">Select city</option>
                    {form.state && citiesByState[form.state].map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">House/Street/Area</label>
              <textarea
                placeholder="e.g. 42, Aruna Estate, Ikorodu"
                value={form.addressLine}
                onChange={e => setForm({ ...form, addressLine: e.target.value })}
                rows={2}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm font-medium outline-none focus:border-orange-500 focus:bg-white transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setForm({ state: "", city: "", addressLine: "" });
                  }}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                disabled={loading}
                onClick={saveAddress}
                className="flex-[2] bg-orange-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>{editingId ? "Update Address" : "Save Address"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ---------------- DELETE MODAL ---------------- */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-sm text-center relative z-10 shadow-2xl"
            >
              <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Address?</h3>
              <p className="text-sm font-medium text-gray-400 mb-8 px-4">This action cannot be undone. Are you sure you want to remove this location?</p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={deleteAddress}
                  className="bg-red-500 text-white py-3.5 rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  {deletingId ? "Removing..." : "Yes, Remove"}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="bg-gray-50 text-gray-500 py-3.5 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                >
                  Keep it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>

  );
}
