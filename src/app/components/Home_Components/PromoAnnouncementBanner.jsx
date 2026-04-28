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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative mx-3 rounded-[28px] overflow-hidden shadow-2xl group border border-white/10"
      >
        {/* Premium Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 transition-transform duration-700 group-hover:scale-110" />

        {/* Animated Overlay Shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              rotate: [360, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-indigo-400/10 rounded-full blur-3xl"
          />
        </div>

        {/* Content Container */}
        <div className="relative px-6 py-6 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Left Section: Platform Promo */}
            <div className="flex-1 space-y-4">
              {showPlatform && (
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 blur-lg rounded-full" />
                    <div className="relative w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                      <Gift size={24} className="text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[9px] font-black text-red-200 uppercase tracking-widest">Live</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/10">
                        Limited Time
                      </span>
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="flex items-center gap-1 text-white/80 text-[10px] font-bold"
                      >
                        <Zap size={10} fill="currentColor" />
                        {platformPromo.slotsRemaining} left
                      </motion.div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-white leading-none tracking-tight">
                      First Order <span className="text-yellow-300 italic">Ships Free</span>
                    </h3>
                  </div>
                </div>
              )}

              {/* Vendor Promo Line */}
              {showVendor && (
                <div className={`flex items-center gap-3 ${showPlatform ? "pt-2" : ""}`}>
                  {!showPlatform && (
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/20 shadow-lg">
                      <Bike size={20} className="text-white" />
                    </div>
                  )}
                  <p className="text-sm md:text-base font-bold text-white/90 flex items-center gap-2">
                    <Star size={14} className="text-yellow-300 fill-yellow-300" />
                    {vendorPromoCount} Top Restaurant{vendorPromoCount > 1 ? "s" : ""}
                    <span className="text-white/60 font-medium">·</span>
                    <span className="text-indigo-100 italic">Free Delivery Active</span>
                  </p>
                </div>
              )}
            </div>

            {/* Right Section: Action */}
            <div className="flex items-center gap-4">
              <Link
                href="/search"
                className="group/btn relative inline-flex items-center gap-3 bg-white text-indigo-600 px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 hover:bg-indigo-50 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] active:scale-95"
              >
                Claim Offer
                <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
                  <ChevronRight size={18} className="transition-transform duration-300 group-hover/btn:translate-x-1" strokeWidth={3} />
                </div>
              </Link>
            </div>

          </div>

          {/* Progress Bar (Optional Visual Enhancement for Platform Promo) */}
          {showPlatform && (
            <div className="mt-5 h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(platformPromo.slotsRemaining / platformPromo.totalSlots) * 100}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full bg-gradient-to-r from-yellow-300 to-white shadow-[0_0_10px_rgba(253,224,71,0.5)]"
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
