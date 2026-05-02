"use client";

import Link from "next/link";
import { ShieldCheck, TicketPercent } from "lucide-react";

export default function VendorCouponsPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center p-4">
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10">
          <TicketPercent size={26} />
        </div>
        <h1 className="text-xl font-black uppercase tracking-tight text-zinc-950 dark:text-white">
          Coupons Are Admin Managed
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
          Coupon creation, updates, activation, deactivation, and deletion are handled by MelaChow admins to keep promo rules and customer usage limits consistent.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-600">
          <ShieldCheck size={15} />
          Secure platform controls
        </div>
        <Link
          href="/vendors/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-5 text-[11px] font-black uppercase tracking-widest text-white dark:bg-white dark:text-zinc-950"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
