"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  ShoppingBag,
  Timer,
  User,
  X,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { completeOrder, updateOrderStatus } from "@/app/lib/vendorApi";

const STATUS_META = {
  pending: {
    label: "New",
    icon: Timer,
    tone: "amber",
    nextLabel: "Accept Order",
    nextStatus: "accepted",
    nextIcon: CheckCircle2,
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    tone: "blue",
    nextLabel: "Start Preparing",
    nextStatus: "preparing",
    nextIcon: ChefHat,
  },
  preparing: {
    label: "Preparing",
    icon: ChefHat,
    tone: "orange",
    nextLabel: "Ready for Pickup",
    nextStatus: "ready_for_pickup",
    nextIcon: PackageCheck,
  },
  ready: {
    label: "Ready",
    icon: PackageCheck,
    tone: "purple",
  },
  ready_for_pickup: {
    label: "Ready",
    icon: PackageCheck,
    tone: "purple",
  },
  out_for_delivery: {
    label: "In Transit",
    icon: Zap,
    tone: "cyan",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    tone: "emerald",
    nextLabel: "Mark Completed",
    nextStatus: "completed",
    nextIcon: PackageCheck,
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    tone: "emerald",
  },
  cancelled: {
    label: "Cancelled",
    icon: X,
    tone: "rose",
  },
};

const TONE_CLASSES = {
  amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
  blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30",
  orange: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/30",
  purple: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/30",
  cyan: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/30",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
  rose: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30",
};

function getId(order) {
  return order?._id?.$oid || order?._id || "";
}

function normalizeRestaurantId(value) {
  return value?._id?.$oid || value?._id || value?.$oid || value || "";
}

function getCustomerName(user) {
  const name = `${user?.firstname || ""} ${user?.lastname || ""}`.trim();
  return name || "Guest";
}

