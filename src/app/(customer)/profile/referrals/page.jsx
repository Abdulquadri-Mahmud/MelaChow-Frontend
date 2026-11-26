"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Gift,
  Loader2,
  Share2,
  Sparkles,
  Tag,
  Ticket,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import Header2 from "@/app/components/App_Header/Header2";
import ProtectedRoute from "@/app/components/protected-route/ProtectedRoute";
import { applyReferralCode, getMyReferrals } from "@/app/lib/referralApi";

function formatNaira(amount) {
  return `₦${Number(amount || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function formatTimeRemaining(isoDate, nowMs) {
  if (!isoDate) return null;
  const target = new Date(isoDate).getTime();
  if (Number.isNaN(target)) return null;
  const diffSec = Math.max(0, Math.floor((target - nowMs) / 1000));
  if (diffSec === 0) return "Expired";
  const days = Math.floor(diffSec / 86400);
  const hrs = Math.floor((diffSec % 86400) / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  if (days > 0) return `${days}d ${hrs}h left`;
  if (hrs > 0) return `${hrs}h ${mins}m left`;
  return `${mins}m left`;
}

function statusMeta(status) {
  switch (status) {
    case "rewarded":
      return {
        label: "Rewarded",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
      };
    case "pending_review":
      return {
        label: "Under Review",
        badge: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
      };
    case "attributed":
    case "order_placed":
      return {
        label: "Awaiting First Order",
        badge: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
      };
    case "rejected_fraud":
      return {
        label: "Ineligible",
        badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
      };
    default:
      return {
        label: "Expired",
        badge: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
      };
  }
}

export default function CustomerReferralsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [copiedType, setCopiedType] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [applyingCode, setApplyingCode] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ["customer-referrals"],
    queryFn: getMyReferrals,
    staleTime: 30 * 1000,
  });

  const payload = res?.data || null;
  const config = payload?.config || {
    enabled: true,
    rewardMode: "one_sided",
    referrerRewardNaira: 100,
    refereeRewardNaira: 0,
    minOrderSubtotalNaira: 2500,
    creditExpiryDays: 2,
    attributionExpiryDays: 2,
  };

  const filteredReferrals = useMemo(() => {
    const list = payload?.referrals || [];
    if (activeTab === "all") return list;
    if (activeTab === "pending") {
      return list.filter((r) => ["attributed", "order_placed", "pending_review"].includes(r.status));
    }
    if (activeTab === "rewarded") return list.filter((r) => r.status === "rewarded");
    return list.filter((r) => ["expired", "rejected_fraud"].includes(r.status));
  }, [payload?.referrals, activeTab]);

  const handleCopy = async (text, type) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      toast.success(type === "code" ? "Referral code copied!" : "Referral link copied!");
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const shareText = payload
    ? `Order delicious meals on MelaChow! Sign up with my referral code ${payload.code} and complete your first ₦${config.minOrderSubtotalNaira.toLocaleString("en-NG")}+ order within ${config.attributionExpiryDays} days: ${payload.shareLink}`
    : "";

  const handleNativeShare = async () => {
    if (!payload) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Join me on MelaChow",
          text: shareText,
          url: payload.shareLink,
        });
        return;
      } catch {
        // User cancelled or unsupported
      }
    }
    handleCopy(payload.shareLink, "link");
  };

  const handleWhatsAppShare = () => {
    if (!shareText) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
  };

  const handleApplyManualCode = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setApplyingCode(true);
    try {
      const result = await applyReferralCode(manualCode);
      toast.success(result?.message || "Referral code applied!");
      setManualCode("");
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not apply referral code");
    } finally {
      setApplyingCode(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-zinc-50 pb-28 dark:bg-zinc-950">
        <Header2 />

        <div className="mx-auto max-w-2xl space-y-5 px-4 pt-4">
          {/* Top Back Bar */}
          <div className="flex items-center justify-between">
            <Link
              href="/profile"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <ArrowLeft size={15} />
              Back to Profile
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
              <Gift size={13} />
              Invite &amp; Earn
            </span>
          </div>

          {isLoading ? (
            <div className="flex min-h-[45vh] flex-col items-center justify-center gap-3 text-zinc-500">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <p className="text-sm font-medium">Loading your referral rewards…</p>
            </div>
          ) : isError || !payload ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <AlertTriangle size={28} className="mx-auto text-amber-500" />
              <h2 className="mt-3 text-base font-bold text-zinc-900 dark:text-white">
                Couldn&apos;t load your referral rewards
              </h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Please check your connection and try again.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 inline-flex min-h-[42px] items-center justify-center rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Hero Banner Card */}
              <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 p-6 text-white shadow-lg">
                <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
                <div className="relative space-y-4">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                    <Sparkles size={13} />
                    {config.enabled ? "MelaChow Referral Rewards" : "Program Currently Paused"}
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      Invite friends, earn {formatNaira(config.referrerRewardNaira)} credit
                    </h1>
                    <p className="mt-1.5 text-sm leading-relaxed text-orange-50">
                      Share your unique code. When a new friend completes their first delivered food order of{" "}
                      <strong>{formatNaira(config.minOrderSubtotalNaira)}+</strong> within{" "}
                      <strong>{config.attributionExpiryDays} days</strong>, you receive{" "}
                      <strong>{formatNaira(config.referrerRewardNaira)}</strong> in MelaChow food credits immediately upon delivery.
                    </p>
                  </div>

                  {/* Available Credits Pill Box */}
                  <div className="grid grid-cols-2 gap-3 rounded-2xl bg-black/15 p-4 backdrop-blur-md">
                    <div>
                      <p className="text-[11px] font-medium text-orange-100">Available Credits</p>
                      <p className="mt-0.5 text-2xl font-bold tabular-nums">
                        {formatNaira(payload.credits.availableNaira)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-orange-100/90">
                        {payload.credits.earliestExpiryAt
                          ? `Next expiry: ${formatTimeRemaining(payload.credits.earliestExpiryAt, nowMs)}`
                          : "Food subtotal only"}
                      </p>
                    </div>
                    <div className="border-l border-white/15 pl-3">
                      <p className="text-[11px] font-medium text-orange-100">Total Earned</p>
                      <p className="mt-0.5 text-2xl font-bold tabular-nums">
                        {formatNaira(payload.credits.totalEarnedNaira)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-orange-100/90 tabular-nums">
                        {payload.stats.rewardedCount} successful invite{payload.stats.rewardedCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Share Your Code & Link Card */}
              <section className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                      Your Referral Code
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Credits are valid for {config.creditExpiryDays} days and apply to food subtotals at checkout.
                    </p>
                  </div>
                  {!payload.isActive && (
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                      Disabled
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/60 px-4 py-3.5 dark:border-orange-500/40 dark:bg-orange-500/10">
                  <span className="font-mono text-xl font-extrabold tracking-wider text-orange-700 dark:text-orange-300">
                    {payload.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(payload.code, "code")}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-700"
                  >
                    {copiedType === "code" ? <Check size={14} /> : <Copy size={14} />}
                    {copiedType === "code" ? "Copied" : "Copy Code"}
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <Share2 size={14} />
                    Share on WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(payload.shareLink, "link")}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {copiedType === "link" ? <Check size={14} /> : <Copy size={14} />}
                    {copiedType === "link" ? "Link Copied" : "Copy Invite Link"}
                  </button>
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <Share2 size={14} />
                    More Options
                  </button>
                </div>
              </section>

              {/* How It Works */}
              <section className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-sm font-bold text-zinc-950 dark:text-white">How It Works</h2>
                <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
                      1
                    </span>
                    <p className="mt-2 text-xs font-bold text-zinc-900 dark:text-white">Share your link</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                      Your friend signs up using your referral code or link.
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
                      2
                    </span>
                    <p className="mt-2 text-xs font-bold text-zinc-900 dark:text-white">
                      First {formatNaira(config.minOrderSubtotalNaira)}+ order
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                      They complete a verified order within {config.attributionExpiryDays} days.
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                      3
                    </span>
                    <p className="mt-2 text-xs font-bold text-zinc-900 dark:text-white">
                      Get {formatNaira(config.referrerRewardNaira)} credit
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                      Credited upon delivery. Spend on food within {config.creditExpiryDays} days.
                    </p>
                  </div>
                </div>
              </section>

              {/* Apply Friend's Code (for new customers who didn't enter one at signup) */}
              {!payload.myAttribution && (
                <section className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <Tag size={15} className="text-orange-600 dark:text-orange-400" />
                    <h2 className="text-sm font-bold text-zinc-950 dark:text-white">
                      Were you invited by a friend?
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Enter their referral code before placing your first order.
                  </p>
                  <form onSubmit={handleApplyManualCode} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      placeholder="e.g. CHOW-7K4P"
                      className="h-11 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 font-mono text-sm font-semibold uppercase text-zinc-900 placeholder:font-sans placeholder:font-normal placeholder:normal-case dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={applyingCode || !manualCode.trim()}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-orange-600 dark:hover:bg-orange-700"
                    >
                      {applyingCode ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                    </button>
                  </form>
                </section>
              )}

              {/* Active Credit Grants */}
              {payload.credits.history?.length > 0 && (
                <section className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                      Reward Credit Ledger
                    </h2>
                    <span className="text-xs font-medium text-zinc-500 tabular-nums">
                      Used: {formatNaira(payload.credits.totalUsedNaira)}
                    </span>
                  </div>
                  <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
                    {payload.credits.history.slice(0, 10).map((grant) => (
                      <div key={grant.id} className="flex items-center justify-between gap-3 py-3 text-xs">
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-white">
                            {grant.source === "admin_grant" ? "Bonus Credit" : "Referral Reward Credit"}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                            <Clock size={11} />
                            {grant.status === "active"
                              ? formatTimeRemaining(grant.expiresAt, nowMs)
                              : `Status: ${grant.status}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                            {formatNaira(grant.status === "active" ? grant.remainingAmountNaira : grant.originalAmountNaira)}
                          </p>
                          <span className="text-[11px] capitalize text-zinc-400">{grant.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Live Referral Tracker */}
              <section className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-orange-600 dark:text-orange-400" />
                    <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                      Your Invites ({payload.stats.totalInvited})
                    </h2>
                  </div>
                  <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                    {[
                      { id: "all", label: "All" },
                      { id: "pending", label: "Pending" },
                      { id: "rewarded", label: "Rewarded" },
                      { id: "expired", label: "Expired" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTab(t.id)}
                        className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                          activeTab === t.id
                            ? "bg-white text-orange-600 shadow-xs dark:bg-zinc-800 dark:text-orange-400"
                            : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredReferrals.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
                    <Ticket size={24} className="mx-auto text-zinc-400" />
                    <p className="mt-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      No invites in this list yet
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Share your referral link above to start earning MelaChow food credits.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredReferrals.map((ref) => {
                      const meta = statusMeta(ref.status);
                      return (
                        <div key={ref.id} className="flex items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                              {ref.friendName}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                              {ref.status === "rewarded"
                                ? `Order ${ref.qualifyingOrderCode || "completed"} · Credited ${formatNaira(ref.rewardNaira)}`
                                : ref.status === "attributed"
                                  ? `Window: ${formatTimeRemaining(ref.expiresAt, nowMs)}`
                                  : ref.rejectionReason || "Did not meet eligibility window"}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.badge}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
