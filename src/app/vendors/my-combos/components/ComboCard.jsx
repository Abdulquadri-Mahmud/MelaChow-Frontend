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
      className={`group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md overflow-hidden transition-all hover:border-orange-500/30 ${
        combo.is_archived ? 'opacity-60' : ''
      }`}
    >
      {/* Image */}
      <div className="relative h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {combo.image_url ? (
          <img
            src={combo.image_url}
            alt={combo.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            🍱
          </div>
        )}

        {/* Status badges top-left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {combo.is_archived && (
            <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-900/80 text-white backdrop-blur-sm">
              Archived
            </span>
          )}
          {!combo.is_archived && !combo.is_available && (
            <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/90 text-white backdrop-blur-sm">
              Hidden
            </span>
          )}
        </div>

        {/* Dietary badge top-right */}
        {dietary && (
          <span
            className={`absolute top-2 right-2 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded backdrop-blur-sm ${dietary.color}`}
          >
            {dietary.label}
          </span>
        )}

        {/* Hover action overlay */}
        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => onEdit(combo._id)}
            className="w-8 h-8 rounded-md bg-white text-slate-900 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all"
            title="Edit combo"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={() => onToggleAvailability(combo._id)}
            className="w-8 h-8 rounded-md bg-white text-slate-900 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all"
            title={combo.is_available ? 'Hide from menu' : 'Show on menu'}
          >
            {combo.is_available ? (
              <ToggleRight size={12} />
            ) : (
              <ToggleLeft size={12} />
            )}
          </button>
          <button
            onClick={() => onArchive(combo._id)}
            className="w-8 h-8 rounded-md bg-white text-slate-900 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all"
            title={combo.is_archived ? 'Restore' : 'Archive'}
          >
            {combo.is_archived ? (
              <ArchiveRestore size={12} />
            ) : (
              <Archive size={12} />
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2.5">
        {/* Name + category */}
        <div>
          <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight leading-tight line-clamp-1">
            {combo.name}
          </h3>
          <div className="flex flex-col gap-1 mt-1">
            {combo.platform_category_id && (
              <p className="text-[10px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest bg-orange-50 dark:bg-orange-500/10 w-fit px-1.5 py-0.5 rounded">
                {combo.platform_category_label || 'Category'}
              </p>
            )}
            {combo.description && (
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-normal">
                {combo.description}
              </p>
            )}
          </div>
        </div>

        {/* Price + prep time */}
        <div className="flex items-center justify-between">
          <span className="font-black text-base tracking-tight text-slate-900 dark:text-white">
            {priceDisplay}
          </span>
          {combo.prep_time_minutes && (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800 leading-none">
              <Clock size={10} className="text-orange-500" />
              {combo.prep_time_minutes}m
            </span>
          )}
        </div>

        {/* Metadata chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {combo.choice_groups && combo.choice_groups.length > 0 && (
            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 px-2 py-1 rounded-md">
              <span className="w-1 h-1 rounded-full bg-slate-400" />
              {combo.choice_groups.length} Options
            </span>
          )}
          {combo.tags && combo.tags.length > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 px-2 py-1 rounded-md">
              <Tag size={9} className="text-slate-400" />
              {combo.tags.length}
            </span>
          )}
          {combo.contents && combo.contents.length > 0 && (
            <span
              title={combo.contents.join(', ')}
              className="flex items-center gap-1 text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-2 py-1 rounded-md cursor-default uppercase tracking-widest"
            >
              📦 {combo.contents.length} items
            </span>
          )}
        </div>

        {/* Bottom actions row */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {combo.choice_groups?.length || 0} {combo.choice_groups?.length === 1 ? 'add-on' : 'add-ons'}
          </span>
          <button
            onClick={() => onView(combo._id)}
            className="flex items-center gap-1.5 text-xs font-black text-orange-500 hover:text-orange-600 transition-colors uppercase tracking-widest group/edit"
          >
            View
            <ChevronRight
              size={13}
              className="group-hover/edit:translate-x-0.5 transition-transform"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
