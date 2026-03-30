'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useVendorProfile } from '@/app/context/VendorProfileContext';
import { useVendorCombos } from '@/app/hooks/useVendorCombos';
import { useQueryClient } from '@tanstack/react-query';
import { toggleComboAvailability, archiveComboItem } from '@/app/lib/menuApi';
import ComboCard from './components/ComboCard';
import ComboCardSkeleton from './components/ComboCardSkeleton';
import EmptyCombos from './components/EmptyCombos';
import { Plus, RotateCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyCombosPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { vendorProfile, isLoading: isProfileLoading } = useVendorProfile();
  const vendorId = vendorProfile?._id || vendorProfile?.id;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const params = useMemo(() => ({
    ...(search && { search }),
    ...(status === 'unavailable' && { is_available: false, is_archived: false }),
    ...(status === 'available' && { is_available: true, is_archived: false }),
    ...(status === 'archived' && { is_archived: true }),
    ...(status === 'all' && { is_archived: false }),
  }), [search, status]);

  const { data, isLoading, isError, isFetching, refetch } = useVendorCombos(vendorId, params);

  // Hydration and Loading Guard
  if (!mounted || (isProfileLoading && !vendorId)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="animate-spin text-orange-500 w-12 h-12" />
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const combos = data?.combos || [];
  const pagination = data?.pagination || {};

  const handleRefresh = () => {
    refetch();
  };

  const handleToggleAvailability = async (comboId) => {
    try {
      const combo = combos.find((c) => c._id === comboId);
      if (!combo) return;

      await toggleComboAvailability(comboId, !combo.is_available);
      handleRefresh();
      toast.success('Availability updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update availability');
    }
  };

  const handleArchive = async (comboId) => {
    try {
      const combo = combos.find((c) => c._id === comboId);
      if (!combo) return;

      await archiveComboItem(comboId, !combo.is_archived);
      handleRefresh();
      toast.success(combo.is_archived ? 'Combo restored' : 'Combo archived');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update combo');
    }
  };

  const handleEdit = (comboId) => {
    router.push(`/vendors/my-combos/${comboId}/edit`);
  };

  const handleView = (comboId) => {
    router.push(`/vendors/my-combos/${comboId}`);
  };

  const isFiltered = status !== 'all' || search;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-3 rounded-md">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="max-w-2xl">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                🍱 Combo Bundles
              </h1>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed uppercase tracking-widest">
                Create value bundles with fixed pricing and add-on options.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isFetching}
                className={`h-10 w-10 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-all ${
                  isFetching ? 'opacity-50' : 'active:scale-95'
                }`}
                title="Refresh list"
              >
                <RotateCw size={16} className={isFetching ? 'animate-spin' : ''} />
              </button>

              {/* Create Combo */}
              <button
                onClick={() => router.push('/vendors/my-combos/create')}
                className="h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-widest rounded-md transition-all active:scale-95 flex items-center gap-2"
              >
                <Plus size={14} /> Create Combo
              </button>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search combos by name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500"
            />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            >
              <option value="all">Active Combos</option>
              <option value="available">Available Only</option>
              <option value="unavailable">Hidden Only</option>
              <option value="archived">Archived Items</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        {!isLoading && combos.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {pagination.total || combos.length} {pagination.total === 1 ? 'combo' : 'combos'}
              {isFiltered && ' matching filters'}
              {isFetching && ' · Updating...'}
            </p>
          </div>
        )}

        {/* Grid */}
        {isError ? (
          <div className="py-20">
            <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 rounded-lg p-8 max-w-md mx-auto text-center space-y-4">
              <div className="text-5xl">⚠️</div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                  Unable to Load Combos
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  We encountered an issue while fetching your combo bundles. Please check your connection and try again.
                </p>
              </div>
              <button
                onClick={handleRefresh}
                className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase tracking-widest rounded-md transition-all active:scale-95"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <ComboCardSkeleton key={i} />)
              : combos.length === 0
              ? (
                <EmptyCombos
                  isFiltered={isFiltered}
                  onClearFilters={() => {
                    setSearch('');
                    setStatus('all');
                    setPage(1);
                  }}
                  onCreate={() => router.push('/vendors/my-combos/create')}
                />
              )
              : combos.map((combo) => (
                <ComboCard
                  key={combo._id}
                  combo={combo}
                  onToggleAvailability={handleToggleAvailability}
                  onArchive={handleArchive}
                  onEdit={handleEdit}
                  onView={handleView}
                />
              ))}
          </div>
        )}

        {/* Pagination */}
        {pagination?.pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-10 px-5 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 disabled:opacity-40 hover:border-slate-400 transition-all"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 px-3">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasMore}
              className="h-10 px-5 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 disabled:opacity-40 hover:border-slate-400 transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
