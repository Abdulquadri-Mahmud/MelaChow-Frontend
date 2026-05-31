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

import React, { useMemo, useState, useEffect } from "react";
import {
  Utensils, Star, Heart, MapPin, Bike, Clock,
  Sparkles, Gift, ChevronRight, Dot, Moon, ChefHat, Pizza, Coffee, Globe
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import FreeDeliveryBadge from "@/components/ui/FreeDeliveryBadge";
import { useQuery } from "@tanstack/react-query";
import { getNearbyVendors } from "@/app/lib/userApi";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";
import { useLocationStore } from "@/app/store/userLocationStore";

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────
const VendorCardSkeleton = () => (
  <div
    className="flex-shrink-0 rounded-[20px] overflow-hidden bg-white dark:bg-zinc-900"
    style={{ width: "75vw", maxWidth: "300px" }}
  >
    <div className="w-full h-[160px] bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
    <div className="px-1 pt-3 pb-4 space-y-3">
      <div className="flex justify-between items-center px-1">
        <div className="h-4 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full w-3/4" />
        <div className="h-5 w-5 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full" />
      </div>
      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full w-1/2 mx-1" />
    </div>
  </div>
);

const ChipSkeleton = () => (
  <div className="h-8 w-20 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full flex-shrink-0" />
);


// ─────────────────────────────────────────────────────────────────────────────
// VENDOR CARD
// ─────────────────────────────────────────────────────────────────────────────
const VendorCard = ({ vendor }) => {
  const status = getVendorOpenAndCloseStatus(vendor.openingHours);
  const isOpen = status.startsWith("Open now");

  return (
    <Link
      href={`/restaurants/${vendor._id}`}
      className="group flex-shrink-0 bg-white dark:bg-zinc-900 rounded-[20px] overflow-hidden cursor-pointer snap-start transition-all duration-300 block"
      style={{ width: "75vw", maxWidth: "280px" }}
    >
      {/* Image Container */}
      <div className="relative h-[120px] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {vendor.image ? (
          <Image
            src={vendor.image}
            alt={vendor.storeName}
            fill
            sizes="(max-width: 640px) 75vw, 280px"
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
              !isOpen ? "grayscale-[30%]" : ""
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800">
            <Utensils className="text-zinc-300 dark:text-zinc-600" size={40} />
          </div>
        )}

        {/* Floating Promo Badge - Conditionally shown if delivery is free */}
        {vendor.hasActiveDeliveryPromo ? (
          <div className="absolute bottom-3 right-3 shadow-sm flex items-center">
            <FreeDeliveryBadge type="vendor" />
          </div>
        ) : (!vendor.deliveryFee || vendor.deliveryFee === 0) ? (
          <div className="absolute bottom-3 right-3 bg-[#FFF9E5] border border-black/10 px-3 py-1.5 rounded-[12px] shadow-sm flex items-center gap-2">
            <Gift size={14} className="text-orange-500" />
            <span className="text-[10px] font-bold text-zinc-800 tracking-tight">
              Free delivery on all orders
            </span>
          </div>
        ) : null}
      </div>

      {/* Info Section */}
      <div className="px-1 pt-3 pb-4">
        {/* Title Row */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-[15px] font-bold text-zinc-900 dark:text-white truncate">
            {vendor.storeName} - {vendor.city}
          </h3>
        </div>

        {/* Metadata Row */}
        <div className="flex items-center justify-between text-[11px] font-medium">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            {/* Payment/Offer Icon */}
            <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Globe size={10} className="text-orange-600 dark:text-indigo-400" />
            </div>

            <span className="text-zinc-300">|</span>

            {/* Delivery */}
            <div className="flex items-center gap-1">
              <Bike size={14} className="text-zinc-800 dark:text-zinc-200" />
              <span className="text-zinc-800 dark:text-zinc-200">
                From {!vendor.deliveryFee || vendor.deliveryFee === 0 ? "Free" : `₦${vendor.deliveryFee}`}
              </span>
            </div>

            <span className="text-zinc-300">|</span>

            {/* Status */}
            <span className={isOpen ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
              {isOpen ? "Open now" : "Closed"}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-zinc-900 dark:text-white font-bold">
              {Number(vendor.rating || 0) === 0 ? "New" : Number(vendor.rating).toFixed(1)}
            </span>
            {vendor.ratingCount > 0 && (
              <span className="text-zinc-400 text-[10px]">({vendor.ratingCount})</span>
            )}
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
  <div className="flex items-center justify-between px-2 mb-3.5">
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
    className="flex overflow-x-auto scroll gap-3 pb-3 scrollbar-hide no-scrollbar"
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
export default function VendorList({ user }) {
  const [mounted, setMounted] = React.useState(false);
  const { userLocation, syncWithUserAddress } = useLocationStore();
  const searchParams = useSearchParams();
  const filterFreeDelivery =
    searchParams.get("freeDelivery") === "true" ||
    searchParams.get("promo") === "free-delivery";

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (user) {
      syncWithUserAddress(user);
    }
  }, [user, syncWithUserAddress]);

  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: ["vendors-nearby", userLocation?.city, userLocation?.state],
    queryFn: () =>
      getNearbyVendors({ city: userLocation.city, state: userLocation.state }),
    enabled: !!userLocation?.city && !!userLocation?.state && mounted,
    staleTime: 1000 * 60,
  });

  const allVendors = useMemo(() => {
    const raw = responseData?.vendors || [];
    const normalized = raw.map((v) => ({
      _id: v._id,
      storeName: v.storeName,
      city: v.address?.city,
      image: v.logo || null,
      deliveryFee: v.deliveryFee ?? 0,
      rating: v.rating || 0,
      ratingCount: v.ratingCount || 0,
      openingHours: v.openingHours,
      cuisineTypes: v.cuisineTypes || [],
      locationStatus: v.locationStatus || "approved",
      hasActiveDeliveryPromo: v.hasActiveDeliveryPromo || false,
      activeDeliveryPromo: v.activeDeliveryPromo || null,
      badge: null,
      isOpen: getVendorOpenAndCloseStatus(v.openingHours).startsWith("Open now"),
    }));

    if (filterFreeDelivery) {
      return normalized.filter((v) => v.hasActiveDeliveryPromo === true);
    }

    return normalized;
  }, [responseData, filterFreeDelivery]);

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


  const { openVendors, closedVendors, topRatedVendors } = useMemo(() => {
    const byRating = (a, b) => b.rating - a.rating;
    const open = allVendors.filter((v) => v.isOpen).sort(byRating);
    return {
      openVendors:   open,
      closedVendors: allVendors.filter((v) => !v.isOpen).sort(byRating),
      topRatedVendors: open.filter((v) => v.rating >= 4.0).slice(0, 10), // Top 10 open vendors with 4+ stars
    };
  }, [allVendors]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!mounted || isLoading) {
    return (
      <div className="space-y-6 pb-4">
        {/* Chip skeletons */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide no-scrollbar">
          {[1, 2, 3, 4].map((n) => <ChipSkeleton key={n} />)}
        </div>
        {/* Card skeletons */}
        <div>
          <div className="h-5 w-40 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-md mb-4 mx-4" />
          <div className="flex gap-3 overflow-x-auto scrollbar-hide no-scrollbar">
            {[1, 2, 3].map((n) => <VendorCardSkeleton key={n} />)}
          </div>
        </div>
      </div>
    );
  }

  if (isError) return null;
  // if (!userLocation) return null; // Remove this to allow rendering even without location (it will hit empty state or skeleton)


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
        {filterFreeDelivery ? (
          <div className="px-4">
            <div className="rounded-[24px] border border-orange-100 bg-orange-50/70 p-6 text-center dark:border-orange-500/20 dark:bg-orange-500/10">
              <Gift className="mx-auto mb-3 text-orange-500" size={28} />
              <h3 className="text-base font-black text-zinc-900 dark:text-white">
                No free-delivery restaurants right now
              </h3>
              <p className="mx-auto mt-2 max-w-[260px] text-xs font-semibold leading-relaxed text-zinc-500 dark:text-zinc-400">
                The campaign may have ended, reached its claim limit, or no participating restaurant is available in {userLocation?.city || "your area"}.
              </p>
              <button
                onClick={() => window.location.href = "/home"}
                className="mt-4 rounded-full border border-orange-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-orange-600 dark:border-orange-500/30 dark:bg-zinc-900"
              >
                Show all restaurants
              </button>
            </div>
          </div>
        ) : (
          <EmptyState
            city={userLocation?.city}
            selectedCuisine={null}
            onClear={() => {}}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-4">
      {filterFreeDelivery && (
        <div className="mx-2 mb-1 flex items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-3 py-2 dark:border-orange-500/20 dark:bg-orange-500/10">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-orange-600">
              Free delivery campaign
            </p>
            <p className="truncate text-[10px] font-semibold text-orange-600/80 dark:text-orange-300/80">
              Showing restaurants eligible for sponsored delivery
            </p>
          </div>
          <button
            onClick={() => window.location.href = "/home"}
            className="shrink-0 rounded-lg border border-orange-200 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-orange-500 dark:border-orange-500/30"
          >
            Clear
          </button>
        </div>
      )}


      {/* ── Open Now ─────────────────────────────────────────────────────── */}
      {openVendors.length > 0 && (
        <div>
          <SectionHeader
            title={
              <span className="flex items-center gap-2">
                <Clock size={18} className="text-emerald-500" />
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

      {/* ── Top Rated ────────────────────────────────────────────────────── */}
      {topRatedVendors.length > 0 && (
        <div>
          <SectionHeader
            title={
              <span className="flex items-center gap-2">
                <Star size={18} className="text-orange-500 fill-orange-500" />
                Top Rated
              </span>
            }
            subtitle="Highly recommended by local foodies"
            href="/search?sort=rating"
            hrefLabel="Explore"
          />
          <VendorRow vendors={topRatedVendors} />
        </div>
      )}

      {/* ── Categorized Cuisines Rows ───────────────────────────────────── */}
      {cuisineOptions.map((cuisine) => {
        const cuisineVendors = allVendors.filter(v => 
          v.cuisineTypes?.some(t => t.trim() === cuisine) && 
          v.isOpen
        );

        if (cuisineVendors.length === 0) return null;

        // Sort to put open ones first
        const sortedCuisineVendors = [...cuisineVendors].sort((a, b) => (b.isOpen === a.isOpen) ? 0 : b.isOpen ? 1 : -1);

        return (
          <div key={cuisine}>
            <SectionHeader
              title={
                <span className="flex items-center gap-2">
                  <ChefHat size={18} className="text-orange-500" />
                  {cuisine} Specials
                </span>
              }
              subtitle={`Popular ${cuisine.toLowerCase()} spots near you`}
              href={`/search?cuisine=${cuisine}`}
              hrefLabel="View more"
            />
            <VendorRow vendors={sortedCuisineVendors} />
          </div>
        );
      })}

      {/* ── Closed / Coming Back Soon ────────────────────────────────────── */}
      {closedVendors.length > 0 && (
        <div>
          <SectionHeader
            title={
              <span className="flex items-center gap-2">
                <Moon size={18} className="text-slate-400" />
                Coming Back Soon
              </span>
            }
            subtitle="Check their hours before ordering"
          />
          <VendorRow vendors={closedVendors} />
        </div>
      )}

    </div>
  );
}
