'use client';

import { useState } from 'react';
import { useCreateComboStore } from '@/app/context/CreateComboStore';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Step3Pricing() {
  const store = useCreateComboStore();
  const [contentInput, setContentInput] = useState('');

  const handleAddContent = () => {
    if (contentInput.trim()) {
      store.addContent(contentInput.trim());
      setContentInput('');
    }
  };

  const priceNum = parseFloat(store.price_naira) || 0;
  const isReadyForNext = priceNum > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Combo Price */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Combo Price (₦) *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-900 dark:text-white">
            ₦
          </span>
          <input
            type="number"
            min="0"
            step="100"
            value={store.price_naira}
            onChange={(e) => store.setField('price_naira', e.target.value)}
            placeholder="Enter combo price"
            className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg font-semibold"
          />
        </div>
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          This is the full price of the combo. Customers will see this amount.
        </p>
      </div>

      {/* Contents List */}
      <div>
        <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          What's Included (Optional)
        </label>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          List what's included in this combo — customers will see this
        </p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {store.contents.map((item) => (
            <motion.div
              key={item}
              layoutId={item}
              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
            >
              {item}
              <button
                type="button"
                onClick={() => store.removeContent(item)}
                className="hover:text-blue-900 dark:hover:text-blue-200"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={contentInput}
            onChange={(e) => setContentInput(e.target.value)}
            placeholder="e.g., Rice, Plantain, Chicken Lap"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddContent();
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          />
          <button
            type="button"
            onClick={handleAddContent}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition"
          >
            Add
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => store.prevStep()}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
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
