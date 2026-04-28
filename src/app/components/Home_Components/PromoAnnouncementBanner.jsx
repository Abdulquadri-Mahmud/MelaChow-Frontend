"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, ChevronRight, Bike, Zap, Star, LayoutGrid } from "lucide-react";
import { useActivePromos } from "@/app/hooks/useActivePromos";

/**
 * PromoAnnouncementBanner
 * A master-level, brand-aligned discovery surface for MelaChow promotions.
 * Uses the African pattern background and primary brand orange.
 */
export default function PromoAnnouncementBanner() {
  const { platformPromo, vendorPromoCount, hasAnyPromo, isLoading } = useActivePromos();

  const showPlatform = !!platformPromo;
  const showVendor = vendorPromoCount > 0;

  const handleCta = () => {
    if (showPlatform) {
      // Navigate to the all restaurants page.
      window.location.href = "/all-restaurants";
    } else {
      // Vendor promo — navigate to a pre-filtered vendor view.
      window.location.href = "/home?freeDelivery=true";
    }
  };

  if (isLoading || !hasAnyPromo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-3 rounded-[32px] overflow-hidden group border border-white/5 shadow-[0_25px_60px_-15px_rgba(244,133,37,0.2)] bg-zinc-950"
      >
        {/* Dynamic Mesh Background with Brand Color */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#f48525]/20 via-transparent to-transparent" />
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
              x: [-20, 20, -20]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] right-[-10%] w-[80%] h-[150%] bg-[#f48525]/10 rounded-full blur-[120px]"
          />
          {/* African Pattern Overlay */}
          <div className="absolute inset-0 bg-african-pattern opacity-[0.15] mix-blend-overlay" />
        </div>

        {/* Premium Shimmer Sweep */}
        <motion.div
          initial={{ x: "-150%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
          className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-transparent via-white/[0.03] to-transparent skew-x-12"
        />

        {/* Content Layout - Compacted */}
        <div className="relative z-20 px-5 py-4 md:px-8 md:py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            
            {/* Left: Discovery Message */}
            <div className="flex items-center gap-4">
              {/* Animated Icon Box - Scaled Down */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                className="relative shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-[#f48525] to-[#c2611a] p-[1.5px] shadow-2xl shadow-[#f48525]/30"
              >
                <div className="w-full h-full rounded-[15px] bg-zinc-950/40 backdrop-blur-xl flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {showPlatform ? (
                      <motion.div
                        key="gift"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <Gift size={24} className="text-white" strokeWidth={2.5} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="bike"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <Bike size={24} className="text-white" strokeWidth={2.5} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Floating Badge */}
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg border-2 border-zinc-950"
                >
                  <Star size={12} className="text-zinc-950 fill-zinc-950" />
                </motion.div>
              </motion.div>

              {/* Textual Narrative - Scaled Down */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#f48525]/10 border border-[#f48525]/20 text-[9px] font-black text-[#f48525] uppercase tracking-[0.2em]">
                    <Zap size={9} fill="currentColor" />
                    Premium
                  </span>
                  {showPlatform && (
                    <motion.span 
                      animate={{ opacity: [1, 0.6, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-zinc-500 text-[9px] font-black uppercase tracking-widest"
                    >
                      {platformPromo.slotsRemaining} Left
                    </motion.span>
                  )}
                </div>

                <h2 className="text-xl md:text-2xl font-black text-white leading-none tracking-tighter uppercase italic">
                  {showPlatform ? (
                    <>Unlock <span className="text-[#f48525]">Free</span> Delivery</>
                  ) : (
                    <><span className="text-[#f48525]">{vendorPromoCount}</span> Shops Nearby</>
                  )}
                </h2>
                
                <p className="text-[11px] md:text-xs font-bold text-zinc-400 max-w-[280px] leading-tight tracking-tight">
                  {showPlatform 
                    ? "Your first order from any restaurant is free delivery."
                    : "Top-rated restaurants near you offer free delivery."
                  }
                </p>
              </div>
            </div>

            {/* Right: CTA - Scaled Down */}
            <div className="flex items-center">
              <button
                onClick={handleCta}
                className="group/btn relative h-11 px-6 rounded-xl bg-white overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-95"
              >
                <div className="relative z-20 flex items-center justify-center gap-2">
                  <span className="text-zinc-950 font-black text-[11px] uppercase tracking-widest whitespace-nowrap">
                    Get Started
                  </span>
                  <div className="w-5 h-5 rounded-lg bg-zinc-950 flex items-center justify-center shrink-0 transition-transform duration-500 group-hover/btn:translate-x-0.5">
                    <ChevronRight size={14} className="text-white" strokeWidth={3} />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f48525]/10 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
              </button>
            </div>
          </div>

          {/* Dynamic Footer - Slimmer */}
          {showPlatform && (
            <div className="mt-4 flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                 <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em]">Live Slots</p>
                 <p className="text-[9px] font-black text-[#f48525] italic uppercase tracking-widest">
                   {Math.round((platformPromo.slotsRemaining / platformPromo.totalSlots) * 100)}% Available
                 </p>
              </div>
              <div className="h-[1.5px] w-full bg-zinc-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(platformPromo.slotsRemaining / platformPromo.totalSlots) * 100}%` }}
                  transition={{ duration: 2, ease: "circOut" }}
                  className="h-full bg-[#f48525]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Subtle decorative background detail */}
        <div className="absolute top-1/2 -right-10 -translate-y-1/2 opacity-[0.03] rotate-12 pointer-events-none">
           <LayoutGrid size={240} className="text-white" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
