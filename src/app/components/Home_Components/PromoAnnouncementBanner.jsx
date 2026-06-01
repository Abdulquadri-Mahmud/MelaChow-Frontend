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
  if (used) return "You have used this platform offer. Restaurant-sponsored free delivery may still be available.";
  const remaining = Number(promo?.slotsRemaining || 0).toLocaleString();
  const total = Number(promo?.totalSlots || 0).toLocaleString();
  return `MelaChow covers delivery while ${remaining} of ${total} slots remain.`;
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
        label: "MelaChow sponsored",
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
        label: "Restaurant sponsored",
        title: promo.adminNote || `Free delivery at ${promo.vendorName || "this restaurant"}`,
        body: promo.vendorName || "Selected restaurant",
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
    <section className="overflow-hidden rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-orange-100 dark:bg-zinc-900 dark:ring-white/10">
      <div
        ref={railRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1"
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
              className={`min-w-[86%] snap-center rounded-2xl px-3 py-3 text-left shadow-md transition sm:min-w-[360px] ${
                isVendor
                  ? "bg-zinc-950 text-white shadow-zinc-950/15"
                  : "bg-orange-500 text-white shadow-orange-500/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 ring-1 ring-white/15">
                  {isVendor && slide.logo ? (
                    <img src={slide.logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon size={22} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-1.5">
                    {isVendor ? <Store size={12} /> : <TicketPercent size={12} />}
                    <span className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-white/75">
                      {slide.label}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-base font-black leading-tight">
                    {slide.title}
                  </p>
                  <p className="mt-1 truncate text-[11px] font-bold text-white/75">
                    {slide.body}
                    {slide.city ? ` - ${slide.city}` : ""}
                  </p>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-zinc-950">
                  <ArrowRight size={17} />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/70">
                <span className="truncate">{slide.meta}</span>
                <span className="shrink-0">Ends {formatWindow(slide.endsAt)}</span>
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
