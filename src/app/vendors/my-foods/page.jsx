"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import { useVendorFoods } from "@/app/hooks/useVendorFoods";
import { useQueryClient } from "@tanstack/react-query";
import { toggleMenuItemAvailability, archiveMenuItem, deleteMenuItem } from "@/app/lib/menuApi";
import FoodCard from "./components/FoodCard";
import FoodCardSkeleton from "./components/FoodCardSkeleton";
import FoodsFilterBar from "./components/FoodsFilterBar";
import EmptyFoods from "./components/EmptyFoods";
import { Plus, RotateCw } from "lucide-react";
import toast from "react-hot-toast";

export default function MyFoodsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { vendorProfile } = useVendorProfile();
  const vendorId = vendorProfile?._id || vendorProfile?.id;

  // Filter state
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [activeSection, setActiveSection] = useState(null);
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSearch = useCallback((value) => {
    setSearch(value);
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 350);
  }, []);

  // Build filters object for the hook
  const filters = {
    status,
    section: activeSection || undefined,
    search: debouncedSearch || undefined,
    page,
    limit: 50,
  };

  const { data, isLoading, isError, isFetching } =
    useVendorFoods(vendorId, filters);

  const items = data?.items || [];
  const stats = data?.stats || {};
  const pagination = data?.pagination || {};

  // Derive unique sections from fetched items for filter bar
  const sections = useMemo(() => {
    const seen = new Map();
    items.forEach(item => {
      if (item.section && !seen.has(item.section._id)) {
        seen.set(item.section._id, item.section);
      }
    });
    return Array.from(seen.values());
  }, [items]);

  // Invalidate and refetch
  const invalidate = () => {
    queryClient.invalidateQueries(["vendor-foods", vendorId]);
  };

  // Toggle availability
  const handleToggleAvailability = async (itemId) => {
    try {
      await toggleMenuItemAvailability(vendorId, itemId);
      invalidate();
      toast.success("Availability updated");
    } catch {
      toast.error("Failed to update availability");
    }
  };

  const handleArchive = async (itemId) => {
    const item = items.find(i => i._id === itemId);
    if (!item) return;
    try {
      await archiveMenuItem(vendorId, itemId, !item.is_archived);
      invalidate();
      toast.success(item.is_archived ? "Food restored" : "Food archived");
    } catch (err) {
      const serverMsg = err?.response?.data?.message;
      const blockedByCombos = err?.response?.data?.combos;

      if (blockedByCombos?.length > 0) {
        // Specific combo-block message
        toast.error(serverMsg, {
          duration: 6000,    // longer — vendor needs to read it
          icon: "🍱",
        });
      } else {
        // Generic fallback
        toast.error(serverMsg || "Failed to update food");
      }
    }
  };

  // Navigate to food management page (inline editing — wizard deprecated)
  const handleEdit = (itemId) => {
    router.push(`/vendors/my-foods/${itemId}`);
  };

  // Permanently delete a menu item (with confirmation toast)
  const handleDelete = (itemId, itemName) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[260px]">
        <div>
          <p className="font-black text-sm text-slate-900 dark:text-white">
            Delete &ldquo;{itemName}&rdquo;?
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Permanently removes this item, all its sizes, choices, and options.
            This cannot be undone.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await deleteMenuItem(vendorId, itemId);
                invalidate();
                toast.success(`"${itemName}" deleted`);
              } catch (err) {
                const msg = err?.response?.data?.message;
                const blocked = err?.response?.data?.combos;
                toast.error(msg || "Could not delete item", {
                  duration: blocked ? 6000 : 4000,
                  icon: blocked ? "🍱" : "❌",
                });
              }
            }}
            className="flex-1 h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-colors"
          >
            Delete Forever
          </button>
        </div>
      </div>
    ), { duration: 8000 });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("all");
    setActiveSection(null);
    setPage(1);
  };

  const isFiltered = !!(debouncedSearch || status !== "all" || activeSection);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 rounded-md">
      <div className="max-w-6xl mx-auto space-y-4">

        {/* Page Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              My Foods
            </h1>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">
              Manage your full menu catalogue
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={invalidate}
              disabled={isFetching}
              className={`h-12 w-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-all ${isFetching ? "opacity-50" : "active:scale-95"}`}
              title="Refresh list"
            >
              <RotateCw size={18} className={isFetching ? "animate-spin" : ""} />
            </button>

            {/* Create Combo — secondary */}
            <button
              onClick={() => router.push("/vendors/menu/create-combo")}
              disabled={stats.total < 2}
              title={stats.total < 2
                ? "Add at least 2 foods before creating a combo"
                : "Bundle foods into a combo deal"
              }
              className="h-12 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              🍱 Create Combo
            </button>

            {/* Add Food — primary */}
            <button
              onClick={() => router.push("/vendors/create-food")}
              className="h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-orange-500/25"
            >
              <Plus size={16} /> Add Food
            </button>
          </div>
        </div>

        {/* Filter Bar */}
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

        {/* Results count */}
        {!isLoading && items.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {pagination.total} {pagination.total === 1 ? "food" : "foods"}
              {isFiltered && " matching filters"}
              {isFetching && " · Updating..."}
            </p>
          </div>
        )}

        {/* Grid */}
        {isError ? (
          <div className="py-20 text-center">
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500">
              Failed to load your foods.
            </p>
            <button
              onClick={invalidate}
              className="mt-4 text-xs font-black text-orange-500 hover:text-orange-600 uppercase tracking-widest"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2">
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
                    onDelete={handleDelete}
                  />
                ))
            }
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-10 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 disabled:opacity-40 hover:border-slate-400 transition-all"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 px-3">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!pagination.hasMore}
              className="h-10 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 disabled:opacity-40 hover:border-slate-400 transition-all"
            >
              Next
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
