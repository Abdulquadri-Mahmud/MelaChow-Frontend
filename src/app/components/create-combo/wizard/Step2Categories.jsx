'use client';

import { useEffect, useState } from 'react';
import { useCreateComboStore } from '@/app/context/CreateComboStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Step2Categories() {
  const store = useCreateComboStore();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [sections, setSections] = useState([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [expandedParentId, setExpandedParentId] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/categories/tree');
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        // Flatten parent → child structure for easy selection
        const flattened = [];
        data.forEach((parent) => {
          if (parent.children && parent.children.length > 0) {
            parent.children.forEach((child) => {
              flattened.push({
                ...child,
                parent_name: parent.name,
                parent_id: parent._id,
              });
            });
          }
        });
        setCategories(flattened);
      } catch (err) {
        toast.error('Failed to load categories');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSections = async () => {
      try {
        // This assumes vendor context is available in the request
        const res = await fetch('/api/vendors/sections');
        if (!res.ok) throw new Error('Failed to fetch sections');
        const data = await res.json();
        setSections(data.sections || []);
      } catch (err) {
        console.error('Failed to load sections:', err);
      }
    };

    fetchCategories();
    fetchSections();
  }, []);

  const selected = categories.find((c) => c._id === store.platform_category_id);

  const isReadyForNext = store.platform_category_id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Platform Category Selection */}
      <div>
        <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          Platform Category *
        </label>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading categories...</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
            {categories.map((category) => (
              <motion.button
                key={category._id}
                type="button"
                onClick={() => {
                  store.setField('platform_category_id', category._id);
                  store.setField('platform_category_label', category.name);
                }}
                whileHover={{ x: 4 }}
                className={`w-full text-left px-3 py-2 rounded-lg transition border ${
                  store.platform_category_id === category._id
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium'
                    : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div>
                  <span className="text-gray-400 text-xs">
                    {category.parent_name} /
                  </span>
                  {' '}
                  {category.name}
                </div>
              </motion.button>
            ))}
          </div>
        )}
        {selected && (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Selected: {selected.parent_name} / <span className="font-medium">{selected.name}</span>
          </div>
        )}
      </div>

      {/* Vendor Section Selection (Optional) */}
      <div>
        <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          Vendor Section (Optional)
        </label>
        <select
          value={store.vendor_section_id || ''}
          onChange={(e) => {
            const sectionId = e.target.value;
            const section = sections.find((s) => s._id === sectionId);
            store.setField('vendor_section_id', sectionId || null);
            store.setField('vendor_section_label', section?.name || null);
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">— None Selected —</option>
          {sections.map((section) => (
            <option key={section._id} value={section._id}>
              {section.name}
            </option>
          ))}
        </select>
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
