"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BellRing,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Filter,
  Maximize2,
  Minimize2,
  Package,
  RotateCw,
  Search,
  TabletSmartphone,
  Timer,
  TrendingUp,
  Megaphone,
  Volume2,
  VolumeX,
} from "lucide-react";
import { getVendorOrders } from "@/app/lib/vendorApi";
import VendorOrderCard from "@/app/components/order/VendorOrderCard";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import VendorOrderDeskCard from "./components/VendorOrderDeskCard";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const ACTIVE_STATUSES = ["pending", "accepted", "preparing", "ready", "ready_for_pickup"];
const HISTORY_STATUSES = ["out_for_delivery", "delivered", "completed", "cancelled", "failed", "refunded"];
const ACK_KEY = "melachow_vendor_acknowledged_orders_v1";
const WARNING_CHIME_KEY = "melachow_vendor_warning_chime_v1";

function getOrderId(order) {
  return order?._id?.$oid || order?._id || "";
}

function getStatus(order) {
  return order.orderStatus?.toLowerCase() || "pending";
}

function sortNewestFirst(a, b) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function sortOldestFirst(a, b) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

function getPersistedAcknowledgements() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(ACK_KEY) || "{}");
  } catch {
    return {};
  }
}

function persistAcknowledgements(value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACK_KEY, JSON.stringify(value));
}

let orderDeskAudioContext;

function getOrderDeskAudioContext() {
  if (typeof window === "undefined") return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  if (!orderDeskAudioContext || orderDeskAudioContext.state === "closed") {
    orderDeskAudioContext = new AudioContext();
  }
  if (orderDeskAudioContext.state === "suspended") {
    orderDeskAudioContext.resume().catch(() => {});
  }
  return orderDeskAudioContext;
}

function playOrderDeskChime({ urgent = false } = {}) {
  if (typeof window === "undefined") return;
  const context = getOrderDeskAudioContext();
  if (!context) return;

  const gain = context.createGain();
  gain.gain.value = urgent ? 0.055 : 0.04;
  gain.connect(context.destination);

  const pattern = urgent
    ? [
        [0, 880],
        [0.14, 660],
        [0.28, 880],
        [0.42, 660],
      ]
    : [
        [0, 740],
        [0.16, 740],
        [0.32, 740],
      ];

  pattern.forEach(([offset, frequency]) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start(context.currentTime + offset);
    oscillator.stop(context.currentTime + offset + 0.1);
  });

  if (navigator.vibrate) {
    navigator.vibrate(urgent ? [220, 120, 220] : [160, 80, 160]);
  }
}

