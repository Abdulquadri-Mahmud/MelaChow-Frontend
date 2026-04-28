"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, ChevronRight, Bike, Zap, Star } from "lucide-react";
import { useActivePromos } from "@/app/hooks/useActivePromos";
import Link from "next/link";

/**
 * PromoAnnouncementBanner
 * A premium, non-dismissible discovery surface for active platform and vendor promos.
 */
export default function PromoAnnouncementBanner() {
  const { platformPromo, vendorPromoCount, hasAnyPromo, isLoading } = useActivePromos();

  if (isLoading || !hasAnyPromo) return null;

  const showPlatform = !!platformPromo;
  const showVendor = vendorPromoCount > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative mx-3 rounded-3xl overflow-hidden shadow-xl group border border-white/10"
      >
        {/* Brand Color Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 transition-transform duration-700 group-hover:scale-105" />

        {/* Animated Overlay Shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/10 rounded-full blur-3xl"
          />
        </div>

        {/* Content Container - Reduced Padding */}
        <div className="relative px-5 py-4 md:px-7 md:py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Left Section: Platform Promo */}
            <div className="flex-1 space-y-3">
              {showPlatform && (
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-white/20 blur-md rounded-full" />
                    <div className="relative w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                      <Gift size={20} className="text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/30 border border-white/10">
                        <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Live</span>
                      </div>
                      <span className="text-white/80 text-[9px] font-black uppercase tracking-[0.15em]">
                        {platformPromo.slotsRemaining} Slots Left
                      </span>
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-white leading-tight tracking-tight">
                      First Order <span className="text-white italic underline decoration-yellow-300 underline-offset-4">Ships Free</span>
                    </h3>
                  </div>
                </div>
              )}

              {/* Vendor Promo Line */}
              {showVendor && (
                <div className={`flex items-center gap-2.5 ${showPlatform ? "pt-1" : ""}`}>
                  {!showPlatform && (
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center border border-white/20 shadow-lg">
                      <Bike size={18} className="text-white" />
                    </div>
                  )}
                  <p className="text-xs md:text-sm font-bold text-white/90 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-yellow-300 fill-yellow-300" />
                    {vendorPromoCount} Restaurant{vendorPromoCount > 1 ? "s" : ""} Near You
                    <span className="text-white/60 font-medium">·</span>
                    <span className="text-white font-black italic">Free Delivery</span>
                  </p>
                </div>
              )}
            </div>

            {/* Right Section: Action - Smaller Button */}
            <div className="flex items-center">
              <Link
                href="/search"
                className="group/btn relative inline-flex items-center gap-2 bg-white text-orange-600 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 hover:shadow-lg hover:shadow-orange-950/20 active:scale-95"
              >
                Claim Now
                <ChevronRight size={14} className="transition-transform duration-300 group-hover/btn:translate-x-0.5" strokeWidth={3} />
              </Link>
            </div>

          </div>

          {/* Progress Bar - Thinner */}
          {showPlatform && (
            <div className="mt-4 h-0.5 w-full bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(platformPromo.slotsRemaining / platformPromo.totalSlots) * 100}%` }}
                transition={{ duration: 1.2, ease: "circOut" }}
                className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
