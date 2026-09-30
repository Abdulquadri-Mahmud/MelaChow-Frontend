"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, MapPin, Trash2, Edit3, CheckCircle, X, Plus,
  ChevronRight, Home, Building2, Loader2, AlertCircle, Navigation
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useApi } from "@/app/context/ApiContext";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { LocationService } from "@/app/lib/locationService";
import { normalizeAddress } from "@/app/lib/addressUtils";
import AddressSkeleton from "../skeleton/AddressSkeleton";
import DeliveryPinField from "../DeliveryPinField";
import { getDeliveryPosition, reverseGeocodeWithOpenStreetMap } from "@/app/lib/deliveryGeolocation";
import AddressAutocomplete from "../AddressAutocomplete";

export default function AddressPage() {
  const router = useRouter();
  const { baseUrl } = useApi();
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

  // Location state
  const [locations, setLocations] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [locationError, setLocationError] = useState(null);

  const [form, setForm] = useState({ addressLine: "" });
  const [coordinates, setCoordinates] = useState(null);
  const [locating, setLocating] = useState(false);
  const [resolvedLocation, setResolvedLocation] = useState(null);

  const captureDeliveryPin = async () => {
    setLocating(true);
    try {
      const { coords } = await getDeliveryPosition();
      const pin = { lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy };
      setCoordinates(pin);
      try {
        const location = await reverseGeocodeWithOpenStreetMap(pin);
        setResolvedLocation(location);
        setForm((current) => ({ ...current, addressLine: location.addressLine || current.addressLine, city: location.city || current.city, state: location.state || current.state }));
        toast.success("Your location was found.");
      } catch {
        setResolvedLocation({ provider: "openstreetmap", locationSource: "device_gps" });
        toast.success("Location captured. Type your exact street address.");
      }
    } catch (error) {
      toast.error(error.message, { duration: 7000 });
    } finally {
      setLocating(false);
    }
  };

  /* ---------------- FETCH LOCATIONS ---------------- */
  const fetchLocations = async () => {
    try {
      setIsLoadingLocations(true);
      setLocationError(null);
      const result = await LocationService.fetchUserLocations();
      if (result.success) {
        setLocations(result.locations || []);
      } else {
        setLocationError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      console.error("Error fetching locations:", err);
      setLocationError("Error loading locations. Please refresh.");
    } finally {
      setIsLoadingLocations(false);
    }
  };

  /* ---------------- FETCH ADDRESSES ---------------- */
  const fetchAddresses = async () => {
    try {
      const res = await axios.get(`${baseUrl}/user/auth/my-address`, {
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
    fetchLocations();
    fetchAddresses();
  }, []);

  /* ---------------- HANDLE STATE CHANGE ---------------- */
  const handleStateChange = (e) => {
    const stateId = e.target.value;
    setSelectedStateId(stateId);
    const selectedLocation = locations.find(loc => loc.stateId === stateId);
    setCities(selectedLocation?.cities || []);
    setSelectedCityId("");
  };

  /* ---------------- SAVE ADDRESS ---------------- */
  const saveAddress = async () => {
    if (!form.addressLine || !coordinates) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {

      const addressData = {
        state: resolvedLocation?.state || form.state || "",
        city: resolvedLocation?.city || form.city || "",
        stateId: selectedStateId,
        cityId: selectedCityId,
        addressLine: form.addressLine,
        coordinates,
        provider: resolvedLocation?.provider || "openstreetmap",
        providerPlaceId: resolvedLocation?.providerPlaceId || "",
        formattedAddress: form.addressLine,
        locationSource: resolvedLocation?.locationSource || "device_gps",
        isDefault: addresses.length === 0 ? true : undefined
      };

      let res;
      if (!editingId) {
        res = await axios.post(`${baseUrl}/user/auth/address`, addressData, { withCredentials: true });
        toast.success("New location added! 🏡");
      } else {
        res = await axios.patch(
          `${baseUrl}/user/auth/address/update-address`,
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
      await axios.delete(`${baseUrl}/user/auth/address/delete-address`, {
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
      const res = await axios.patch(
        `${baseUrl}/user/auth/address/update-address`,
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
      setEditingId(addr._id);
      setForm({ addressLine: addr.addressLine, city: addr.city || addr.cityName || "", state: addr.state || addr.stateName || "" });
      setCoordinates(addr.coordinates || null);
      const stateLoc = locations.find(loc => loc.state === addr.state || loc.state === addr.stateName || loc.stateId === addr.stateId);
      if (stateLoc) {
        setSelectedStateId(stateLoc.stateId);
        setCities(stateLoc.cities || []);
        const cityLoc = stateLoc.cities.find(c => c.name === addr.city || c.name === addr.cityName || c.cityId === addr.cityId);
        if (cityLoc) setSelectedCityId(cityLoc.cityId);
      }
    } else {
      setEditingId(null);
      setForm({ addressLine: "", city: "", state: "" });
      setCoordinates(null);
      setSelectedStateId("");
      setSelectedCityId("");
      setCities([]);
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm({ addressLine: "" });
    setCoordinates(null);
    setLocating(false);
    setSelectedStateId("");
    setSelectedCityId("");
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

              <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-8 sm:px-8">
                <button
                  type="button"
                  onClick={captureDeliveryPin}
                  disabled={locating}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-black transition disabled:opacity-60 ${coordinates ? "bg-emerald-600 text-white" : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"}`}
                >
                  {locating ? <Loader2 className="animate-spin" size={18} /> : coordinates ? <CheckCircle size={18} /> : <Navigation size={18} />}
                  {locating ? "Finding your location..." : coordinates ? "Location captured" : "Use my current location"}
                </button>

                {coordinates && (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/25 dark:bg-emerald-500/10">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">GPS coordinates</p>
                      <p className="mt-0.5 font-mono text-[11px] font-bold text-zinc-700 dark:text-zinc-200">{Number(coordinates.lat).toFixed(6)}, {Number(coordinates.lng).toFixed(6)}</p>
                    </div>
                    {Number.isFinite(Number(coordinates.accuracy)) && (
                      <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-emerald-700 dark:bg-zinc-800 dark:text-emerald-300">
                        {Number(coordinates.accuracy) >= 1000 ? `\u00B1${(Number(coordinates.accuracy) / 1000).toFixed(Number(coordinates.accuracy) >= 10000 ? 0 : 1)} km` : `\u00B1${Math.round(Number(coordinates.accuracy))} m`}
                      </span>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="pl-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery address</label>
                  <textarea
                    value={form.addressLine}
                    onChange={(event) => setForm((current) => ({ ...current, addressLine: event.target.value }))}
                    placeholder={coordinates ? "Confirm or correct your street, entrance, or landmark" : "Use your location to fill this address"}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-orange-500/5 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-white"
                  />
                  {coordinates && <p className="px-1 text-[11px] text-zinc-500">Editing this address will keep the captured GPS coordinates.</p>}
                </div>

                <button
                  disabled={loading || !form.addressLine || !coordinates}
                  onClick={saveAddress}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg disabled:opacity-50"
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
