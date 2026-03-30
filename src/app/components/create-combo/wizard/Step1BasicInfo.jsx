'use client';

import { useState } from 'react';
import { useCreateComboStore } from '@/app/context/CreateComboStore';
import { motion } from 'framer-motion';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

const DIETARY_OPTIONS = [
  { label: '🌱 Vegetarian', value: 'veg' },
  { label: '🥗 Vegan', value: 'vegan' },
  { label: '🐔 Non-Veg', value: 'non-veg' },
  { label: '✨ Halal', value: 'halal' },
  { label: '✓ Kosher', value: 'kosher' },
  { label: '🍽️ Mixed', value: 'mixed' },
];

const CLOUDINARY_HOST = 'https://api.cloudinary.com/v1_1/dypn7gna0/image/upload';
const CLOUDINARY_PRESET = 'GrubDash';

export default function Step1BasicInfo() {
  const store = useCreateComboStore();
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    try {
      const res = await fetch(CLOUDINARY_HOST, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      store.setField('image_url', data.secure_url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Image upload failed');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleAddTag = (tag) => {
    if (tag.trim() && (store.tags || []).length < 6) {
      store.addTag(tag.trim());
    }
  };

  const isReadyForNext =
    store.name.trim() !== '' &&
    store.image_url &&
    store.dietary_type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Name */}
      <div>
        <label className="block text-[11px] font-black uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400 pl-1">
          Combo Name *
        </label>
        <input
          type="text"
          value={store.name}
          onChange={(e) => store.setField('name', e.target.value)}
          placeholder="e.g., Rice & Chicken Combo"
          className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-[13px] font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:border-orange-500 outline-none transition-all"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-[11px] font-black uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400 pl-1">
          Description
        </label>
        <textarea
          value={store.description}
          onChange={(e) => store.setField('description', e.target.value)}
          placeholder="What's in the box?"
          rows={2}
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-[13px] font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:border-orange-500 outline-none transition-all resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Image Upload */}
        <div>
            <label className="block text-[11px] font-black uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400 pl-1">
            Visual *
            </label>
            {store.image_url ? (
            <div className="relative w-full h-28 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50 dark:bg-slate-950">
                <Image
                src={store.image_url}
                alt="combo"
                fill
                className="object-cover"
                />
                <button
                type="button"
                onClick={() => store.setField('image_url', null)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-600 text-white rounded-md flex items-center justify-center hover:bg-rose-700 shadow-lg"
                >
                <X size={12} strokeWidth={3} />
                </button>
            </div>
            ) : (
            <label className="flex items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group">
                <div className="flex flex-col items-center justify-center">
                <Upload size={18} className="text-slate-300 group-hover:text-orange-500 mb-1.5 transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-orange-600 transition-colors">
                    {uploading ? 'Processing...' : 'Upload'}
                </span>
                </div>
                <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
                />
            </label>
            )}
        </div>

        <div className="space-y-4">
            {/* Prep Time */}
            <div>
                <label className="block text-[11px] font-black uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400 pl-1">
                Prep Time (Min)
                </label>
                <input
                type="number"
                min="0"
                max="180"
                value={store.prep_time_minutes || ''}
                onChange={(e) =>
                    store.setField('prep_time_minutes', e.target.value ? Number(e.target.value) : null)
                }
                placeholder="0"
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-[13px] font-black text-orange-600 tabular-nums focus:border-orange-500 outline-none"
                />
            </div>

            {/* Dietary Type */}
            <div>
                <label className="block text-[11px] font-black uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400 pl-1">
                Dietary Type *
                </label>
                <div className="relative">
                    <select 
                        value={store.dietary_type}
                        onChange={(e) => store.setField('dietary_type', e.target.value)}
                        className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 appearance-none focus:border-orange-500 outline-none"
                    >
                        {DIETARY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <X size={12} className="rotate-45" />
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-[11px] font-black uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400 pl-1">
          Search Tags
        </label>
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3">
            <div className="flex flex-wrap gap-1.5">
                {(store.tags || []).map((tag) => (
                    <motion.div
                    key={tag}
                    layoutId={tag}
                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm"
                    >
                    {tag}
                    <button
                        type="button"
                        onClick={() => store.removeTag(tag)}
                        className="text-slate-400 hover:text-rose-600"
                    >
                        <X size={10} strokeWidth={3} />
                    </button>
                    </motion.div>
                ))}
                {(store.tags || []).length === 0 && (
                    <span className="text-[9px] font-bold text-slate-300 uppercase italic px-1">No tags added</span>
                )}
            </div>
            
            {(store.tags || []).length < 6 && (
            <div className="flex gap-2">
                <input
                type="text"
                placeholder="SPICY, BESTSELLER..."
                onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(e.currentTarget.value);
                    e.currentTarget.value = '';
                    }
                }}
                className="flex-1 h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest outline-none focus:border-orange-500 transition-all shadow-sm"
                />
            </div>
            )}
        </div>
      </div>

    </motion.div>
  );
}
