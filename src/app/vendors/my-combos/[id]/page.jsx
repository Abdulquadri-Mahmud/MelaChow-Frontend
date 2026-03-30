'use client';

import { useRouter, useParams } from 'next/navigation';
import { useComboById } from '@/app/hooks/useComboById';
import { useQueryClient } from '@tanstack/react-query';
import { toggleComboAvailability, archiveComboItem } from '@/app/lib/menuApi';
import { Clock, Tag, Archive, ArchiveRestore, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

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

export default function ComboDetailPage() {
  const router = useRouter();
  const params = useParams();
  const comboId = params?.id;
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useComboById(comboId);
  const combo = data?.combo;

  const dietary = combo ? DIETARY_BADGE[combo.dietary_type] : null;

  const handleToggleAvailability = async () => {
    if (!combo) return;
    try {
      await toggleComboAvailability(comboId, !combo.is_available);
      queryClient.invalidateQueries(['combo', comboId]);
      toast.success('Availability updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    }
  };

  const handleArchive = async () => {
    if (!combo) return;
    try {
      await archiveComboItem(comboId);
      queryClient.invalidateQueries(['combo', comboId]);
      toast.success(combo.is_archived ? 'Combo restored' : 'Combo archived');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-600 dark:text-slate-400">Loading combo...</p>
      </div>
    );
  }

  if (isError || !combo) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-600 dark:text-slate-400 mb-4">
            Combo not found
          </p>
          <button
            onClick={() => router.push('/vendors/my-combos')}
            className="text-sm font-black text-orange-500 hover:text-orange-600 uppercase tracking-widest"
          >
            Back to Combos
          </button>
        </div>
      </div>
    );
  }

  const priceDisplay = combo.price_naira
    ? `₦${combo.price_naira.toLocaleString()}`
    : 'No price';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-3 rounded-md">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 uppercase tracking-widest mb-4"
          >
            ← Back
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {combo.name}
              </h1>
              {combo.description && (
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  {combo.description}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => router.push(`/vendors/my-combos/${comboId}/edit`)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase tracking-widest rounded-md transition-all"
              >
                Edit
              </button>
              <button
                onClick={handleToggleAvailability}
                className={`w-10 h-10 flex items-center justify-center rounded-md border transition-all ${
                  combo.is_available
                    ? 'border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100'
                    : 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={combo.is_available ? 'Hide combo' : 'Show combo'}
              >
                {combo.is_available ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              </button>
              <button
                onClick={handleArchive}
                className="w-10 h-10 flex items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                title={combo.is_archived ? 'Restore combo' : 'Archive combo'}
              >
                {combo.is_archived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Image */}
          <div className="md:col-span-2">
            <div className="relative h-64 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
              {combo.image_url ? (
                <img
                  src={combo.image_url}
                  alt={combo.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  🍱
                </div>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-4">
            {/* Price */}
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                Price
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {priceDisplay}
              </p>
            </div>

            {/* Status */}
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                Status
              </p>
              <div className="flex flex-wrap gap-1">
                {combo.is_archived && (
                  <span className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded">
                    Archived
                  </span>
                )}
                {!combo.is_available && (
                  <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold rounded">
                    Hidden
                  </span>
                )}
                {!combo.is_archived && combo.is_available && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold rounded">
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              {dietary && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${dietary.color}`}
                  >
                    {dietary.label}
                  </span>
                </div>
              )}
              {combo.prep_time_minutes && (
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {combo.prep_time_minutes} min prep
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {combo.tags && combo.tags.length > 0 && (
          <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {combo.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-bold"
                >
                  <Tag size={12} /> {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contents */}
        {combo.contents && combo.contents.length > 0 && (
          <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              What's Included
            </p>
            <div className="flex flex-wrap gap-2">
              {combo.contents.map((item) => (
                <span
                  key={item}
                  className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Choice Groups */}
        {combo.choice_groups && combo.choice_groups.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Add-On Options ({combo.choice_groups.length})
            </p>
            {combo.choice_groups.map((group) => (
              <div
                key={group._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {group.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {group.is_required ? 'Required' : 'Optional'} · Max{' '}
                      {group.max_selections} selection
                      {group.max_selections > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  {group.options.map((option) => (
                    <div
                      key={option._id}
                      className="flex items-center justify-between text-sm p-2 bg-slate-50 dark:bg-slate-800 rounded"
                    >
                      <span className="text-slate-700 dark:text-slate-300">
                        {option.label}
                      </span>
                      {option.price_modifier_naira > 0 && (
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                          +₦{option.price_modifier_naira}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
