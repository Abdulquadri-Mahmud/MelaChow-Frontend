'use client';

import {
  Edit2,
  Archive,
  ArchiveRestore,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Clock,
  Tag,
} from 'lucide-react';

const DIETARY_BADGE = {
  halal: {
    label: 'Halal',
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
  },
  veg: {
    label: 'Veg',
    color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10',
  },
  vegan: {
    label: 'Vegan',
    color: 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-500/10',
  },
  kosher: {
    label: 'Kosher',
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10',
  },
  'non-veg': {
    label: 'Non-Veg',
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10',
  },
  mixed: null,
};

export default function ComboCard({
  combo,
  onToggleAvailability,
  onArchive,
  onEdit,
  onView,
}) {
  const dietary = DIETARY_BADGE[combo.dietary_type];

  const priceDisplay = combo.price_naira
    ? `₦${combo.price_naira.toLocaleString()}`
    : 'No price';

  return (
    <div
      className={`group relative bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 rounded-xl overflow-hidden transition-all hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/5 ${
        combo.is_archived ? 'opacity-60' : ''
      }`}
    >
      {/* Image */}
      <div className="relative h-44 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        {combo.image_url ? (
          <img
            src={combo.image_url}
            alt={combo.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            🍱
          </div>
        )}

        {/* Brand Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-orange-600/60 via-zinc-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

        {/* Status badges top-left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {combo.is_archived && (
            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-zinc-950/80 text-white backdrop-blur-md border border-white/10">
              Archived
            </span>
          )}
          {!combo.is_archived && !combo.is_available && (
            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-amber-500/90 text-white backdrop-blur-md shadow-lg shadow-amber-500/20">
              Hidden
            </span>
          )}
        </div>

        {/* Dietary badge top-right */}
        {dietary && (
          <span
            className={`absolute top-3 right-3 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg backdrop-blur-md border border-white/10 z-10 ${dietary.color}`}
          >
            {dietary.label}
          </span>
        )}

        {/* Hover action overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 z-20">
          <button
            onClick={() => onEdit(combo._id)}
            className="w-10 h-10 rounded-xl bg-white text-zinc-900 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-xl active:scale-90"
            title="Edit combo"
          >
            <Edit2 size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => onToggleAvailability(combo._id)}
            className="w-10 h-10 rounded-xl bg-white text-zinc-900 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all shadow-xl active:scale-90"
            title={combo.is_available ? 'Hide from menu' : 'Show on menu'}
          >
            {combo.is_available ? (
              <ToggleRight size={14} strokeWidth={2.5} />
            ) : (
              <ToggleLeft size={14} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Name + category */}
        <div>
          <h3 className="font-black text-zinc-900 dark:text-white text-lg tracking-tight leading-tight line-clamp-1 group-hover:text-orange-600 transition-colors">
            {combo.name}
          </h3>
          <div className="flex flex-col gap-1.5 mt-2">
            {combo.platform_category_id && (
              <p className="text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.15em] bg-orange-50 dark:bg-orange-500/10 w-fit px-2 py-1 rounded-lg border border-orange-100 dark:border-orange-500/20">
                {combo.platform_category_label || 'Category'}
              </p>
            )}
            {combo.description && (
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed italic">
                {combo.description}
              </p>
            )}
          </div>
        </div>

        {/* Price + prep time */}
        <div className="flex items-center justify-between py-1">
          <span className="font-black text-xl tracking-tighter text-orange-600 tabular-nums">
            {priceDisplay}
          </span>
          {combo.prep_time_minutes && (
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700/50 leading-none">
              <Clock size={11} className="text-orange-600" />
              {combo.prep_time_minutes}m
            </span>
          )}
        </div>

        {/* Metadata chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {combo.choice_groups && combo.choice_groups.length > 0 && (
            <span className="flex items-center gap-2 text-[9px] font-black uppercase text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 px-2.5 py-1.5 rounded-lg shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
              {combo.choice_groups.length} Options
            </span>
          )}
          {combo.tags && combo.tags.length > 0 && (
            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 px-2.5 py-1.5 rounded-lg shadow-sm">
              <Tag size={10} className="text-orange-500/70" />
              {combo.tags.length}
            </span>
          )}
          {combo.contents && combo.contents.length > 0 && (
            <span
              title={combo.contents.join(', ')}
              className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-2.5 py-1.5 rounded-lg uppercase tracking-wider"
            >
              📦 {combo.contents.length} Items
            </span>
          )}
        </div>

        {/* Bottom actions row */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest italic">
            {combo.choice_groups?.length || 0} Customizeable Sections
          </span>
          <button
            onClick={() => onView(combo._id)}
            className="flex items-center gap-2 text-[10px] font-black text-orange-600 hover:text-white bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-600 dark:hover:bg-orange-600 px-4 py-2 rounded-xl transition-all uppercase tracking-[0.2em] group/btn active:scale-95 border border-orange-100 dark:border-orange-500/20"
          >
            Detail
            <ChevronRight
              size={12}
              strokeWidth={3}
              className="group-hover/btn:translate-x-1 transition-transform"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
