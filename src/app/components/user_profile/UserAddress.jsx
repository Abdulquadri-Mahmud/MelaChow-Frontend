"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, MapPin, Trash2, Edit3, CheckCircle, X, Plus,
  ChevronRight, Home, Building2, Loader2, Navigation, Search
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import customerApi from "@/app/lib/customerApi";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { normalizeAddress } from "@/app/lib/addressUtils";
import AddressSkeleton from "../skeleton/AddressSkeleton";
import { autocompleteDeliveryAddress, getDeliveryPlaceDetails } from "@/app/lib/userApi";

export default function AddressPage() {
  const router = useRouter();
  const { user } = useUserStorage();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [settingDefaultId, setSettingDefaultId] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [form, setForm] = useState({ addressLine: "" });
  const [manualState, setManualState] = useState("");
  const [manualCity, setManualCity] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [searching, setSearching] = useState(false);
  const sessionToken = useRef(typeof crypto !== "undefined" ? crypto.randomUUID() : "");

  useEffect(() => {
    if (!isFormOpen || manualMode || selectedPlace || searchText.trim().length < 3) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try { const result = await autocompleteDeliveryAddress({ input: searchText.trim(), sessionToken: sessionToken.current }); setSuggestions(result.data || []); }
      catch { setSuggestions([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [isFormOpen, manualMode, searchText, selectedPlace]);

  const chooseSuggestedAddress = async (suggestion) => {
    setSearching(true);
    try { const result = await getDeliveryPlaceDetails(suggestion.placeId); setSelectedPlace(result.data); setSearchText(result.data.formattedAddress); setForm({ addressLine: result.data.formattedAddress }); setSuggestions([]); }
    catch (error) { toast.error(error.response?.data?.message || "Could not confirm address"); }
    finally { setSearching(false); }
  };

  /* ---------------- FETCH ADDRESSES ---------------- */
  const fetchAddresses = async () => {
    try {
      const res = await customerApi.get(`/user/auth/my-address`, {
        withCredentials: true,
      });
      setAddresses((res.data.addresses || []).map(normalizeAddress));
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

  /* ---------------- SAVE ADDRESS ---------------- */
  const saveAddress = async () => {
    if (!(selectedPlace || (manualState.trim() && manualCity.trim())) || !form.addressLine) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const addressData = {
        state: selectedPlace?.state || manualState.trim(),
        city: selectedPlace?.city || manualCity.trim(),
        addressLine: form.addressLine,
        postalCode: selectedPlace?.postalCode,
        provider: selectedPlace ? "google" : "manual",
        providerPlaceId: selectedPlace?.placeId,
        formattedAddress: selectedPlace?.formattedAddress,
        locationSource: selectedPlace ? "autocomplete_selection" : "manual",
        ...(selectedPlace ? { coordinates: { lat: selectedPlace.latitude, lng: selectedPlace.longitude } } : {}),
        isDefault: addresses.length === 0 ? true : undefined
      };

      let res;
      if (!editingId) {
        res = await customerApi.post(`/user/auth/address`, addressData, { withCredentials: true });
        toast.success("New location added! 🏡");
      } else {
        res = await customerApi.patch(
          `/user/auth/address/update-address`,
          addressData,
          { params: { addressId: editingId }, withCredentials: true }
        );
        toast.success("Address updated ✨");
      }

      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setAddresses((res.data.addresses || []).map(normalizeAddress));
      closeForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const deleteAddress = async () => {
    if (!selectedAddressId) return;
    setDeletingId(selectedAddressId);
    try {
      await customerApi.delete(`/user/auth/address/delete-address`, {
        params: { addressId: selectedAddressId },
        withCredentials: true,
      });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setAddresses(prev => prev.filter(addr => addr._id !== selectedAddressId));
      toast.success("Address removed");
    } catch (err) {
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
      const res = await customerApi.patch(
        `/user/auth/address/update-address`,
        { isDefault: true },
        { params: { addressId: id }, withCredentials: true }
      );
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setAddresses((res.data.addresses || []).map(normalizeAddress));
      toast.success("Default address updated");
    } catch (err) {
      toast.error("Failed to update default");
    } finally {
      setSettingDefaultId(null);
    }
  };

  /* ---------------- FORM CONTROL ---------------- */
  const openForm = (addr = null) => {
    if (addr) {
      setManualMode(true);
      setEditingId(addr._id);
      setForm({ addressLine: addr.addressLine });
      setManualState(addr.state || addr.stateName || "");
      setManualCity(addr.city || addr.cityName || "");
    } else {
      setManualMode(false);
      setEditingId(null);
      setForm({ addressLine: "" });
      setManualState("");
      setManualCity("");
      setSearchText("");
      setSelectedPlace(null);
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm({ addressLine: "" });
    setManualState("");
    setManualCity("");
    setSearchText("");
    setSuggestions([]);
    setSelectedPlace(null);
    setManualMode(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400"
          >
            <ArrowLeft size={18} />
          </motion.button>
          <div>
            <h1 className="text-base font-black text-gray-900 dark:text-white tracking-tight leading-tight">My Addresses</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Saved delivery spots</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => openForm()}
          className="bg-orange-500 text-white p-2 rounded-xl shadow-lg shadow-orange-500/20"
        >
          <Plus size={20} />
        </motion.button>
      </header>

      <div className="max-w-xl mx-auto p-4 space-y-4">
        {fetching ? (
          <AddressSkeleton count={3} />
        ) : addresses.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-500/10 rounded-3xl flex items-center justify-center mb-4">
              <MapPin className="text-orange-500" size={28} />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">No addresses yet</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Add a delivery address to start ordering your favorite meals.</p>
            <button
              onClick={() => openForm()}
              className="mt-6 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
            >
              Add New Address
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {addresses.map((addr, index) => (
              <motion.div
                key={addr._id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl border transition-all ${
                  addr.isDefault 
                  ? "border-orange-500/20 ring-1 ring-orange-500/10" 
                  : "border-gray-100 dark:border-zinc-800"
                }`}
              >
                {addr.isDefault && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-orange-500 text-white text-[8px] font-black uppercase tracking-tighter px-3 py-1 rounded-bl-xl">
                      Default
                    </div>
                  </div>
                )}
                
                <div className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center ${
                    addr.isDefault ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-400"
                  }`}>
                    {addr.isDefault ? <Home size={20} /> : <Navigation size={20} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white truncate pr-12 italic uppercase">
                      {addr.addressLine}
                    </h3>
                    <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight">
                      {addr.city}, {addr.state}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openForm(addr)}
                      className="p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => { setSelectedAddressId(addr._id); setShowDeleteModal(true); }}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {!addr.isDefault && (
                  <button
                    onClick={() => setDefault(addr._id)}
                    disabled={settingDefaultId === addr._id}
                    className="w-full py-2 bg-gray-50/50 dark:bg-zinc-800/50 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-all border-t border-gray-100 dark:border-zinc-800"
                  >
                    {settingDefaultId === addr._id ? "Applying..." : "Set as Default"}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ---------------- FORM MODAL ---------------- */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeForm}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] mb-16 sm:mb-0"
            >
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full sm:hidden" />
              
              <div className="flex justify-between items-center mb-6 px-6 sm:px-8 pt-8 sm:pt-8">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase italic">
                    {editingId ? "Update Location" : "Add Address"}
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Precise delivery details</p>
                </div>
                <button onClick={closeForm} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full text-gray-400">
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 sm:px-8 pb-8 space-y-4">
                  {!manualMode && <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Search delivery address</label>
                    <div className="relative"><Search className="absolute left-4 top-4 text-gray-400" size={17}/><input value={searchText} onChange={e=>{setSearchText(e.target.value);setSelectedPlace(null);setForm({addressLine:""});}} placeholder="Street, estate, landmark or area" className="w-full rounded-2xl border border-zinc-100 bg-zinc-50 py-3.5 pl-11 pr-10 text-sm font-bold outline-none focus:border-orange-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-white"/>{searching&&<Loader2 className="absolute right-4 top-4 animate-spin text-orange-500" size={17}/>}</div>
                    {suggestions.length>0&&<div className="overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800">{suggestions.map(item=><button key={item.placeId} onClick={()=>chooseSuggestedAddress(item)} className="flex w-full items-center gap-3 border-b border-zinc-100 p-3 text-left last:border-0 hover:bg-orange-50 dark:border-zinc-800"><MapPin size={16} className="shrink-0 text-orange-500"/><span className="min-w-0 flex-1"><strong className="block truncate text-sm dark:text-white">{item.mainText||item.text}</strong><span className="block truncate text-xs text-gray-400">{item.secondaryText}</span></span><ChevronRight size={15}/></button>)}</div>}
                    {selectedPlace&&<div className="flex gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800"><CheckCircle size={17}/>{selectedPlace.formattedAddress}</div>}
                    <button type="button" onClick={()=>setManualMode(true)} className="text-xs font-black text-orange-600">Can&apos;t find it? Enter manually</button>
                  </div>}
                  {manualMode && <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">State</label>
                      <input
                        value={manualState}
                        onChange={e => setManualState(e.target.value)}
                        placeholder="e.g. Ogun"
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-3.5 text-sm font-bold text-gray-900 dark:text-white outline-none appearance-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">City</label>
                      <input value={manualCity} onChange={e => setManualCity(e.target.value)} placeholder="e.g. Saapade" className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-3.5 text-sm font-bold text-gray-900 dark:text-white outline-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Street Address</label>
                    <textarea
                      placeholder="e.g. 12B, Admiralty Way, Lekki"
                      value={form.addressLine}
                      onChange={e => setForm({ addressLine: e.target.value })}
                      rows={3}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold text-gray-900 dark:text-white outline-none resize-none focus:ring-4 focus:ring-orange-500/5"
                    />
                  </div>
                  </>}


                  <button
                    disabled={loading || !(selectedPlace || (manualState.trim() && manualCity.trim())) || !form.addressLine}
                    onClick={saveAddress}
                    className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : editingId ? "Update Address" : "Save Address"}
                  </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- DELETE MODAL ---------------- */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl">
              <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white italic uppercase">Delete Address?</h3>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-2 mb-6">This action cannot be undone.</p>
              <div className="grid gap-2">
                <button onClick={deleteAddress} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20">
                  {deletingId ? "Removing..." : "Delete Permanently"}
                </button>
                <button onClick={() => setShowDeleteModal(false)} className="w-full py-4 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