function getElapsed(createdAt, now) {
  const created = new Date(createdAt).getTime();
  if (!created || Number.isNaN(created)) return { label: "Now", minutes: 0 };

  const totalSeconds = Math.max(0, Math.floor((now - created) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return { label: `${hours}h ${remaining}m`, minutes };
  }

  return { label: `${minutes}:${seconds.toString().padStart(2, "0")}`, minutes };
}

function buildKitchenLine(item) {
  const quantity = Number(item.quantity) || 1;
  const portionQuantity = Number(item.portion_quantity) || 1;
  const totalPortions = quantity * portionQuantity;
  const portionLabel = item.portion_label || item.metadata?.portion_label || "";
  const itemName = item.name || item.variant?.name || "Item";
  const options = item.selected_options || item.metadata?.selected_options || [];
  const optionText = options
    .map((option) => `${option.quantity || 1} ${option.label || option.name}`)
    .filter(Boolean)
    .join(", ");

  return {
    itemName,
    quantity,
    totalPortions,
    portionLabel,
    optionText,
  };
}

export default function VendorOrderDeskCard({
  order,
  now,
  mode = "normal",
  onRefresh,
  onAcknowledge,
  vendorDetails,
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const id = getId(order);
  const status = order.orderStatus?.toLowerCase() || "pending";
  const meta = STATUS_META[status] || STATUS_META.pending;
  const StatusIcon = meta.icon;
  const NextIcon = meta.nextIcon;
  const elapsed = getElapsed(order.createdAt, now);
  const userOrder = order.userOrderId || {};
  const user = userOrder.userId || order.userId;
  const address = userOrder.deliveryAddress || order.deliveryAddress;
  const restaurantId = normalizeRestaurantId(order.restaurantId);

  const items = useMemo(() => {
    const sourceItems = userOrder.items?.length ? userOrder.items : order.items || [];
    const scopedItems = sourceItems.filter((item) => {
      const itemRestaurantId = normalizeRestaurantId(item.restaurantId);
      return !restaurantId || !itemRestaurantId || String(itemRestaurantId) === String(restaurantId);
    });
    return scopedItems.length ? scopedItems : sourceItems;
  }, [order.items, restaurantId, userOrder.items]);

  const isPending = status === "pending";
  const isAtRisk = isPending && elapsed.minutes >= 3;
  const isLate = isPending && elapsed.minutes >= 5;
  const isTablet = mode === "tablet";
  const toneClass = TONE_CLASSES[meta.tone] || TONE_CLASSES.amber;
  const customerPhone = user?.phone || userOrder.phone || order.phone || "N/A";
  const customerName = getCustomerName(user);
  const locationText = address?.street || address?.address || address?.city || "Delivery location pending";
  const displayOrderId = userOrder.orderId || order.orderId || id.slice(-6).toUpperCase();

  const handleStatus = async (newStatus) => {
    if (!id) return;
    setIsUpdating(true);
    try {
      if (newStatus === "completed") {
        await completeOrder(id);
      } else {
        await updateOrderStatus(id, newStatus);
      }
      onAcknowledge?.(id);
      toast.success(`Order moved to ${newStatus.replace(/_/g, " ")}`);
      onRefresh?.(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update order");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleWhatsAppFallback = () => {
    const phone = vendorDetails?.phone || vendorDetails?.vendor?.phone || "";
    const cleanPhone = phone.replace(/[^\d]/g, "");
    const message = encodeURIComponent(
      `New MelaChow order ${displayOrderId} is waiting on the vendor dashboard. Please open the Order Desk and accept it.`
    );
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-lg border bg-white dark:bg-zinc-900 ${
        isLate
          ? "border-rose-300 dark:border-rose-500/40"
          : isPending
            ? "border-orange-300 dark:border-orange-500/40"
            : "border-zinc-200 dark:border-zinc-800"
      } ${isTablet ? "shadow-lg shadow-orange-600/5" : ""}`}
    >
      {isPending && <div className="absolute inset-x-0 top-0 h-1.5 bg-orange-600" />}

      <div className={`${isTablet ? "p-5" : "p-4"} space-y-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${toneClass}`}>
                <StatusIcon size={12} />
                {meta.label}
              </span>
              {isAtRisk && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  <AlertTriangle size={12} />
                  {isLate ? "Escalate" : "Needs Attention"}
                </span>
              )}
            </div>
            <h3 className={`${isTablet ? "text-2xl" : "text-xl"} mt-3 font-black uppercase tracking-tight text-zinc-950 dark:text-white`}>
              #{displayOrderId}
            </h3>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {items.length} item{items.length === 1 ? "" : "s"} for {customerName}
            </p>
          </div>

          <div className={`rounded-lg border px-4 py-3 text-right ${isLate ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300" : "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300"}`}>
            <p className="text-[8px] font-black uppercase tracking-widest opacity-70">Waiting</p>
            <p className={`${isTablet ? "text-3xl" : "text-2xl"} font-black tabular-nums`}>{elapsed.label}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm dark:bg-zinc-900">
                <User size={16} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-white">{customerName}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                  <Phone size={11} className="text-orange-600" />
                  {customerPhone}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm dark:bg-zinc-900">
                <MapPin size={16} />
              </div>
              <p className="line-clamp-2 text-xs font-bold uppercase tracking-tight text-zinc-600 dark:text-zinc-300">{locationText}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-orange-100 bg-orange-50/70 p-3 dark:border-orange-500/20 dark:bg-orange-500/10">
          <div className="mb-3 flex items-center gap-2">
            <ShoppingBag size={14} className="text-orange-700 dark:text-orange-300" />
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-700 dark:text-orange-300">Kitchen Ticket</p>
          </div>
          <div className="space-y-2">
            {items.map((item, index) => {
              const line = buildKitchenLine(item);
              return (
                <div key={`${line.itemName}-${index}`} className="rounded-md border border-white/70 bg-white p-3 dark:border-orange-500/10 dark:bg-zinc-950/50">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 min-w-9 items-center justify-center rounded-md bg-orange-600 px-2 text-sm font-black text-white">
                      x{line.quantity}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`${isTablet ? "text-base" : "text-sm"} font-black uppercase tracking-tight text-zinc-950 dark:text-white`}>
                        {line.itemName}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                        {line.totalPortions} {line.portionLabel || (line.totalPortions === 1 ? "portion" : "portions")}
                      </p>
                      {line.optionText && (
                        <p className="mt-2 text-xs font-bold leading-relaxed text-zinc-700 dark:text-zinc-300">
                          Add-ons: {line.optionText}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isLate && (
          <div className="flex flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-500/30 dark:bg-rose-500/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-300">Manual WhatsApp fallback</p>
              <p className="mt-1 text-xs font-bold text-rose-600/80 dark:text-rose-200/80">Use this if staff away from the tablet need a quick reminder.</p>
            </div>
            <button
              type="button"
              onClick={handleWhatsAppFallback}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-rose-200 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-rose-700 transition-all active:scale-95 dark:border-rose-500/30 dark:bg-zinc-950 dark:text-rose-300"
            >
              <MessageCircle size={14} />
              Open WhatsApp
            </button>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          {meta.nextStatus ? (
            <button
              type="button"
              onClick={() => handleStatus(meta.nextStatus)}
              disabled={isUpdating}
              className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-700 active:scale-[0.98] disabled:opacity-60"
            >
              {isUpdating ? <Loader2 size={16} className="animate-spin" /> : NextIcon ? <NextIcon size={16} /> : null}
              {meta.nextLabel}
            </button>
          ) : (
            <div className="flex min-h-12 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              Waiting for next platform step
            </div>
          )}

          <div className="flex gap-2">
            {["pending", "accepted", "preparing", "ready", "ready_for_pickup"].includes(status) && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Cancel this order?")) handleStatus("cancelled");
                }}
                disabled={isUpdating}
                className="flex min-h-12 items-center justify-center rounded-lg border border-rose-200 bg-white px-4 text-rose-600 transition-all active:scale-95 disabled:opacity-60 dark:border-rose-500/30 dark:bg-zinc-950 dark:text-rose-300"
                aria-label="Cancel order"
                title="Cancel order"
              >
                <X size={16} />
              </button>
            )}
            <Link
              href={`/vendors/order/${id}`}
              className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-950 px-4 text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95 dark:border-zinc-700 dark:bg-white dark:text-zinc-950"
            >
              Details
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
