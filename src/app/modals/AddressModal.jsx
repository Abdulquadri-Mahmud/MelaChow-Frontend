"use client";

import { useState, useEffect, useSyncExternalStore, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Home, CheckCircle2, Loader2, Search, ChevronRight, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import customerApi from "../lib/customerApi";
import { normalizeUserAddresses } from "../lib/addressUtils";
import { autocompleteDeliveryAddress, getDeliveryPlaceDetails } from "../lib/userApi";

const subscribe = () => () => {};

export default function AddressModal({ user, isOpen, setIsOpen }) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // SSR hydration safety for portals
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  // Check if user has existing addresses
  const hasExistingAddress = user?.addresses?.length > 0;

  const [addressLine, setAddressLine] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapsUnavailable, setMapsUnavailable] = useState(false);
  const [manualCity, setManualCity] = useState("");
  const [manualState, setManualState] = useState("");
  const sessionToken = useRef(null);
  if (!sessionToken.current && typeof crypto !== "undefined") sessionToken.current = crypto.randomUUID();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAddressLine("");
      setSearchText("");
      setSuggestions([]);
      setSelectedPlace(null);
      setManualMode(false);
      setMapsUnavailable(false);
      setManualCity("");
      setManualState("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || manualMode || selectedPlace || searchText.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await autocompleteDeliveryAddress({ input: searchText.trim(), sessionToken: sessionToken.current });
        setSuggestions(response.data || []);
        setMapsUnavailable(false);
      } catch {
        setSuggestions([]);
        setMapsUnavailable(true);
      } finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [isOpen, manualMode, searchText, selectedPlace]);

  const selectSuggestion = async (suggestion) => {
    setSearching(true);
    try {
      const response = await getDeliveryPlaceDetails(suggestion.placeId);
      const place = response.data;
      setSelectedPlace(place);
      setSearchText(place.formattedAddress || suggestion.text);
      setAddressLine(place.formattedAddress || suggestion.text);
      setSuggestions([]);
    } catch (error) {
      toast.error(error.response?.data?.message || "We could not confirm that address");
    } finally { setSearching(false); }
  };

  const handleSave = async () => {
    if (!(selectedPlace || (manualMode && manualCity.trim() && manualState.trim())) || !addressLine.trim()) {
      toast.error("Please fill in all address details");
      return;
    }

    setLoading(true);

    try {
      const res = await customerApi.post(
        `/user/auth/address`,
        {
          addressLine: addressLine.trim(),
          city: selectedPlace?.city || manualCity.trim(),
          state: selectedPlace?.state || manualState.trim(),
          postalCode: selectedPlace?.postalCode || undefined,
          provider: selectedPlace ? "google" : "manual",
          providerPlaceId: selectedPlace?.placeId,
          formattedAddress: selectedPlace?.formattedAddress,
          locationSource: selectedPlace ? "autocomplete_selection" : "manual",
          ...(selectedPlace?.latitude != null ? { coordinates: { lat: selectedPlace.latitude, lng: selectedPlace.longitude } } : {}),
          isDefault: true,
        },
        {
          withCredentials: true, // ✅ Use cookie-based auth
        }
      );

      const addresses = res.data?.addresses || [];
      queryClient.setQueryData(["userProfile"], (prev) =>
        normalizeUserAddresses(prev ? { ...prev, addresses } : { ...user, addresses })
      );
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });

      toast.success("Delivery address saved!");
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to save address. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 h-screen w-screen overflow-hidden">
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={hasExistingAddress ? () => setIsOpen(false) : undefined}
          />

          <motion.div
            className="relative z-10 w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-white dark:bg-slate-900 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-transparent dark:border-slate-800"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header with Background Pattern */}
            <div className="relative flex-shrink-0 bg-orange-500 px-4 py-5 sm:py-6 text-white overflow-hidden">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-orange-400/20 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-10 -mb-10 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

              {/* Only show close button if user has existing addresses */}
              {hasExistingAddress && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="absolute right-4 top-4 z-20 rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
                >
                  <X className="h-5 w-5" />
                </button>
              )}

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-2 sm:mb-3 rounded-2xl bg-white/20 p-2.5 sm:p-3 backdrop-blur-md">
                  <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {hasExistingAddress ? 'Add New Address' : 'Set Your Location'}
                </h2>
                <p className="mt-1 text-orange-50/90 text-xs sm:text-sm max-w-md">
                  {hasExistingAddress
                    ? 'Add another delivery address for your convenience'
                    : '📍 Enter your address to discover restaurants near you and get your food delivered!'}
                </p>
              </div>
            </div>

            {/* Form Section - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {manualMode ? <><div className="grid grid-cols-2 gap-3"><label className="space-y-2"><span className="text-sm font-medium text-gray-700 dark:text-slate-300">State</span><input value={manualState} onChange={(event) => setManualState(event.target.value)} placeholder="Ogun" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800" /></label><label className="space-y-2"><span className="text-sm font-medium text-gray-700 dark:text-slate-300">City or area</span><input value={manualCity} onChange={(event) => setManualCity(event.target.value)} placeholder="Saapade" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800" /></label></div>

              {/* Address Line */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 ml-1">Full Delivery Address</label>
                <div className="relative group">
                  <div className="absolute left-3 top-4 text-gray-400 dark:text-slate-500 group-focus-within:text-orange-500 transition-colors">
                    <Home className="h-4 w-4" />
                  </div>
                  <textarea
                    placeholder="House No, Street name, Landmark..."
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-slate-100 outline-none transition-all focus:border-orange-500 dark:focus:border-orange-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-orange-500/10 resize-none"
                    required
                  />
                </div>
              </div></> : <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 ml-1">Search your delivery address</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input value={searchText} onChange={(event) => { setSearchText(event.target.value); setSelectedPlace(null); setAddressLine(""); }} placeholder="Start typing your street or area" className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 py-3 pl-11 pr-10 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" autoComplete="off" />
                  {searching && <Loader2 className="absolute right-3 top-3.5 h-5 w-5 animate-spin text-orange-500" />}
                </div>
                {suggestions.length > 0 && <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
                  {suggestions.map((suggestion) => <button key={suggestion.placeId} type="button" onClick={() => selectSuggestion(suggestion)} className="flex w-full items-center gap-3 border-b border-gray-100 dark:border-slate-700 px-4 py-3 text-left last:border-0 hover:bg-orange-50 dark:hover:bg-slate-700">
                    <MapPin className="h-4 w-4 shrink-0 text-orange-500" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{suggestion.mainText || suggestion.text}</span><span className="block truncate text-xs text-gray-500">{suggestion.secondaryText}</span></span><ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>)}
                </div>}
                {selectedPlace && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><div className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>Address confirmed</strong><br />{selectedPlace.formattedAddress}</span></div></div>}
                {mapsUnavailable && <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800"><AlertCircle className="h-4 w-4 shrink-0" />Address suggestions are temporarily unavailable. You can enter the address manually.</div>}
                <button type="button" onClick={() => setManualMode(true)} className="text-sm font-semibold text-orange-600 hover:text-orange-700">Can&apos;t find the address? Enter it manually</button>
              </div>}

            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 p-4 sm:p-5 space-y-3 shadow-lg">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Only show cancel button if user has existing addresses */}
                {hasExistingAddress && (
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 dark:text-slate-400 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  disabled={loading || !(selectedPlace || (manualMode && manualCity.trim() && manualState.trim())) || !addressLine.trim()}
                  onClick={handleSave}
                  className={`group relative overflow-hidden rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600 hover:shadow-orange-500/40 disabled:opacity-70 disabled:cursor-not-allowed ${
                    hasExistingAddress ? 'flex-[2]' : 'w-full'
                  }`}
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Saving Address...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{hasExistingAddress ? 'Confirm Address' : 'Save & Find Restaurants'}</span>
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Footer Tip */}
              <p className="text-center text-xs text-gray-500 dark:text-slate-400">
                {hasExistingAddress
                  ? '🔒 Your address is secure and only used for delivery'
                  : '🎉 Once saved, you\'ll see all nearby restaurants!'}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
