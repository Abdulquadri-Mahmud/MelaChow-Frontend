"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, X, ChevronRight, Bike } from "lucide-react";
import { useActivePromos } from "@/app/hooks/useActivePromos";
import Link from "next/link";

/**
 * PromoAnnouncementBanner
 * Renders on the home page when any promo is active.
 *
 * Platform promo → "Your first order ships free" (first-order eligible message)
 * Vendor promo   → "X restaurants are offering free delivery right now"
 * Both active    → Shows platform promo primary, vendor promo as secondary line
 *
 * Dismissible per session (sessionStorage).
 */
export default function PromoAnnouncementBanner() {
  const { platformPromo, vendorPromoCount, hasAnyPromo, isLoading } =
    useActivePromos();

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("promoBannerDismissed") === "true";
  });

  const handleDismiss = () => {
    sessionStorage.setItem("promoBannerDismissed", "true");
    setDismissed(true);
  };

  if (isLoading || !hasAnyPromo || dismissed) return null;

  // Decide which message to show
  const showPlatform = !!platformPromo;
  const showVendor   = vendorPromoCount > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="relative mx-2 rounded-[22px] overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%)",
        }}
      >
        {/* Decorative background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        </div>

        <div className="relative px-5 py-4">
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            aria-label="Dismiss"
          >
            <X size={12} strokeWidth={3} />
          </button>

          {/* Platform promo — first-order message */}
          {showPlatform && (
            <div className="flex items-start gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <Gift size={18} className="text-white" />
              </div>
              <div className="flex-1 pr-6">
                <p className="text-[11px] font-black text-white/70 uppercase tracking-[0.2em] leading-none mb-1">
                  Limited Offer
                </p>
                <p className="text-[16px] font-black text-white leading-tight italic tracking-tight">
                  Your first order ships free!
                </p>
                <p className="text-[11px] text-white/80 font-semibold mt-1">
                  {platformPromo.slotsRemaining} of {platformPromo.totalSlots} spots remaining
                  {platformPromo.endsAt &&
                    ` · Ends ${new Date(platformPromo.endsAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                    })}`}
                </p>
              </div>
            </div>
          )}

          {/* Vendor promo count — secondary line */}
          {showVendor && (
            <div
              className={`flex items-center gap-2 ${
                showPlatform
                  ? "border-t border-white/20 pt-2 mt-1"
                  : ""
              }`}
            >
              {!showPlatform && (
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Bike size={18} className="text-white" />
                </div>
              )}
              <div className="flex-1">
                {!showPlatform && (
                  <p className="text-[11px] font-black text-white/70 uppercase tracking-[0.2em] leading-none mb-1">
                    Free Delivery
                  </p>
                )}
                <p
                  className={`font-bold text-white/90 ${
                    showPlatform ? "text-[12px]" : "text-[15px] italic tracking-tight font-black"
                  }`}
                >
                  <Sparkles
                    size={12}
                    className="inline mr-1 text-yellow-300"
                    fill="currentColor"
                  />
                  {vendorPromoCount} restaurant
                  {vendorPromoCount !== 1 ? "s" : ""} offering free delivery right now
                </p>
              </div>
              <Link
                href="/search"
                className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
              >
                Explore
                <ChevronRight size={12} strokeWidth={3} />
              </Link>
            </div>
          )}

          {/* CTA when only platform promo is active (no vendor promos) */}
          {showPlatform && !showVendor && (
            <div className="mt-3">
              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 bg-white text-orange-600 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-orange-50 transition-colors shadow-lg shadow-black/10"
              >
                Order Now
                <ChevronRight size={12} strokeWidth={3} />
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
