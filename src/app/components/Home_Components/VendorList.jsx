"use client";

/*
 * PAYLOAD REFERENCE — do not guess field names
 *
 * vendor._id
 * vendor.storeName
 * vendor.logo                    → card image (no coverImage on this endpoint)
 * vendor.address.city
 * vendor.deliveryFee             → resolved naira (backend already computed)
 * vendor.rating
 * vendor.ratingCount
 * vendor.openingHours            → passed to getVendorOpenAndCloseStatus()
 * vendor.cuisineTypes            → string[] — available but was unused. Now used for chips.
 *
 * Navigate to vendor storefront:
 *   /restaurants/${vendor._id}
 */

import { useMemo, useState } from "react";
import {
  Utensils, Star, Heart, MapPin, Bike, Clock,
  Sparkles, Gift, ChevronRight, Dot,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getNearbyVendors } from "@/app/lib/userApi";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";
import { useLocationStore } from "@/app/store/userLocationStore";

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────
const VendorCardSkeleton = () => (
  <div
    className="flex-shrink-0 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900"
    style={{ width: "58vw", maxWidth: "240px" }}
  >
    <div className="w-full h-[120px] bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
    <div className="px-3 pt-3 pb-4 space-y-2">
      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full w-4/5" />
      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full w-3/5" />
      <div className="h-8 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl w-full mt-3" />
    </div>
  </div>
);

const ChipSkeleton = () => (
  <div className="h-8 w-20 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full flex-shrink-0" />
);

