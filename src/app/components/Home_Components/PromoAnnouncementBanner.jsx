"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Bike,
  Building2,
  CalendarClock,
  Gift,
  Store,
  TicketPercent,
  Zap,
} from "lucide-react";
import { useActivePromos } from "@/app/hooks/useActivePromos";

const formatDate = (value) => {
  if (!value) return "Limited time";
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
};

const formatCampaignName = (name) => {
  if (!name) return "Free delivery campaign";
  return name.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function PromoAnnouncementBanner() {
  const {
    platformPromo,
    platformPromoUsed,
    vendorPromoCount,
    vendorPromos,
    hasAnyPromo,
    isLoading,
  } = useActivePromos();

  if (isLoading || !hasAnyPromo) return null;

  const showPlatform = !!platformPromo;
  const totalSlots = Number(platformPromo?.totalSlots || 0);
  const slotsRemaining = Number(platformPromo?.slotsRemaining || 0);
  const percentRemaining = totalSlots > 0
    ? Math.max(0, Math.min(100, (slotsRemaining / totalSlots) * 100))
    : 0;
  const featuredVendors = (vendorPromos || []).slice(0, 3);
  const endDate = showPlatform ? platformPromo?.endsAt : featuredVendors[0]?.endsAt;

  const handleCta = () => {
    const params = new URLSearchParams();
    params.set("promo", "free-delivery");
    params.set("freeDelivery", "true");
    window.location.href = `/home?${params.toString()}#vendor-list-anchor`;
  };

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[18px] border border-orange-200/70 bg-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-zinc-900"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-500" />

        <div className="relative p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20">
              {showPlatform ? <Gift size={23} strokeWidth={2.5} /> : <Bike size={23} strokeWidth={2.5} />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white dark:bg-white dark:text-zinc-950">
                  <TicketPercent size={10} />
                  Free delivery
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-orange-700 ring-1 ring-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/20">
                  {showPlatform ? <Building2 size={10} /> : <Store size={10} />}
                  {showPlatform ? "MelaChow sponsored" : "Restaurant sponsored"}
                </span>
              </div>

              <h2 className="text-xl font-black leading-tight tracking-tight text-zinc-950 dark:text-white">
                {showPlatform
                  ? formatCampaignName(platformPromo.name)
                  : `${vendorPromoCount} free-delivery restaurant${vendorPromoCount === 1 ? "" : "s"} near you`}
              </h2>

              <p className="mt-1 max-w-[34rem] text-xs font-semibold leading-relaxed text-zinc-500 dark:text-zinc-400">
                {showPlatform
                  ? platformPromoUsed
                    ? "You have already used this platform offer. Restaurant-sponsored free delivery may still be available."
                    : `MelaChow covers delivery for eligible orders while ${slotsRemaining.toLocaleString()} of ${totalSlots.toLocaleString()} slots remain.`
                  : "Participating restaurants are covering delivery fees during their sponsorship windows."}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-2xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-100 dark:bg-white/5 dark:ring-white/10">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Sponsor</p>
              <p className="mt-1 truncate text-xs font-black text-zinc-900 dark:text-white">
                {showPlatform ? "MelaChow" : "Restaurants"}
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-100 dark:bg-white/5 dark:ring-white/10">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Eligible</p>
              <p className="mt-1 text-xs font-black text-zinc-900 dark:text-white">
                {vendorPromoCount > 0 ? `${vendorPromoCount} stores` : "Checkout"}
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-100 dark:bg-white/5 dark:ring-white/10">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Ends</p>
              <p className="mt-1 flex items-center gap-1 text-xs font-black text-zinc-900 dark:text-white">
                <CalendarClock size={12} className="text-orange-500" />
                {formatDate(endDate)}
              </p>
            </div>
            <button
              onClick={handleCta}
              className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-orange-500/20 transition active:scale-[0.98]"
            >
              View deals
              <ArrowRight size={14} />
            </button>
          </div>

          {showPlatform && totalSlots > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Platform slots remaining</span>
                <span className="text-[10px] font-black text-orange-600 dark:text-orange-400">{Math.round(percentRemaining)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentRemaining}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-orange-500"
                />
              </div>
            </div>
          )}

          {featuredVendors.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {featuredVendors.map((promo) => (
                <span
                  key={promo.promoId}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"
                >
                  <Zap size={11} fill="currentColor" />
                  <span className="truncate">{promo.vendorName}</span>
                  {promo.remainingOrders != null && (
                    <span className="text-emerald-500">({promo.remainingOrders} left)</span>
                  )}
                </span>
              ))}
              {vendorPromoCount > featuredVendors.length && (
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-black text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
                  +{vendorPromoCount - featuredVendors.length} more
                </span>
              )}
            </div>
          )}
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
