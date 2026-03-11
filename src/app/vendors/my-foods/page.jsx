"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import { useVendorFoods } from "@/app/hooks/useVendorFoods";
import { useQueryClient } from "@tanstack/react-query";
import { toggleMenuItemAvailability, archiveMenuItem } from "@/app/lib/menuApi";
import FoodCard from "./components/FoodCard";
import FoodCardSkeleton from "./components/FoodCardSkeleton";
import FoodsFilterBar from "./components/FoodsFilterBar";
import EmptyFoods from "./components/EmptyFoods";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

export default function MyFoodsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { vendorProfile } = useVendorProfile();
  const vendorId = vendorProfile?._id || vendorProfile?.id;

  // ── FILTER STATE ────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [activeSection, setActiveSection] = useState(null);
  const [page, setPage] = useState(1);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearch = useCallback((value) => {
    setSearch(value);
  }, []);

  // ── FETCH ───────────────────────────────────────────────
  const filters = {
    status: status === "all" ? undefined : status,
    section: activeSection || undefined,
    search: debouncedSearch || undefined,
    page,
    limit: 24, // Use a clean multiple of grid columns
  };

  const { data, isLoading, isError, isFetching } = useVendorFoods(vendorId, filters);

  const items = data?.items || [];
  const stats = data?.stats || {};
  const pagination = data?.pagination || {};

  // ── DERIVE SECTIONS from items for filter bar ───────────
  const sections = useMemo(() => {
    const seen = new Map();
    items.forEach(item => {
      if (item.section && !seen.has(item.section._id)) {
        seen.set(item.section._id, item.section);
      }
    });
    return Array.from(seen.values());
  }, [items]);

  // ── ACTIONS ─────────────────────────────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries(["vendor-foods", vendorId]);
  };

  const handleToggleAvailability = async (itemId) => {
    const item = items.find(i => i._id === itemId);
    if (!item) return;

    try {
      await toggleMenuItemAvailability(vendorId, itemId, !item.is_available);
      invalidate();
      toast.success(item.is_available ? "Item hidden" : "Item is now live");
    } catch {
      toast.error("Failed to update availability");
    }
  };

  const handleArchive = async (itemId) => {
    const item = items.find(i => i._id === itemId);
    if (!item) return;

    try {
      await archiveMenuItem(vendorId, itemId);
      invalidate();
      toast.success("Food moved to archives");
    } catch {
      toast.error("Failed to archive food");
    }
  };

  const handleEdit = (itemId) => {
    router.push(`/vendors/my-foods/${itemId}/edit`);
  };

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("all");
    setActiveSection(null);
    setPage(1);
  };

  const isFiltered = !!(debouncedSearch || status !== "all" || activeSection);

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* ── PAGE HEADER ─────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              My Menu Catalogue
            </h1>
            <p className="text-base font-medium text-slate-500 dark:text-slate-400 mt-2">
              Manage your full food list, availability, and pricing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/vendors/menu/create-combo")}
              disabled={stats.total < 2}
              title={stats.total < 2
                ? "Add at least 2 foods before creating a combo"
                : "Bundle foods into a combo deal"
              }
              className="h-12 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 active:scale-95 shadow-sm"
            >
              🍱 Create Combo
            </button>

            <button
              onClick={() => router.push("/vendors/create-food")}
              className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-orange-500/25"
            >
              <Plus size={18} strokeWidth={3} /> Add New Food
            </button>
          </div>
        </div>

        {/* ── FILTERS ─────────────────────────────── */}
        <FoodsFilterBar
          search={search}
          onSearch={handleSearch}
          status={status}
          onStatus={(v) => { setStatus(v); setPage(1); }}
          sections={sections}
          activeSection={activeSection}
          onSection={(id) => { setActiveSection(id); setPage(1); }}
          stats={stats}
        />

        {/* ── RESULTS ─────────────────────────────── */}
        {isError ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto">
              <Plus size={32} className="rotate-45" />
            </div>
            <p className="text-base font-bold text-slate-500 dark:text-slate-400">
              Failed to load your menu items.
            </p>
            <button
              onClick={invalidate}
              className="px-6 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {!isLoading && items.length > 0 && (
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Displaying {items.length} of {pagination.total || 0} items
                  {isFiltered && <span className="text-orange-500"> (Filtered)</span>}
                  {isFetching && <span className="ml-2 animate-pulse">···</span>}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <FoodCardSkeleton key={i} />
                ))
                : items.length === 0
                  ? <EmptyFoods
                    isFiltered={isFiltered}
                    onClearFilters={handleClearFilters}
                    onAddFood={() => router.push("/vendors/create-food")}
                  />
                  : items.map(item => (
                    <FoodCard
                      key={item._id}
                      item={item}
                      onToggleAvailability={handleToggleAvailability}
                      onArchive={handleArchive}
                      onEdit={handleEdit}
                    />
                  ))
              }
            </div>
          </div>
        )}

        {/* ── PAGINATION ──────────────────────────── */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-10">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1}
              className="h-12 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-black text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:border-slate-400 transition-all active:scale-95 shadow-sm"
            >
              Previous
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {page}
              </span>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">
                of {pagination.pages}
              </span>
            </div>

            <button
              onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={!pagination.hasMore}
              className="h-12 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-black text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:border-slate-400 transition-all active:scale-95 shadow-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