// ─────────────────────────────────────────────────────────────────────────────
// CUISINE FILTER CHIP
// ─────────────────────────────────────────────────────────────────────────────
const CuisineChip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
      active
        ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
    }`}
  >
    {label}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR CARD
// ─────────────────────────────────────────────────────────────────────────────
const VendorCard = ({ vendor }) => {
  const [liked, setLiked] = useState(false);
  const status = getVendorOpenAndCloseStatus(vendor.openingHours);
  const isOpen = status.startsWith("Open now");

  return (
    <Link
      href={`/restaurants/${vendor._id}`}
      className="group pb-2 flex-shrink-0 bg-white dark:bg-zinc-900 rounded-[16px] overflow-hidden cursor-pointer snap-start transition-all duration-300 block"
        style={{ width: "72vw", maxWidth: "250px" }}

    >
      {/* Image */}
      <div className="relative h-[120px] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {vendor.image ? (
          <img
            src={vendor.image}
            alt={vendor.storeName}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
              !isOpen ? "grayscale-[30%]" : ""
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800">
            <Utensils className="text-zinc-300 dark:text-zinc-600" size={40} />
          </div>
        )}

        {/* Rating badge */}
        <div className="absolute top-2 left-2 bg-white/90 dark:bg-zinc-900/90 px-2 py-1 rounded-xl flex items-center gap-1 shadow-sm border border-white/20">
          <Star size={12} className="fill-orange-500 text-orange-500" />
          <span className="text-[11px] font-black text-zinc-900 dark:text-white">
            {Number(vendor.rating || 0).toFixed(1)}
          </span>
          {vendor.ratingCount > 0 && (
            <span className="text-[8px] font-bold text-zinc-400">
              ({vendor.ratingCount.toLocaleString()})
            </span>
          )}
        </div>

        {/* Open / Closed badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg uppercase tracking-widest ${
              isOpen ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-600"
            }`}
          >
            {isOpen ? "Open" : "Closed"}
          </span>
        </div>

        {/* Promo badge */}
        {vendor.badge && (
          <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-zinc-800/90 px-2 py-1 rounded-lg shadow-sm backdrop-blur-md max-w-[90%]">
            <span className="text-[9px] font-black text-zinc-900 dark:text-white truncate uppercase tracking-widest leading-none flex items-center gap-1">
              <Gift size={10} className="text-orange-500" /> {vendor.badge}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 pt-3 pb-3.5">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white truncate uppercase tracking-tight italic leading-tight">
              {vendor.storeName}
            </h3>
            {/* Cuisine types */}
            {vendor.cuisineTypes?.length > 0 && (
              <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest truncate mt-0.5">
                {vendor.cuisineTypes.slice(0, 2).join(" · ")}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1 font-bold text-zinc-400 text-[9px] uppercase tracking-widest">
              <MapPin size={9} className="text-orange-500" />
              <span className="truncate">{vendor.city || "Nearby"}</span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLiked(!liked);
            }}
            className="transition-colors mt-0.5"
          >
            <Heart
              size={18}
              className={liked ? "fill-red-500 text-red-500" : "text-zinc-200 dark:text-zinc-800"}
              strokeWidth={liked ? 0 : 2}
            />
          </button>
        </div>

        {/* Delivery + ETA row */}
        <div className="mt-3 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter italic">
            <Bike size={14} className="text-orange-600" />
            <span>
              {!vendor.deliveryFee || vendor.deliveryFee === 0
                ? "Free Delivery"
                : `₦${vendor.deliveryFee.toLocaleString()} Fee`}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic">
            <Clock size={12} className="text-orange-500" />
            <span>15–25 min</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────
const SectionHeader = ({ title, subtitle, href, hrefLabel = "View all" }) => (
  <div className="flex items-center justify-between px-4 mb-3.5">
    <div>
      <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
    {href && (
      <Link
        href={href}
        className="text-orange-600 text-[10px] font-black uppercase tracking-widest hover:opacity-70 flex items-center gap-1 group"
      >
        {hrefLabel}
        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// HORIZONTAL VENDOR ROW
// ─────────────────────────────────────────────────────────────────────────────
const VendorRow = ({ vendors }) => (
  <div
    className="flex overflow-x-auto scroll gap-3 px-4 pb-3 scrollbar-hide no-scrollbar"
    style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
  >
    {vendors.map((v) => (
      <VendorCard key={v._id} vendor={v} />
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
const EmptyState = ({ city, selectedCuisine, onClear }) => (
  <div className="px-4">
    <div className="bg-orange-50/50 dark:bg-orange-500/5 rounded-[24px] p-8 text-center border border-orange-100/50 dark:border-orange-500/20 flex flex-col items-center">
      <div className="bg-white dark:bg-zinc-800 p-3 rounded-full mb-3">
        <MapPin className="text-orange-500" size={24} />
      </div>
      {selectedCuisine ? (
        <>
          <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-1">
            No {selectedCuisine} restaurants yet
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[240px] leading-relaxed mb-4">
            We don't have any {selectedCuisine} vendors in {city} right now.
          </p>
          <button
            onClick={onClear}
            className="text-[10px] font-black uppercase tracking-widest text-orange-600 border border-orange-300 px-4 py-2 rounded-full"
          >
            Show all restaurants
          </button>
        </>
      ) : (
        <>
          <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-1">
            Coming Soon to {city}!
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[240px] leading-relaxed">
            We're onboarding restaurants in your area. Get your appetite ready!
          </p>
        </>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function VendorList() {
  const [selectedCuisine, setSelectedCuisine] = useState(null);

  const { userLocation } = useLocationStore();

  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: ["vendors-nearby", userLocation?.city, userLocation?.state],
    queryFn: () =>
      getNearbyVendors({ city: userLocation.city, state: userLocation.state }),
    enabled: !!userLocation?.city && !!userLocation?.state,
    staleTime: 1000 * 60 * 5,
  });

  // ── Shape vendor list ──────────────────────────────────────────────────────
  const allVendors = useMemo(() => {
    const raw = responseData?.vendors || [];
    return raw.map((v) => ({
      _id:          v._id,
      storeName:    v.storeName,
      city:         v.address?.city,
      image:        v.logo || null,
      deliveryFee:  v.deliveryFee ?? 0,
      rating:       v.rating   || 0,
      ratingCount:  v.ratingCount || 0,
      openingHours: v.openingHours,
      cuisineTypes: v.cuisineTypes || [],
      badge:        null,
      // Compute open status once here so sort and render share same value
      isOpen: getVendorOpenAndCloseStatus(v.openingHours).startsWith("Open now"),
    }));
  }, [responseData]);

  // ── Cuisine chips — deduplicated across all vendors ────────────────────────
  const cuisineOptions = useMemo(() => {
    const counts = {};
    allVendors.forEach((v) => {
      (v.cuisineTypes || []).forEach((c) => {
        const key = c.trim();
        if (key) counts[key] = (counts[key] || 0) + 1;
      });
    });
    // Sort by frequency so most common cuisines appear first
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [allVendors]);

  // ── Apply cuisine filter ───────────────────────────────────────────────────
  const filteredVendors = useMemo(() => {
    if (!selectedCuisine) return allVendors;
    return allVendors.filter((v) =>
      v.cuisineTypes.some(
        (c) => c.trim().toLowerCase() === selectedCuisine.toLowerCase()
      )
    );
  }, [allVendors, selectedCuisine]);

  // ── Split open vs closed, sort each by rating desc ────────────────────────
  const { openVendors, closedVendors } = useMemo(() => {
    const byRating = (a, b) => b.rating - a.rating;
    return {
      openVendors:   filteredVendors.filter((v) =>  v.isOpen).sort(byRating),
      closedVendors: filteredVendors.filter((v) => !v.isOpen).sort(byRating),
    };
  }, [filteredVendors]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 pb-4">
        {/* Chip skeletons */}
        <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide no-scrollbar">
          {[1, 2, 3, 4].map((n) => <ChipSkeleton key={n} />)}
        </div>
        {/* Card skeletons */}
        <div>
          <div className="h-5 w-40 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-md mb-4 mx-4" />
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide no-scrollbar">
            {[1, 2, 3].map((n) => <VendorCardSkeleton key={n} />)}
          </div>
        </div>
      </div>
    );
  }

  if (isError) return null;
  if (!userLocation) return null;

  // ── Empty state (no vendors at all in this city) ───────────────────────────
  if (allVendors.length === 0) {
    return (
      <div className="px-0 mb-6">
        <div className="flex items-center gap-2 px-4 mb-4">
          <div className="bg-orange-100 dark:bg-orange-500/20 p-1.5 rounded-lg">
            <Sparkles className="text-orange-600 fill-orange-600" size={18} />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
            Restaurants Near You
          </h2>
        </div>
        <EmptyState
          city={userLocation?.city}
          selectedCuisine={null}
          onClear={() => setSelectedCuisine(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-4">

      {/* ── Cuisine Filter Chips ─────────────────────────────────────────── */}
      {cuisineOptions.length > 0 && (
        <div
          className="flex gap-2 px-4 scroll overflow-x-auto scrollbar-hide no-scrollbar"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <CuisineChip
            label="All"
            active={!selectedCuisine}
            onClick={() => setSelectedCuisine(null)}
          />
          {cuisineOptions.map((c) => (
            <CuisineChip
              key={c}
              label={c}
              active={selectedCuisine === c}
              onClick={() =>
                setSelectedCuisine((prev) => (prev === c ? null : c))
              }
            />
          ))}
        </div>
      )}

      {/* ── No results for selected cuisine ─────────────────────────────── */}
      {filteredVendors.length === 0 && selectedCuisine && (
        <EmptyState
          city={userLocation?.city}
          selectedCuisine={selectedCuisine}
          onClear={() => setSelectedCuisine(null)}
        />
      )}

      {/* ── Open Now ─────────────────────────────────────────────────────── */}
      {openVendors.length > 0 && (
        <div>
          <SectionHeader
            title={
              <span className="flex items-center gap-2">
                Open Now
                {/* Live dot */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </span>
            }
            subtitle={`${openVendors.length} restaurant${openVendors.length !== 1 ? "s" : ""} taking orders`}
            href="/all-restaurants"
            hrefLabel="View all"
          />
          <VendorRow vendors={openVendors} />
        </div>
      )}

      {/* ── Closed / Coming Back Soon ────────────────────────────────────── */}
      {closedVendors.length > 0 && (
        <div>
          <SectionHeader
            title="Coming Back Soon"
            subtitle="Check their hours before ordering"
          />
          <VendorRow vendors={closedVendors} />
        </div>
      )}

    </div>
  );
}