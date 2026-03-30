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

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const { imageUrl } = await res.json();
      store.setField('image_url', imageUrl);
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Name */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Combo Name *
        </label>
        <input
          type="text"
          value={store.name}
          onChange={(e) => store.setField('name', e.target.value)}
          placeholder="e.g., Rice & Chicken Combo"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          value={store.description}
          onChange={(e) => store.setField('description', e.target.value)}
          placeholder="e.g., Rice + Plantain + Chicken Lap with special sauce"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Combo Image *
        </label>
        {store.image_url ? (
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            <Image
              src={store.image_url}
              alt="combo"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => store.setField('image_url', null)}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition">
            <div className="flex flex-col items-center justify-center">
              <Upload size={24} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {uploading ? 'Uploading...' : 'Click to upload image'}
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

      {/* Dietary Type */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Dietary Type *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DIETARY_OPTIONS.map((option) => (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => store.setField('dietary_type', option.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                store.dietary_type === option.value
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-orange-400'
              }`}
            >
              {option.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Prep Time */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Prep Time (minutes)
        </label>
        <input
          type="number"
          min="0"
          max="180"
          value={store.prep_time_minutes || ''}
          onChange={(e) =>
            store.setField('prep_time_minutes', e.target.value ? Number(e.target.value) : null)
          }
          placeholder="e.g., 15"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Tags (max 6)
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(store.tags || []).map((tag) => (
            <motion.div
              key={tag}
              layoutId={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => store.removeTag(tag)}
                className="hover:text-orange-900 dark:hover:text-orange-200"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}\n        </div>
        {(store.tags || []).length < 6 && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a tag (popular, spicy, bestseller, etc.)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
            <button
              type="button"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling;
                if (input instanceof HTMLInputElement) {
                  handleAddTag(input.value);
                  input.value = '';
                }
              }}
              className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          disabled
          className="px-4 py-2 text-gray-400 cursor-not-allowed"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => store.nextStep()}
          disabled={!isReadyForNext}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
            isReadyForNext
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next →
        </button>
      </div>
    </motion.div>
  );
}
