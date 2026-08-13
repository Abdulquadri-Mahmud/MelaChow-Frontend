"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";

const fetchBanners = async () => {
  const { data } = await axios.get("/api/banners/public", { timeout: 10000 });
  if (!data?.success) throw new Error("Banner request failed");
  return data.banners || [];
};

export default function DynamicBannerCarousel({ fallback: Fallback }) {
  const router = useRouter();
  const rail = useRef(null);
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { data: banners, isLoading } = useQuery({
    queryKey: ["public-banners"],
    queryFn: fetchBanners,
    staleTime: 300000,
    retry: false,
  });

  // Auto-play timer with pause-on-hover/touch
  useEffect(() => {
    if (
      !banners ||
      banners.length < 2 ||
      isPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const timer = window.setInterval(() => {
      const el = rail.current;
      if (!el) return;
      const next = (active + 1) % banners.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
      setActive(next);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners, active, isPaused]);

  if (isLoading) {
    return (
      <div className="relative h-[172px] w-full overflow-hidden rounded-[26px] bg-slate-200 dark:bg-slate-800 animate-pulse sm:h-48">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent animate-shimmer" />
        <div className="p-6 space-y-3 max-w-[65%]">
          <div className="h-4 w-20 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="h-6 w-48 rounded-xl bg-slate-300 dark:bg-slate-700" />
          <div className="h-3 w-36 rounded-lg bg-slate-300 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  if (!banners?.length) return <Fallback />;

  const scrollTo = (index) => {
    const el = rail.current;
    if (!el) return;
    const targetIndex = (index + banners.length) % banners.length;
    el.scrollTo({ left: targetIndex * el.clientWidth, behavior: "smooth" });
    setActive(targetIndex);
  };

  return (
    <section
      className="group relative overflow-hidden rounded-[26px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Banner Carousel Track */}
      <div
        ref={rail}
        onScroll={(e) =>
          setActive(
            Math.round(
              e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)
            )
          )
        }
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        aria-label="Featured promotions"
      >
        {banners.map((b) => {
          const hasImage = !!(b.mobileImageUrl || b.imageUrl);
          const imageOnly = b.contentStyle === "image";
          const background = b.backgroundGradient
            ? `linear-gradient(${b.backgroundGradient.direction || "to right"}, ${b.backgroundGradient.from}, ${b.backgroundGradient.to})`
            : b.backgroundColor || "#ef5b0c";

          return (
            <button
              key={b._id}
              type="button"
              onClick={() => b.ctaLink && router.push(b.ctaLink)}
              className="relative h-[172px] min-w-full snap-center overflow-hidden rounded-[26px] p-4 text-left text-white shadow-lg sm:h-48 sm:p-6 transition-all duration-300 group/card cursor-pointer"
              style={{ background }}
              aria-label={b.ctaText ? `${b.title}: ${b.ctaText}` : b.title}
            >
              {/* Background Image with Zoom effect */}
              {hasImage && (
                <img
                  src={b.mobileImageUrl || b.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                />
              )}

              {/* Gradient Mask for High Contrast */}
              {hasImage && (
                <div
                  className={`absolute inset-0 transition-opacity ${
                    imageOnly
                      ? "bg-gradient-to-r from-black/85 via-black/55 to-black/20"
                      : "bg-gradient-to-r from-black/70 via-black/30 to-black/10 backdrop-blur-[1px]"
                  }`}
                />
              )}

              {/* Decorative Subtle Background Particle Glow */}
              <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />

              {/* Content Box */}
              <div className="relative z-10 flex h-full max-w-[82%] sm:max-w-[70%] flex-col justify-between">
                <div>
                  {b.bannerType && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/95 backdrop-blur-md border border-white/20 shadow-sm">
                      <Sparkles size={10} className="text-amber-300" />
                      {b.bannerType}
                    </span>
                  )}

                  <h2 className="mt-2 line-clamp-2 text-xl sm:text-2xl font-black leading-tight tracking-tight drop-shadow-md">
                    {b.title}
                  </h2>

                  {(b.description || b.subtitle) && (
                    <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-white/90 drop-shadow">
                      {b.description || b.subtitle}
                    </p>
                  )}
                </div>

                {b.ctaText && (
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-black text-slate-950 shadow-md transition-all group-hover/card:bg-orange-50 group-hover/card:shadow-orange-500/20 group-hover/card:scale-[1.03]">
                      {b.ctaText}
                      <ArrowRight size={13} className="transition-transform group-hover/card:translate-x-1" />
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Desktop Prev/Next Nav Controls (Visible on hover) */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollTo(active - 1)}
            aria-label="Previous banner"
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 hover:scale-110 active:scale-95 shadow-lg hidden sm:flex"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={() => scrollTo(active + 1)}
            aria-label="Next banner"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 hover:scale-110 active:scale-95 shadow-lg hidden sm:flex"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Pagination Dot Indicators */}
      {banners.length > 1 && (
        <div className="mt-2.5 flex justify-center items-center gap-1.5">
          {banners.map((b, index) => (
            <button
              key={b._id}
              onClick={() => scrollTo(index)}
              aria-label={`Show banner ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                active === index
                  ? "w-6 bg-orange-500 shadow-sm shadow-orange-500/50"
                  : "w-1.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}