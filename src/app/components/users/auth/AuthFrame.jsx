"use client";

import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function AuthFrame({ subtitle, children }) {
  return (
    <main className="auth-page relative min-h-[100dvh] overflow-x-hidden bg-[#fffaf4] text-slate-900">
      <header className="auth-brand relative h-[365px] overflow-hidden bg-orange-500 px-6 pt-8 text-center text-white">
        <span className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-white/10" />
        <button type="button" aria-label="Go back" onClick={() => window.history.back()} className="absolute left-6 top-7 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white">
          <ArrowLeft size={22} />
        </button>
        <div className="relative mx-auto mt-12 flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-[30px] bg-white shadow-lg">
          <Image src="/logo.jpeg" alt="MelaChow logo" width={112} height={112} priority className="h-full w-full object-contain p-2" />
        </div>
        <h1 className="relative mt-4 text-[38px] font-medium tracking-tight">MELA<span className="font-light">CHOW</span></h1>
        <p className="relative mt-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/75">{subtitle}</p>
      </header>
      <section className="relative mx-auto -mt-11 mb-8 w-[calc(100%-32px)] max-w-[560px] rounded-[34px] border border-orange-950/5 bg-white px-6 py-8 shadow-[0_4px_8px_rgba(30,20,10,0.18)] sm:px-10">
        {children}
      </section>
    </main>
  );
}

export const authInputClass = "w-full rounded-[20px] border-2 border-stone-200 bg-white px-5 py-[18px] text-base font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 placeholder:text-slate-400";
export const authLabelClass = "mb-2 ml-1 block text-sm font-semibold text-slate-800";
