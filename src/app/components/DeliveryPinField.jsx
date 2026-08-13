"use client";

import { CheckCircle2, ExternalLink, Loader2, MapPin, Navigation } from "lucide-react";

export default function DeliveryPinField({ coordinates, locating, onCapture }) {
  const accuracy = Number(coordinates?.accuracy);
  const hasAccuracy = Number.isFinite(accuracy) && accuracy > 0;
  const mapsUrl = coordinates
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${coordinates.lat},${coordinates.lng}`)}`
    : "";

  return (
    <section className={`rounded-2xl border p-4 ${coordinates ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/10" : "border-orange-200 bg-orange-50/70 dark:border-orange-500/30 dark:bg-orange-500/10"}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${coordinates ? "bg-emerald-600 text-white" : "bg-orange-500 text-white"}`}>
          {coordinates ? <CheckCircle2 size={18} /> : <MapPin size={18} />}
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white">Delivery pin</h3>
          <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
            {coordinates
              ? "Pin captured. The rider will navigate to this exact spot instead of only searching your street or area."
              : "Help your rider find the correct entrance. Stand at the delivery address and capture your phone's location."}
          </p>
        </div>
      </div>

      {coordinates && (
        <div className="mt-3 rounded-xl bg-white/80 px-3 py-2.5 text-xs text-emerald-800 dark:bg-black/15 dark:text-emerald-200">
          <p className="font-bold">Ready for rider navigation{hasAccuracy ? ` · accurate within about ${Math.round(accuracy)} m` : ""}</p>
          <p className="mt-1 text-[11px] opacity-75">If this is not the delivery entrance, stand at the correct spot and tap “Update pin.”</p>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onCapture}
          disabled={locating}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black ${coordinates ? "bg-emerald-600 text-white" : "bg-orange-500 text-white"} disabled:opacity-60`}
        >
          {locating ? <Loader2 className="animate-spin" size={16} /> : <Navigation size={16} />}
          {locating ? "Finding your phone..." : coordinates ? "Update pin" : "Capture delivery pin"}
        </button>
        {coordinates && (
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-xs font-black text-emerald-700 dark:bg-white/5 dark:text-emerald-300">
            <ExternalLink size={15} /> Check pin in Maps
          </a>
        )}
      </div>
      {!coordinates && <p className="mt-2 text-[10px] font-semibold text-gray-500">Your browser will ask permission to use your location. MelaChow saves the pin only with this address.</p>}
    </section>
  );
}
