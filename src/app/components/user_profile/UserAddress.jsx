"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MapPin, Trash2, Edit3, CheckCircle, X, Plus,
  ChevronRight, Home, Building2, Loader2, Sparkles
} from "lucide-react";
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
        withCredentials: true,
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
        toast.success("New location added successfully! 🏡");
      } else {
        res = await axios.patch(
          `${baseUrl}/user/auth/address/update-address`,
          { ...form },
          { params: { addressId: editingId }, withCredentials: true }
        );
        toast.success("Address location updated ✨");
      }

      setAddresses(res.data.addresses);
      setForm({ state: "", city: "", addressLine: "" });
      setEditingId(null);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-4">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="p-3 rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={18} />
        </motion.button>
        <div>
          <h1 className="text-lg font-black text-gray-900 tracking-tight">Delivery Locations</h1>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Manage your addresses</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
        {fetching && <AddressSkeleton count={3} />}

        <AnimatePresence mode="popLayout">
          {!fetching && addresses.length === 0 && (
            <motion.div
              key="no-data"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-dashed border-gray-200 rounded-[32px] p-12 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 bg-orange-200/50 rounded-full animate-ping opacity-20"></div>
                <MapPin className="text-orange-500" size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No addresses found</h3>
              <p className="text-gray-400 text-sm max-w-[250px]">Add your home or office address to get started with seamless deliveries.</p>
            </motion.div>
          )}

          {/* ADD / EDIT FORM - Moved to Top for better UX on mobile */}
          <motion.div
            key="address-form"
            layout
            className="bg-white border border-gray-100 rounded-[32px] p-6 md:p-8 shadow-xl shadow-gray-200/40 relative overflow-hidden group"
          >
            {/* Decor */}
            <div className="absolute top-0 right-0 p-20 bg-gradient-to-br from-orange-50 to-transparent rounded-bl-[100px] -z-0 opacity-50"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
                  {editingId ? <Edit3 size={20} /> : <Plus size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{editingId ? "Update Location" : "Add New Address"}</h2>
                  <p className="text-xs font-medium text-gray-400">
                    {editingId ? "Modify your delivery details" : "Where should we deliver your food?"}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">State</label>
                    <div className="relative">
                      <select
                        value={form.state}
                        onChange={e => setForm({ ...form, state: e.target.value, city: "" })}
                        className="w-full bg-gray-50 hover:bg-white border border-transparent focus:border-orange-500 rounded-2xl p-4 text-sm font-bold text-gray-800 outline-none transition-all appearance-none cursor-pointer pr-10 focus:ring-4 focus:ring-orange-500/10"
                      >
                        <option value="">Select State</option>
                        {states.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">City</label>
                    <div className="relative">
                      <select
                        value={form.city}
                        disabled={!form.state}
                        onChange={e => setForm({ ...form, city: e.target.value })}
                        className="w-full bg-gray-50 hover:bg-white border border-transparent focus:border-orange-500 rounded-2xl p-4 text-sm font-bold text-gray-800 outline-none transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer pr-10 focus:ring-4 focus:ring-orange-500/10"
                      >
                        <option value="">Select City</option>
                        {form.state && citiesByState[form.state].map(c => <option key={c}>{c}</option>)}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">Street Address</label>
                  <textarea
                    placeholder="e.g. 12B, Admiralty Way, Lekki Phase 1"
                    value={form.addressLine}
                    onChange={e => setForm({ ...form, addressLine: e.target.value })}
                    rows={2}
                    className="w-full bg-gray-50 hover:bg-white border border-transparent focus:border-orange-500 rounded-2xl p-4 text-sm font-bold text-gray-800 outline-none transition-all resize-none focus:ring-4 focus:ring-orange-500/10 placeholder:text-gray-300"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  {editingId && (
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setForm({ state: "", city: "", addressLine: "" });
                      }}
                      className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    disabled={loading}
                    onClick={saveAddress}
                    className="flex-[2] py-4 rounded-2xl font-bold text-white bg-gray-900 shadow-xl shadow-gray-900/20 hover:bg-orange-600 hover:shadow-orange-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        {editingId ? <CheckCircle size={20} /> : <Plus size={20} />}
                        <span>{editingId ? "Update Location" : "Save Location"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* List Section */}
          <div key="address-list" className="space-y-4">
            {addresses.length > 0 && (
              <div className="flex items-center gap-2 px-2">
                <Home size={16} className="text-orange-500" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Saved Locations</h3>
              </div>
            )}

            {addresses.map((addr, index) => (
              <motion.div
                key={addr._id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative bg-white border transition-all duration-300 rounded-[24px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${addr.isDefault
                  ? "border-orange-500/30 shadow-lg shadow-orange-500/10 ring-4 ring-orange-500/5"
                  : "border-gray-100 hover:border-orange-200 hover:shadow-xl hover:shadow-gray-200/50"
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${addr.isDefault ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "bg-gray-100 text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors"}`}>
                    <Building2 size={24} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-gray-900 text-base">{addr.addressLine}</h3>
                      {addr.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wide">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-400 mt-0.5">{addr.city}, {addr.state}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 md:pt-0 border-t md:border-none border-gray-50 mt-2 md:mt-0">
                  {!addr.isDefault && (
                    <button
                      onClick={() => setDefault(addr._id)}
                      disabled={settingDefaultId === addr._id}
                      className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${settingDefaultId === addr._id ? "text-gray-400" : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"}`}
                    >
                      {settingDefaultId === addr._id ? "Saving..." : "Set Default"}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingId(addr._id);
                      setForm({ state: addr.state, city: addr.city, addressLine: addr.addressLine });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-2.5 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <Edit3 size={18} />
                  </button>

                  <button
                    onClick={() => confirmDelete(addr._id)}
                    disabled={deletingId === addr._id}
                    className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>

      {/* ---------------- DELETE MODAL ---------------- */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
              <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 bg-red-200/50 rounded-full animate-ping opacity-20"></div>
                <Trash2 className="text-red-500" size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Address?</h3>
              <p className="text-sm font-medium text-gray-400 mb-8 px-2">
                Are you sure you want to remove this delivery location? This action cannot be undone.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={deleteAddress}
                  className="bg-red-500 text-white py-4 rounded-2xl font-bold hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
                >
                  {deletingId ? "Removing..." : "Yes, Remove It"}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="bg-white text-gray-900 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all border border-gray-100"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
