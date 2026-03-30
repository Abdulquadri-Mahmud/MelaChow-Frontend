'use client';

import { useState } from 'react';
import { useCreateComboStore } from '@/app/context/CreateComboStore';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { createComboItem, updateComboItem } from '@/app/lib/menuApi';

const GROUP_TITLE_PRESETS = {
  'Protein & Meat': ['Choose your protein', 'Choose your meat cut', 'Choose your meat'],
  'Swallows & Soups': ['Choose your swallow', 'Choose your soup'],
  'Rice & Pasta': ['Choose your rice type', 'Choose your pasta variant'],
  'Sides': ['Choose your side', 'Add a side dish'],
  'Sauce & Spice': ['Choose your sauce', 'Spice level'],
  'Drinks': ['Add a drink', 'Choose your drink'],
  'Extras & Toppings': ['Add toppings', 'Add extras'],
};

export default function Step4AddOnsAndReview() {
  const store = useCreateComboStore();
  const router = useRouter();
  const params = useParams();
  const vendorId = params?.vendorId;

  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [showGroupForm, setShowGroupForm] = useState(false);

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast.error('Group name required');
      return;
    }

    store.addChoiceGroup({
      tempId: Date.now().toString(),
      name: newGroupName,
      is_required: false,
      min_selections: 0,
      max_selections: 1,
      options: [],
    });

    setNewGroupName('');
    setShowGroupForm(false);
    toast.success('Choice group added');
  };

  const handleAddOption = (groupId, optionLabel, priceModifier = 0) => {
    if (!optionLabel.trim()) {
      toast.error('Option name required');
      return;
    }

    store.addChoiceOption(groupId, {
      tempId: Date.now().toString(),
      label: optionLabel,
      price_modifier_naira: Number(priceModifier) || 0,
      is_available: true,
    });
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!store.name.trim()) throw new Error('Combo name required');
      if (!store.image_url) throw new Error('Image required');
      if (!store.platform_category_id) throw new Error('Category required');
      if (!store.price_naira || Number(store.price_naira) <= 0) throw new Error('Valid price required');

      store.setSubmitting(true);

      const payload = {
        name: store.name,
        description: store.description,
        image_url: store.image_url,
        price_naira: Number(store.price_naira),
        dietary_type: store.dietary_type || 'mixed',
        prep_time_minutes: store.prep_time_minutes,
        tags: store.tags,
        contents: store.contents,
        platform_category_id: store.platform_category_id,
        vendor_section_id: store.vendor_section_id,
        choice_groups: store.choice_groups.map((group) => ({
          name: group.name,
          is_required: group.is_required,
          min_selections: group.min_selections,
          max_selections: group.max_selections,
          options: group.options.map((opt) => ({
            label: opt.label,
            price_modifier_naira: Number(opt.price_modifier_naira) || 0,
            is_available: opt.is_available,
          })),
        })),
      };

      let comboId;
      if (store._id) {
        // Edit mode
        await updateComboItem(store._id, payload);
        comboId = store._id;
        toast.success('Combo updated');
      } else {
        // Create mode
        const res = await createComboItem(vendorId, payload);
        comboId = res.comboItem._id;
        toast.success('Combo created');
      }

      store.resetStore();
      router.push(`/vendors/my-combos/${comboId}`);
    } catch (err) {
      toast.error(err.message || 'Failed to save combo');
      console.error(err);
    } finally {
      store.setSubmitting(false);
    }
  };

  const priceNum = Number(store.price_naira) || 0;
  const formattedPrice = priceNum.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ─────────────────────────────────────────────────────────────────────  */}
      {/* Choice Groups Section */}
      {/* ─────────────────────────────────────────────────────────────────────  */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Add-on Options (Optional)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Add customization options like protein choice, sauce level, etc.
        </p>

        {/* Existing Choice Groups */}
        <div className="space-y-3 mb-4">
          <AnimatePresence>
            {store.choice_groups.map((group) => (
              <motion.div
                key={group.tempId}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
              >
                {/* Group Header */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroupId(
                      expandedGroupId === group.tempId ? null : group.tempId
                    )
                  }
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {group.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {group.options.length} option{group.options.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        store.removeChoiceGroup(group.tempId);
                      }}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded"
                    >
                      <X size={16} />
                    </button>
                    <ChevronDown
                      size={20}
                      className={`transition ${
                        expandedGroupId === group.tempId ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Group Details */}
                <AnimatePresence>
                  {expandedGroupId === group.tempId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 border-t border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 space-y-4"
                    >
                      {/* Group Settings */}
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={group.is_required}
                            onChange={(e) =>
                              store.updateChoiceGroup(group.tempId, {
                                is_required: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Required
                          </span>
                        </label>
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400">
                            Max selections
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={group.max_selections}
                            onChange={(e) =>
                              store.updateChoiceGroup(group.tempId, {
                                max_selections: Number(e.target.value),
                              })
                            }
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Options List */}
                      <div>
                        <h5 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                          Options
                        </h5>
                        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                          {group.options.map((option) => (
                            <div
                              key={option.tempId}
                              className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm"
                            >
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {option.label}
                                </span>
                                {option.price_modifier_naira > 0 && (
                                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                                    +₦{option.price_modifier_naira}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  store.removeChoiceOption(group.tempId, option.tempId)
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add Option Form */}
                        <OptionForm
                          onAdd={(label, price) =>
                            handleAddOption(group.tempId, label, price)
                          }
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add New Group */}
        <AnimatePresence>
          {showGroupForm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-orange-300 dark:border-orange-700 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20 space-y-3"
            >
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., Choose your protein"
                className="w-full px-3 py-2 border border-orange-300 dark:border-orange-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
                >
                  Create Group
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewGroupName('');
                    setShowGroupForm(false);
                  }}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <button
              type="button"
              onClick={() => setShowGroupForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-orange-300 dark:border-orange-700 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition font-medium"
            >
              <Plus size={18} />
              Add Choice Group
            </button>
          )}
        </AnimatePresence>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────  */}
      {/* Review Section */}
      {/* ─────────────────────────────────────────────────────────────────────  */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Review Your Combo
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Name:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {store.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Price:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formattedPrice}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Category:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {store.platform_category_label}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Add-ons:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {store.choice_groups.length}
            </span>
          </div>
        </div>

        {store.contents.length > 0 && (
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              What's Included:
            </p>
            <div className="flex flex-wrap gap-1">
              {store.contents.map((item) => (
                <span
                  key={item}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => store.prevStep()}
          disabled={store.isSubmitting}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={store.isSubmitting}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
            store.isSubmitting
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {store.isSubmitting
            ? 'Saving...'
            : store._id
            ? 'Update Combo'
            : 'Create Combo'}
        </button>
      </div>
    </motion.div>
  );
}

function OptionForm({ onAdd }) {
  const [label, setLabel] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    onAdd(label, price);
    setLabel('');
    setPrice('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Option name"
        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500"
      />
      <input
        type="number"
        min="0"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price"
        className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500"
      />
      <button
        type="submit"
        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
      >
        <Plus size={16} />
      </button>
    </form>
  );
}
