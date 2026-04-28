'use client';

import { useEffect, useState } from 'react';
import { useCreateComboStore } from '@/app/context/CreateComboStore';
import { useVendorProfile } from '@/app/context/VendorProfileContext';
import { useApi } from '@/app/context/ApiContext';
import { TokenManager } from '@/app/lib/auth-token';
import { createVendorSection } from '@/app/lib/menuApi';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, FolderTree, LayoutList } from 'lucide-react';
import toast from 'react-hot-toast';
import PlatformCategoryPicker from '@/app/components/shared/PlatformCategoryPicker';

export default function Step2Categories() {
  const store = useCreateComboStore();
  const { vendorProfile } = useVendorProfile();
  const { baseUrl } = useApi();

  const [sections, setSections] = useState([]);
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isSavingSection, setIsSavingSection] = useState(false);

  useEffect(() => {
    const vendorId = vendorProfile?._id || vendorProfile?.id;
    if (!vendorId) return;

    const fetchSections = async () => {
      try {
        const token = TokenManager.getToken('vendor');
        const res = await fetch(`/v1/menu/${vendorId}/sections`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch sections');
        const data = await res.json();
        setSections(data.sections || data.data || []);
      } catch (err) {
        console.error('Failed to load sections:', err);
      }
    };

    fetchSections();
  }, [vendorProfile, baseUrl]);

  const handleCreateSection = async () => {
    const vendorId = vendorProfile?._id || vendorProfile?.id;
    if (!newSectionName.trim() || !vendorId) return;

    setIsSavingSection(true);
    try {
      const res = await createVendorSection(vendorId, newSectionName.trim());
      const newSection = res.section || res.data;

      setSections((prev) => [...prev, newSection]);
      store.setField('vendor_section_id', newSection._id);
      store.setField('vendor_section_label', newSection.name);

      setNewSectionName('');
      setShowNewSectionForm(false);
      toast.success(`Section "${newSection.name}" created!`);
    } catch (err) {
      toast.error('Failed to create section');
      console.error(err);
    } finally {
      setIsSavingSection(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ── Platform Category Picker ── */}
      <div className="group">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-zinc-400 dark:text-zinc-500 pl-1 transition-colors group-focus-within:text-orange-600">
          <FolderTree size={10} strokeWidth={3} />
          Platform Directory *
        </label>
        <PlatformCategoryPicker
          value={store.platform_category_id}
          onChange={(id, name) => {
            store.setField('platform_category_id', id);
            store.setField('platform_category_label', name);
          }}
        />
      </div>

      {/* ── Vendor Section Selection ── */}
      <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-zinc-400 dark:text-zinc-500 pl-1">
          <LayoutList size={10} strokeWidth={3} />
          Store Menu Section (Optional)
        </label>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 p-3 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl min-h-[64px]">
            <button
              onClick={() => {
                store.setField('vendor_section_id', null);
                store.setField('vendor_section_label', null);
              }}
              className={`h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                !store.vendor_section_id
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
              }`}
            >
              Standard Feed
            </button>

            {sections.map((section) => {
              const isSelected = store.vendor_section_id === section._id;
              return (
                <button
                  key={section._id}
                  onClick={() => {
                    store.setField('vendor_section_id', isSelected ? null : section._id);
                    store.setField('vendor_section_label', isSelected ? null : section.name);
                  }}
                  className={`h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    isSelected
                      ? 'bg-orange-600 border-orange-600 text-white shadow-xl shadow-orange-500/20 scale-[1.02]'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-orange-300 dark:hover:border-orange-500/50 hover:text-orange-600'
                  }`}
                >
                  {section.name}
                </button>
              );
            })}

            <button
              onClick={() => setShowNewSectionForm(!showNewSectionForm)}
              className="h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-orange-300 dark:border-orange-900/50 text-orange-600 flex items-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-600/10 hover:border-orange-500 transition-all"
            >
              <Plus size={14} strokeWidth={3} />
              New Section
            </button>
          </div>

          <AnimatePresence>
            {showNewSectionForm && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.98 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.98 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm mt-1">
                  <input
                    type="text"
                    autoFocus
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
                    placeholder="E.G. LUNCH DEALS..."
                    className="flex-1 h-12 px-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                  />
                  <button
                    onClick={handleCreateSection}
                    disabled={isSavingSection || !newSectionName.trim()}
                    className="h-12 px-8 bg-orange-600 hover:bg-orange-700 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl disabled:opacity-30 active:scale-95 transition-all shadow-xl shadow-orange-600/20"
                  >
                    {isSavingSection ? <Loader2 size={16} className="animate-spin" /> : 'Create Section'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
