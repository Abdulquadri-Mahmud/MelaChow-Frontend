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
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Combo Price */}
      <div className="bg-zinc-50/50 dark:bg-zinc-950/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
        <label className="block text-[11px] font-black uppercase tracking-widest mb-3 text-zinc-500 dark:text-zinc-400 pl-1">
          Base Combo Pricing *
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
            <span className="text-xl font-black text-orange-600 leading-none">₦</span>
            <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <input
            type="number"
            min="0"
            step="100"
            value={store.price_naira}
            onChange={(e) => store.setField('price_naira', e.target.value)}
            placeholder="0.00"
            className="w-full pl-12 pr-4 h-14 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none text-xl font-black tabular-nums transition-all shadow-sm"
          />
        </div>
        <p className="mt-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1 leading-normal">
          This is the primary price. Extra fees from choices will be added on top.
        </p>
      </div>

      {/* Contents List */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-50 dark:border-zinc-800/50">
        <label className="block text-[11px] font-black uppercase tracking-widest mb-1.5 text-zinc-500 dark:text-zinc-400 pl-1">
          Combo Components
        </label>
        <p className="text-[10px] font-medium text-zinc-400 mb-4 pl-1">
          Briefly list what's static in this bundle (e.g. 1X COKE, 2X JELLOF).
        </p>
        
        <div className="flex flex-wrap gap-1.5 mb-4 min-h-[40px]">
          {store.contents.length === 0 && (
             <span className="text-[10px] font-black text-zinc-200 uppercase tracking-widest mt-2 italic">Nothing listed yet</span>
          )}
          {store.contents.map((item) => (
            <motion.div
              layout
              key={item}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/5 dark:bg-orange-600/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 rounded-lg"
            >
              <span className="text-[10px] font-black uppercase tracking-tight">{item}</span>
              <button
                type="button"
                onClick={() => store.removeContent(item)}
                className="hover:text-rose-600 active:scale-90"
              >
                <X size={12} strokeWidth={3} />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2 p-2 bg-zinc-50/50 dark:bg-zinc-950/50 rounded-lg border border-zinc-100 dark:border-zinc-800 focus-within:border-orange-500/50">
          <input
            type="text"
            value={contentInput}
            onChange={(e) => setContentInput(e.target.value)}
            placeholder="ADD COMPONENT..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddContent();
              }
            }}
            className="flex-1 px-3 h-10 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-md text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white placeholder-zinc-300 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 transition-all"
          />
          <button
            type="button"
            onClick={handleAddContent}
            disabled={!contentInput.trim()}
            className="px-6 h-10 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 shadow-lg shadow-orange-600/20"
          >
            Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}
