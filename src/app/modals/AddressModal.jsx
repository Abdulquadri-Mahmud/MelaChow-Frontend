"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Home, Loader2, LocateFixed, MapPin, X } from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useApi } from "../context/ApiContext";
import { normalizeUserAddresses } from "../lib/addressUtils";
import { getDeliveryPosition, reverseGeocodeWithOpenStreetMap } from "../lib/deliveryGeolocation";

const subscribe = () => () => {};
const hasCoordinates = (address) =>
  Number.isFinite(Number(address?.coordinates?.lat ?? address?.latitude)) &&
  Number.isFinite(Number(address?.coordinates?.lng ?? address?.longitude));

export default function AddressModal({ user, isOpen, setIsOpen }) {
  const [addressLine, setAddressLine] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [resolvedLocation, setResolvedLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const { baseUrl } = useApi();
  const queryClient = useQueryClient();
  const hasUsableAddress = user?.addresses?.some(hasCoordinates);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setAddressLine("");
      setCoordinates(null);
      setResolvedLocation(null);
      setSaveMessage("");
    }
  }, [isOpen]);

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const { coords } = await getDeliveryPosition();
      const pin = { lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy };
      setCoordinates(pin);
      try {
        const location = await reverseGeocodeWithOpenStreetMap(pin);
        setResolvedLocation(location);
        setAddressLine(location.addressLine || "");
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

  const saveAddress = async () => {
    if (!coordinates) {
      toast.error("Use your current location before saving.");
      return;
    }
    if (!addressLine.trim()) {
      toast.error("Enter your full delivery address.");
      return;
    }

    setLoading(true);
    setSaveMessage("Saving your delivery location...");
    const toastId = toast.loading("Saving your delivery location...");
    try {
      const response = await axios.post(`${baseUrl}/user/auth/address`, {
        addressLine: addressLine.trim(),
        city: resolvedLocation?.city || "",
        state: resolvedLocation?.state || "",
        coordinates,
        provider: resolvedLocation?.provider || "openstreetmap",
        providerPlaceId: resolvedLocation?.providerPlaceId || "",
        formattedAddress: addressLine.trim(),
        locationSource: resolvedLocation?.locationSource || "device_gps",
        isDefault: true,
      }, { withCredentials: true, timeout: 25000 });

      const addresses = response.data?.addresses || [];
      queryClient.setQueryData(["userProfile"], (previous) =>
        normalizeUserAddresses(previous ? { ...previous, addresses } : { ...user, addresses })
      );
      setSaveMessage("Location saved. Finding restaurants...");
      setIsOpen(false);
      toast.success("Delivery location saved.", { id: toastId });
      void queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      void queryClient.invalidateQueries({ queryKey: ["vendors-nearby"] });
    } catch (error) {
      const message = error.code === "ECONNABORTED"
        ? "Saving took too long. Please try again; your location is still available."
        : error.response?.data?.message || "Failed to save your location. Try again.";
      setSaveMessage(message);
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-end justify-center bg-black/55 sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="Close location dialog"
            className="absolute inset-0 cursor-default"
            onClick={hasUsableAddress ? () => setIsOpen(false) : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-title"
            className="relative z-10 w-full overflow-hidden rounded-t-[28px] bg-white shadow-2xl dark:bg-slate-900 sm:max-w-md sm:rounded-[28px]"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
          >
            <header className="relative bg-gradient-to-br from-orange-500 to-orange-600 px-6 pb-6 pt-7 text-center text-white">
              {hasUsableAddress && (
                <button type="button" onClick={() => setIsOpen(false)} className="absolute right-4 top-4 rounded-full bg-white/15 p-2" aria-label="Close">
                  <X size={18} />
                </button>
              )}
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/20">
                <MapPin size={25} />
              </div>
              <h2 id="location-title" className="mt-3 text-xl font-black">Set your delivery location</h2>
              <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-orange-50">We’ll use your phone’s GPS to find restaurants and calculate delivery fees.</p>
            </header>

            <div className="space-y-4 p-5 sm:p-6">
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locating || loading}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-black transition disabled:opacity-60 ${coordinates ? "bg-emerald-600 text-white" : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"}`}
              >
                {locating ? <Loader2 size={18} className="animate-spin" /> : coordinates ? <CheckCircle2 size={18} /> : <LocateFixed size={18} />}
                {locating ? "Finding your location..." : coordinates ? "Location captured" : "Use my current location"}
              </button>

              {coordinates && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/25 dark:bg-emerald-500/10">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
                      <MapPin size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">GPS coordinates</p>
                      <p className="mt-0.5 truncate font-mono text-[11px] font-bold text-zinc-700 dark:text-zinc-200">
                        {Number(coordinates.lat).toFixed(6)}, {Number(coordinates.lng).toFixed(6)}
                      </p>
                    </div>
                  </div>
                  {Number.isFinite(Number(coordinates.accuracy)) && (
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-300">
                      {Number(coordinates.accuracy) >= 1000
                        ? `\u00B1${(Number(coordinates.accuracy) / 1000).toFixed(Number(coordinates.accuracy) >= 10000 ? 0 : 1)} km`
                        : `\u00B1${Math.round(Number(coordinates.accuracy))} m`}
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="delivery-address" className="ml-1 text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Delivery address</label>
                <div className="relative">
                  <Home className="absolute left-4 top-4 text-zinc-400" size={17} />
                  <textarea
                    id="delivery-address"
                    value={addressLine}
                    onChange={(event) => setAddressLine(event.target.value)}
                    placeholder={coordinates ? "Confirm or correct your exact street and entrance" : "Use your location to fill this address"}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 py-3.5 pl-11 pr-4 text-sm font-medium text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                {coordinates && <p className="px-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">Check the address and add your house number, entrance, or landmark if needed.</p>}
              </div>

              <button
                type="button"
                onClick={saveAddress}
                disabled={loading || !coordinates || !addressLine.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-4 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {loading ? "Saving location..." : "Save & find restaurants"}
              </button>
              {saveMessage && (
                <p aria-live="polite" className={"text-center text-xs font-semibold " + (loading ? "text-orange-600 dark:text-orange-400" : "text-zinc-500 dark:text-zinc-400")}>
                  {saveMessage}
                </p>
              )}
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