function speakOrderDeskAlert(message) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export default function VendorOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [viewMode, setViewMode] = useState("desk");
  const [deskStatusTab, setDeskStatusTab] = useState("pending");
  const [deskSwiper, setDeskSwiper] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useState(false);
  const [tabletMode, setTabletMode] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [acknowledgedOrders, setAcknowledgedOrders] = useState({});
  const previousPendingIdsRef = useRef(new Set());
  const warningChimeRef = useRef({});
  const hasLoadedOnceRef = useRef(false);
  const { vendorDetails } = useVendorStorage();
  const itemsPerPage = tabletMode ? 8 : 6;

  const fetchOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const res = await getVendorOrders();
      const data = res.vendorOrders || res.data || res || [];
      const orderData = Array.isArray(data) ? data : [];
      setOrders(orderData);
      setFilteredOrders(orderData);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setAcknowledgedOrders(getPersistedAcknowledgements());
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const unlockAudio = () => {
      getOrderDeskAudioContext();
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const poll = () => fetchOrders(true);
    const interval = window.setInterval(poll, document.hidden ? 30000 : 8000);
    return () => window.clearInterval(interval);
  }, [fetchOrders, viewMode]);

  useEffect(() => {
    const pendingIds = new Set(
      orders
        .filter((order) => getStatus(order) === "pending")
        .map(getOrderId)
        .filter(Boolean)
    );

    if (!hasLoadedOnceRef.current) {
      previousPendingIdsRef.current = pendingIds;
      hasLoadedOnceRef.current = true;
      return;
    }

    const hasNewPending = [...pendingIds].some((id) => !previousPendingIdsRef.current.has(id));
    previousPendingIdsRef.current = pendingIds;

    if (hasNewPending) {
      setViewMode("desk");
      if (soundEnabled) {
        try {
          playOrderDeskChime();
        } catch {
          // Browser audio can be blocked until user interaction.
        }
      }
      if (voiceAlertsEnabled) {
        const count = pendingIds.size;
        try {
          speakOrderDeskAlert(`You have ${count} ${count === 1 ? "awaiting order" : "awaiting orders"}.`);
        } catch {
          // Browser speech can be blocked until user interaction.
        }
      }
    }
  }, [orders, soundEnabled, voiceAlertsEnabled]);

  useEffect(() => {
    if (!soundEnabled) return;

    const persisted = (() => {
      try {
        return JSON.parse(window.sessionStorage.getItem(WARNING_CHIME_KEY) || "{}");
      } catch {
        return {};
      }
    })();
    warningChimeRef.current = { ...persisted, ...warningChimeRef.current };

    const overdueOrders = [];
    orders.forEach((order) => {
      if (getStatus(order) !== "pending") return;
      const orderId = getOrderId(order);
      if (!orderId) return;
      const created = new Date(order.createdAt).getTime();
      const ageMs = now - created;
      if (!created || Number.isNaN(created) || ageMs < 3 * 60 * 1000) return;

      const lastPlayed = warningChimeRef.current[orderId] || 0;
      if (now - lastPlayed < 60 * 1000) return;

      warningChimeRef.current[orderId] = now;
      overdueOrders.push(orderId);
    });

    if (overdueOrders.length > 0) {
      window.sessionStorage.setItem(WARNING_CHIME_KEY, JSON.stringify(warningChimeRef.current));
      try {
        playOrderDeskChime({ urgent: true });
      } catch {
        // Browser audio can be blocked until user interaction.
      }
      if (voiceAlertsEnabled) {
        try {
          speakOrderDeskAlert(`${overdueOrders.length} ${overdueOrders.length === 1 ? "order needs" : "orders need"} attention.`);
        } catch {
          // Browser speech can be blocked until user interaction.
        }
      }
    }
  }, [now, orders, soundEnabled, voiceAlertsEnabled]);

  const activeOrders = useMemo(
    () => orders.filter((order) => ACTIVE_STATUSES.includes(getStatus(order))).sort(sortOldestFirst),
    [orders]
  );

  const incomingOrders = useMemo(
    () => activeOrders.filter((order) => getStatus(order) === "pending"),
    [activeOrders]
  );

  const preparingOrders = useMemo(
    () => activeOrders.filter((order) => ["accepted", "preparing"].includes(getStatus(order))),
    [activeOrders]
  );

  const readyOrders = useMemo(
    () => activeOrders.filter((order) => ["ready", "ready_for_pickup"].includes(getStatus(order))),
    [activeOrders]
  );

  const unacknowledgedIncoming = useMemo(
    () => incomingOrders.filter((order) => !acknowledgedOrders[getOrderId(order)]),
    [acknowledgedOrders, incomingOrders]
  );

  useEffect(() => {
    const originalTitle = document.title;
    if (unacknowledgedIncoming.length > 0) {
      document.title = `${unacknowledgedIncoming.length} New Order${unacknowledgedIncoming.length === 1 ? "" : "s"} - MelaChow`;
    }
    return () => {
      document.title = originalTitle;
    };
  }, [unacknowledgedIncoming.length]);

  const acknowledgeOrder = useCallback((orderId) => {
    if (!orderId) return;
    setAcknowledgedOrders((prev) => {
      const next = { ...prev, [orderId]: Date.now() };
      persistAcknowledgements(next);
      return next;
    });
  }, []);

  useEffect(() => {
    let result = orders;

    if (statusFilter !== "all") {
      result = result.filter((order) => {
        const status = getStatus(order);
        if (statusFilter === "active") return ACTIVE_STATUSES.includes(status);
        if (statusFilter === "history") return HISTORY_STATUSES.includes(status);
        if (statusFilter === "ready_for_pickup") return status === "ready_for_pickup" || status === "ready";
        return status === statusFilter;
      });
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((order) => {
        const orderId = getOrderId(order).toLowerCase();
        const userOrderId = (order.userOrderId?.orderId || order.orderId || "").toLowerCase();
        const customerName = `${order.userOrderId?.userId?.firstname || ""} ${order.userOrderId?.userId?.lastname || ""}`.toLowerCase();
        return orderId.includes(lowerQuery) || userOrderId.includes(lowerQuery) || customerName.includes(lowerQuery);
      });
    }

    setFilteredOrders([...result].sort(sortNewestFirst));
    setCurrentPage(1);
  }, [searchQuery, statusFilter, orders]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const tabs = [
    { id: "all", label: "All Logs", icon: Package },
    { id: "active", label: "Active", icon: BellRing },
    { id: "pending", label: "New", icon: Clock },
    { id: "accepted", label: "Accepted", icon: CheckCircle2 },
    { id: "preparing", label: "Preparing", icon: TrendingUp },
    { id: "ready_for_pickup", label: "Ready", icon: CheckCircle2 },
    { id: "history", label: "History", icon: Package },
    { id: "out_for_delivery", label: "In Transit", icon: TrendingUp },
    { id: "delivered", label: "Delivered", icon: CheckCircle2 },
    { id: "completed", label: "Completed", icon: CheckCircle2 },
  ];

  const getTabCount = (tabId) => {
    if (tabId === "all") return orders.length;
    if (tabId === "active") return activeOrders.length;
    if (tabId === "history") return orders.filter((order) => HISTORY_STATUSES.includes(getStatus(order))).length;
    if (tabId === "ready_for_pickup") {
      return orders.filter((order) => ["ready", "ready_for_pickup"].includes(getStatus(order))).length;
    }
    return orders.filter((order) => getStatus(order) === tabId).length;
  };

  const stats = {
    total: orders.length,
    pending: incomingOrders.length,
    active: activeOrders.length,
    ready: readyOrders.length,
    completed: orders.filter((order) => ["delivered", "completed"].includes(getStatus(order))).length,
  };

  const deskTabs = [
    {
      id: "pending",
      label: "New",
      icon: BellRing,
      orders: incomingOrders,
      subtitle: "Accept quickly so customers and kitchen staff know the order is moving.",
      emptyText: "No new orders waiting right now.",
    },
    {
      id: "preparing",
      label: "Preparing",
      icon: Timer,
      orders: preparingOrders,
      subtitle: "Orders already accepted by the restaurant.",
      emptyText: "No orders are currently being prepared.",
    },
    {
      id: "ready",
      label: "Ready",
      icon: CheckCircle2,
      orders: readyOrders,
      subtitle: "Keep this clear so riders and counter staff can scan fast.",
      emptyText: "No orders are ready for pickup yet.",
    },
  ];

  const renderDeskSection = (title, subtitle, sectionOrders, emptyText, icon) => {
    const Icon = icon;
    return (
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Icon size={16} className="text-orange-600" />
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">{title}</h2>
              <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-black text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                {sectionOrders.length}
              </span>
            </div>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          </div>
        </div>

        {sectionOrders.length > 0 ? (
          <div className={`grid gap-3 ${tabletMode ? "xl:grid-cols-3" : "lg:grid-cols-2 2xl:grid-cols-3"}`}>
            {sectionOrders.map((order) => (
              <VendorOrderDeskCard
                key={getOrderId(order)}
                order={order}
                now={now}
                mode={tabletMode ? "tablet" : "normal"}
                vendorDetails={vendorDetails}
                onRefresh={fetchOrders}
                onAcknowledge={acknowledgeOrder}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">{emptyText}</p>
          </div>
        )}
      </section>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-[3px] border-orange-600 border-t-transparent animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Opening Order Desk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-zinc-100 p-2 font-sans dark:bg-zinc-950 ${tabletMode ? "fixed inset-0 z-[9999] overflow-y-auto" : "rounded-md"}`}>
      <div className={`${tabletMode ? "mx-auto max-w-[1600px]" : "mx-auto max-w-7xl"} space-y-4`}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {!tabletMode && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.back()}
                  className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-100 p-2.5 text-zinc-500 transition-all hover:text-orange-600 active:scale-90 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:text-orange-500"
                >
                  <ChevronLeft size={18} />
                </motion.button>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {unacknowledgedIncoming.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                      <BellRing size={12} />
                      {unacknowledgedIncoming.length} New
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    <TabletSmartphone size={12} />
                    Vendor Station
                  </span>
                </div>
                <h1 className="mt-2 text-2xl font-black uppercase leading-none tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
                  Order Desk
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSoundEnabled((value) => {
                    const next = !value;
                    if (next) {
                      try {
                        playOrderDeskChime();
                      } catch {}
                    }
                    return next;
                  });
                }}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                  soundEnabled
                    ? "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400"
                    : "border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                Sound
              </button>

              <button
                type="button"
                onClick={() => {
                  setVoiceAlertsEnabled((value) => {
                    const next = !value;
                    if (next) {
                      try {
                        speakOrderDeskAlert("Voice alerts enabled.");
                      } catch {}
                    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                    }
                    return next;
                  });
                }}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                  voiceAlertsEnabled
                    ? "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400"
                    : "border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                <Megaphone size={14} />
                Voice
              </button>

              <button
                type="button"
                onClick={() => setTabletMode((value) => !value)}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 transition-all active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {tabletMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                {tabletMode ? "Exit Station" : "Station Mode"}
              </button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fetchOrders(true)}
                disabled={isRefreshing}
                className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 p-2 px-4 text-[10px] font-black uppercase tracking-widest text-orange-600 transition-all active:scale-95 disabled:opacity-50 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-500"
              >
                <RotateCw size={14} className={isRefreshing ? "animate-spin" : ""} strokeWidth={2.5} />
                Refresh
              </motion.button>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Smart polling, kitchen tickets, SLA timers, and one-tap order movement.
            </p>

            <div className="flex rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
              {[
                { id: "desk", label: "Desk" },
                { id: "logs", label: "Logs" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setViewMode(mode.id);
                    if (mode.id === "logs") setStatusFilter("active");
                  }}
                  className={`rounded-md px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    viewMode === mode.id
                      ? "bg-orange-600 text-white"
                      : "text-zinc-500 hover:text-orange-600 dark:text-zinc-300"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800 sm:grid-cols-5">
            {[
              { label: "Total Orders", value: stats.total, icon: Package, light: "text-blue-600", lightBg: "bg-blue-50 dark:bg-blue-500/10" },
              { label: "New", value: stats.pending, icon: Clock, light: "text-amber-600", lightBg: "bg-amber-50 dark:bg-amber-500/10" },
              { label: "Active", value: stats.active, icon: Timer, light: "text-orange-600", lightBg: "bg-orange-50 dark:bg-orange-500/10" },
              { label: "Ready", value: stats.ready, icon: CheckCircle2, light: "text-purple-600", lightBg: "bg-purple-50 dark:bg-purple-500/10" },
              { label: "Completed", value: stats.completed, icon: CheckCircle2, light: "text-emerald-600", lightBg: "bg-emerald-50 dark:bg-emerald-500/10" },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className={`rounded-lg border border-zinc-200 p-3 dark:border-zinc-700 ${stat.lightBg}`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <p className={`text-[9px] font-black uppercase tracking-wider ${stat.light} opacity-75`}>{stat.label}</p>
                  <div className={`rounded-lg bg-white p-2 ${stat.light} dark:bg-zinc-900`}>
                    <stat.icon size={14} strokeWidth={2.5} />
                  </div>
                </div>
                <p className={`text-3xl font-black tabular-nums ${stat.light}`}>{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {viewMode === "desk" ? (
            <motion.div
              key="desk"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="sticky top-2 z-20 rounded-lg border border-zinc-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
                <div className="grid grid-cols-3 gap-2">
                  {deskTabs.map((tab, index) => {
                    const Icon = tab.icon;
                    const isActive = deskStatusTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setDeskStatusTab(tab.id);
                          deskSwiper?.slideTo(index);
                        }}
                        className={`flex min-h-11 items-center justify-center gap-2 rounded-md border px-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                          isActive
                            ? "border-transparent bg-orange-600 text-white shadow-sm"
                            : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-orange-300 hover:text-orange-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        <Icon size={14} strokeWidth={2.5} />
                        <span className="truncate">{tab.label}</span>
                        <span className={`rounded-md px-2 py-0.5 text-[8px] font-black ${isActive ? "bg-orange-900 text-white" : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"}`}>
                          {tab.orders.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Swiper
                onSwiper={setDeskSwiper}
                onSlideChange={(swiper) => setDeskStatusTab(deskTabs[swiper.activeIndex]?.id || "pending")}
                speed={300}
                simulateTouch
                touchRatio={1}
                autoHeight
                style={{ width: "100%" }}
              >
                {deskTabs.map((tab) => (
                  <SwiperSlide key={tab.id} style={{ height: "auto", minHeight: "50vh" }}>
                    {renderDeskSection(tab.label === "New" ? "New Orders" : tab.label === "Ready" ? "Ready for Pickup" : tab.label, tab.subtitle, tab.orders, tab.emptyText, tab.icon)}
                  </SwiperSlide>
                ))}
              </Swiper>
            </motion.div>
          ) : (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 px-1">
                    <Filter size={14} className="text-orange-600" />
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-300">Filter by status</p>
                    <div className="ml-auto text-[9px] font-bold text-zinc-400 dark:text-zinc-500 sm:ml-2">
                      {filteredOrders.length} results
                    </div>
                  </div>

                  <div className="relative w-full sm:max-w-sm">
                    <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      placeholder="Search by ID or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-100 py-2.5 pl-11 pr-4 text-sm font-bold uppercase tracking-wider text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-orange-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth scrollbar-hide">
                  {tabs.map((tab) => {
                    const count = getTabCount(tab.id);
                    const isActive = statusFilter === tab.id;
                    return (
                      <motion.button
                        key={tab.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStatusFilter(tab.id)}
                        className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                          isActive
                            ? "border-transparent bg-orange-600 text-white"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-orange-500"
                        }`}
                      >
                        <tab.icon size={13} strokeWidth={2.5} />
                        {tab.label}
                        <span className={`rounded-md px-2 py-0.5 text-[8px] font-black ${isActive ? "bg-orange-900 text-white" : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"}`}>
                          {count}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {currentOrders.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {currentOrders.map((order, index) => (
                      <motion.div
                        key={getOrderId(order)}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.05, duration: 0.4 }}
                      >
                        <VendorOrderCard order={order} onRefresh={fetchOrders} />
                      </motion.div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                        <p className="text-center text-[10px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-300 sm:text-left">
                          Showing <span className="text-orange-600 dark:text-orange-500">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredOrders.length)}</span> of <span className="font-black text-zinc-900 dark:text-white">{filteredOrders.length}</span>
                        </p>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="rounded-lg border border-zinc-200 bg-white p-2.5 font-bold text-zinc-500 transition-all hover:border-orange-600 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-25 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-500"
                          >
                            <ChevronLeft size={16} />
                          </button>

                          <div className="flex gap-1.5">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                              const isCurrent = currentPage === page;
                              const isVisible = Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages;
                              if (!isVisible) return null;
                              if ((page === 2 && currentPage > 3) || (page === totalPages - 1 && currentPage < totalPages - 2)) {
                                return <span key={`ellipsis-${page}`} className="px-1 text-zinc-300">...</span>;
                              }
                              return (
                                <button
                                  key={page}
                                  onClick={() => handlePageChange(page)}
                                  className={`h-9 w-9 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${
                                    isCurrent
                                      ? "border-transparent bg-orange-600 text-white"
                                      : "border-zinc-200 bg-white text-zinc-600 hover:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-orange-500"
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="rounded-lg border border-zinc-200 bg-white p-2.5 font-bold text-zinc-500 transition-all hover:border-orange-600 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-25 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-orange-500 dark:hover:text-orange-500"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-24 text-center dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="mb-6 rounded-full bg-zinc-100 p-6 dark:bg-zinc-800">
                    <Package size={56} className="text-zinc-300 dark:text-zinc-600" strokeWidth={1} />
                  </div>
                  <h3 className="mb-2 text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">No Orders Found</h3>
                  <p className="max-w-sm text-[11px] font-bold uppercase leading-relaxed tracking-wider text-zinc-500 dark:text-zinc-400">
                    {searchQuery
                      ? `No orders match your search for "${searchQuery}"`
                      : `No ${statusFilter !== "all" ? `${statusFilter.replace(/_/g, " ")} ` : ""}orders at the moment`}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
