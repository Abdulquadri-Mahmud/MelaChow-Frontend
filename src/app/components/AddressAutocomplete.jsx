"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { searchOpenStreetMapAddress } from "../lib/deliveryGeolocation";

export default function AddressAutocomplete({ value, onChange, onPlaceSelect, className, placeholder }) {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const searchAddress = async () => {
    if (!value?.trim()) return;
    setSearching(true);
    setError("");
    try {
      const matches = await searchOpenStreetMapAddress(value.trim());
      setResults(matches);
      if (!matches.length) setError("Street not found. Add more details or keep the typed address and use your phone GPS.");
    } catch (requestError) {
      setError(requestError.message || "Address search is unavailable. You can still type the address and use GPS.");
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (result) => {
    onChange(result.addressLine);
    onPlaceSelect?.(result);
    setResults([]);
    setError("");
  };

  return (
    <div className="space-y-2">
      <textarea
        placeholder={placeholder || "House number, street, area or landmark"}
        value={value}
        onChange={(event) => { onChange(event.target.value); setResults([]); }}
        rows={3}
        className={className}
        aria-label="Delivery address"
        required
      />
      <button
        type="button"
        onClick={searchAddress}
        disabled={searching || !value?.trim()}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-gray-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        Search this address
      </button>
      {error && <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">{error}</p>}
      {results.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {results.map((result) => (
            <button
              type="button"
              key={`${result.providerPlaceId}-${result.coordinates.lat}`}
              onClick={() => selectResult(result)}
              className="block w-full border-b border-gray-100 px-3 py-3 text-left text-xs leading-relaxed text-gray-700 last:border-0 hover:bg-orange-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-orange-500/10"
            >
              {result.addressLine}
            </button>
          ))}
        </div>
      )}
      <p className="text-[10px] text-gray-400">Address results © OpenStreetMap contributors</p>
    </div>
  );
}
