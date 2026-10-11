"use client";

import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function AuthFrame({ subtitle, children }) {
  return (
    <main className="auth-page relative min-h-[100dvh] overflow-x-hidden bg-[#fffaf4] pb-[env(safe-area-inset-bottom)] text-slate-900">
      <header className="auth-brand relative h-[clamp(210px,32dvh,280px)] overflow-hidden bg-orange-500 px-4 pt-3 text-center text-white">
        <span className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-white/10" />
        <button type="button" aria-label="Go back" onClick={() => window.history.back()} className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white">
          <ArrowLeft size={19} />
        </button>
        <div className="relative mx-auto mt-7 flex h-[clamp(72px,11dvh,94px)] w-[clamp(72px,11dvh,94px)] items-center justify-center overflow-hidden rounded-[22px] bg-white shadow-lg">
          <Image src="/logo.jpeg" alt="MelaChow logo" width={112} height={112} priority className="h-full w-full object-contain p-2" />
        </div>
        <h1 className="relative mt-3 text-[clamp(25px,4dvh,32px)] font-medium tracking-tight">MELA<span className="font-light">CHOW</span></h1>
        <p className="relative mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75">{subtitle}</p>
      </header>
      <section className="relative mx-auto -mt-7 mb-4 w-[calc(100%-24px)] max-w-[480px] rounded-[26px] border border-orange-950/5 bg-white px-4 py-5 shadow-[0_4px_8px_rgba(30,20,10,0.18)] sm:px-8">
        {children}
      </section>
    </main>
  );
}

export const authInputClass = "min-w-0 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 placeholder:text-slate-400";
export const authLabelClass = "mb-1 ml-1 block text-sm font-semibold text-slate-800";
