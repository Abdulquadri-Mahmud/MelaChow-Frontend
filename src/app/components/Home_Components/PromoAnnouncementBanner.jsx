"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bike, Gift, Store, TicketPercent } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useActivePromos } from "@/app/hooks/useActivePromos";

const formatCampaignName = (name) => {
  if (!name) return "Free delivery";
  return String(name).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatWindow = (value) => {
  if (!value) return "Limited time";
  return new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
};

const platformText = (promo, used) => {
  if (used) return "You have used this offer. More restaurant deals may still be available.";
  const remaining = Number(promo?.slotsRemaining || 0).toLocaleString();
  const total = Number(promo?.totalSlots || 0).toLocaleString();
  return `${remaining} of ${total} free deliveries left.`;
};

export default function PromoAnnouncementBanner() {
  const router = useRouter();
  const railRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const {
    platformPromo,
    platformPromoUsed,
    vendorPromos,
    hasAnyPromo,
    isLoading,
  } = useActivePromos();

  const slides = useMemo(() => {
    const nextSlides = [];

    if (platformPromo) {
      nextSlides.push({
        id: `platform-${platformPromo.promoId || "active"}`,
        type: "platform",
        label: "Free delivery",
        title: formatCampaignName(platformPromo.name),
        body: platformText(platformPromo, platformPromoUsed),
        meta: `${Number(platformPromo.slotsRemaining || 0).toLocaleString()} slots left`,
        endsAt: platformPromo.endsAt,
        href: "/home?promo=free-delivery&freeDelivery=true#vendor-list-anchor",
      });
    }

    (vendorPromos || []).forEach((promo) => {
      const remaining =
        promo.remainingOrders == null
          ? "Limited slots"
          : `${Number(promo.remainingOrders || 0).toLocaleString()} orders left`;

      nextSlides.push({
        id: `vendor-${promo.promoId || promo.vendorId}`,
        type: "vendor",
        label: "Free delivery",
        title: promo.adminNote || `Free delivery at ${promo.vendorName || "this restaurant"}`,
        body: promo.vendorName ? `Order from ${promo.vendorName}` : "Tap to order now",
        meta: remaining,
        city: promo.city,
        endsAt: promo.endsAt,
        logo: promo.vendorLogo,
        href: promo.vendorId ? `/restaurants/${promo.vendorId}` : "/all-restaurants",
      });
    });

    return nextSlides;
  }, [platformPromo, platformPromoUsed, vendorPromos]);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !rail.children[activeIndex]) return;
    rail.children[activeIndex].scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeIndex]);

  if (isLoading || !hasAnyPromo || slides.length === 0) return null;

  return (
    <section className="overflow-hidden">
      <div
        ref={railRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth"
        onScroll={(event) => {
          const rail = event.currentTarget;
          const nextIndex = Math.round(rail.scrollLeft / Math.max(1, rail.clientWidth * 0.88));
          if (nextIndex >= 0 && nextIndex < slides.length) setActiveIndex(nextIndex);
        }}
      >
        {slides.map((slide, index) => {
          const isVendor = slide.type === "vendor";
          const Icon = isVendor ? Bike : Gift;

          return (
            <motion.button
              key={slide.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(slide.href)}
              className={`relative overflow-hidden min-w-[82%] snap-center rounded-2xl px-3.5 py-3.5 text-left transition-all duration-300 sm:min-w-[340px] border shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.18)] ${
                isVendor
                  ? "bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border-zinc-800/80 text-white"
                  : "bg-gradient-to-br from-[#FF5100] via-[#FF6B00] to-[#E04400] border-orange-400/30 text-white"
              }`}
            >
              {/* Subtle background glow design element */}
              <div className={`absolute -right-6 -top-6 w-16 h-16 rounded-full blur-2xl opacity-30 pointer-events-none ${
                isVendor ? "bg-orange-500" : "bg-white"
              }`} />

              <div className="relative z-10 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                  {isVendor && slide.logo ? (
                    <img src={slide.logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon size={20} className="text-white drop-shadow-sm" />
                  )}
                </div>
 
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 text-[8px] font-black uppercase tracking-[0.15em] text-white/90">
                      {isVendor ? <Store size={9} strokeWidth={3.5} /> : <TicketPercent size={9} strokeWidth={3.5} />}
                      {slide.label}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm font-black leading-tight tracking-tight drop-shadow-sm">
                    {slide.title}
                  </p>
                  <p className="mt-1 truncate text-[11px] font-bold text-white/80">
                    {slide.body}
                    {slide.city ? ` - ${slide.city}` : ""}
                  </p>
                </div>
 
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 shadow-md ${
                  isVendor 
                    ? "bg-[#FF6600] text-white shadow-orange-600/20" 
                    : "bg-zinc-950 text-white shadow-zinc-950/20"
                }`}>
                  <ArrowRight size={14} className="stroke-[3]" />
                </div>
              </div>
 
              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/10 pt-2.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/60">
                <span className={`flex items-center gap-1.5 font-extrabold ${isVendor ? "text-orange-400" : "text-white"}`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${isVendor ? "bg-orange-500" : "bg-white"} animate-pulse`} />
                  {slide.meta}
                </span>
                <span className="shrink-0 opacity-80">Ends {formatWindow(slide.endsAt)}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {slides.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={`${slide.id}-dot`}
              type="button"
              aria-label={`Show promo ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                activeIndex === index ? "w-5 bg-orange-500" : "w-1.5 bg-zinc-300 dark:bg-zinc-700"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
