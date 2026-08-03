"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchBanners = async () => { const { data } = await axios.get("/api/banners/public", { timeout: 10000 }); if (!data?.success) throw new Error("Banner request failed"); return data.banners || []; };
export default function DynamicBannerCarousel({ fallback: Fallback }) {
  const router = useRouter(), rail = useRef(null);
  const { data: banners, isLoading } = useQuery({ queryKey:["public-banners"], queryFn:fetchBanners, staleTime:300000, retry:false });
  useEffect(()=>{ if (!banners || banners.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; const timer=window.setInterval(()=>{const el=rail.current;if(!el)return; const next=(Math.round(el.scrollLeft/el.clientWidth)+1)%banners.length;el.scrollTo({left:next*el.clientWidth,behavior:"smooth"});},5000); return()=>clearInterval(timer);},[banners]);
  if (isLoading) return <div className="h-44 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />;
  if (!banners?.length) return <Fallback />;
  return <section className="overflow-hidden"><div ref={rail} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto" aria-label="Featured promotions">{banners.map((b)=><button key={b._id} type="button" onClick={()=>b.ctaLink&&router.push(b.ctaLink)} className="relative h-44 min-w-full snap-center overflow-hidden rounded-3xl p-6 text-left text-white shadow-xl" style={{background:b.backgroundGradient?`linear-gradient(${b.backgroundGradient.direction||"to right"}, ${b.backgroundGradient.from}, ${b.backgroundGradient.to})`:b.backgroundColor||"#ff5100"}} aria-label={b.ctaText ? `${b.title}: ${b.ctaText}` : b.title}>{b.imageUrl&&<img src={b.mobileImageUrl||b.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover"/>}{b.imageUrl&&b.contentStyle!=="image"&&<div className="absolute inset-0 bg-black/35"/>}<div className="relative z-10 max-w-[75%]"><p className="text-xs font-black uppercase tracking-widest">{b.bannerType}</p><h2 className="mt-2 text-2xl font-black leading-tight">{b.title}</h2>{b.subtitle&&<p className="mt-1 text-sm font-semibold">{b.subtitle}</p>}{b.ctaText&&<span className="mt-4 inline-block rounded-full bg-white px-4 py-2 text-xs font-black text-slate-900">{b.ctaText}</span>}</div></button>)}</div>{banners.length>1&&<div className="mt-2 flex justify-center gap-1.5">{banners.map((b)=><span key={b._id} className="h-1.5 w-1.5 rounded-full bg-orange-500" />)}</div>}</section>;
}
