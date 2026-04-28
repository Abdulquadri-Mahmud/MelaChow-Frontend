'use client';

import { Plus } from 'lucide-react';

export default function EmptyCombos({ isFiltered, onClearFilters, onCreate }) {
  if (isFiltered) {
    return (
      <div className="col-span-full py-16 text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="font-bold text-zinc-600 dark:text-zinc-300 mb-2">
          No combos matching your filters
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          Try adjusting your search or filters
        </p>
        <button
          onClick={onClearFilters}
          className="text-xs font-black text-orange-500 hover:text-orange-600 uppercase tracking-widest"
        >
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <div className="col-span-full py-16 text-center">
      <p className="text-5xl mb-3">🍱</p>
      <p className="font-bold text-zinc-600 dark:text-zinc-300 mb-2">
        No combos yet
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        Create value bundles to boost order value and customer satisfaction
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase tracking-widest rounded-md transition-all active:scale-95"
      >
        <Plus size={14} /> Create Your First Combo
      </button>
    </div>
  );
}
