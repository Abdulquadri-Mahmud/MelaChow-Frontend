'use client';

import { useEffect, useState } from 'react';
import { useCreateComboStore } from '@/app/context/CreateComboStore';
import { useVendorProfile } from '@/app/context/VendorProfileContext';
import { useApi } from '@/app/context/ApiContext';
import { TokenManager } from '@/app/lib/auth-token';
import { getPlatformCategories, createVendorSection } from '@/app/lib/menuApi';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, LayoutGrid, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Transform flat API array into { root, subCategories[] } tree
const buildCategoryTree = (flatCategories) => {
    const roots = [];
    const childrenMap = {};

    flatCategories.forEach(cat => {
        const parentId = cat.parent?._id || cat.parent || null;
        if (!parentId) {
            roots.push({ ...cat, subCategories: [] });
        } else {
            const pid = typeof parentId === 'object' ? parentId._id : parentId;
            if (!childrenMap[pid]) childrenMap[pid] = [];
            childrenMap[pid].push(cat);
        }
    });

    return roots
        .map(root => ({
            ...root,
            subCategories: childrenMap[root._id] || [],
        }))
        // Only show roots that have children
        .filter(root => root.subCategories.length > 0);
};

export default function Step2Categories() {
  const store = useCreateComboStore();
  const { vendorProfile } = useVendorProfile();
  const { baseUrl } = useApi();
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [sections, setSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isSavingSection, setIsSavingSection] = useState(false);

  useEffect(() => {
    const vendorId = vendorProfile?._id || vendorProfile?.id;
    if (!vendorId) return;

    const fetchCategories = async () => {
      setLoading(true);
      try {
        const catRes = await getPlatformCategories();
        const flat = catRes.categories || catRes.data || [];
        const tree = buildCategoryTree(flat);
        
        // Flatten for the simple list display we used before, 
        // OR we can switch to the tabbed UI from create-food.
        // Let's stick to the current UI but fix the data source.
        const flattened = [];
        tree.forEach((root) => {
            root.subCategories.forEach((sub) => {
              flattened.push({
                ...sub,
                parent_name: root.name,
                parent_id: root._id,
              });
            });
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
        const token = TokenManager.getToken('vendor');
        const res = await fetch(`/v1/menu/${vendorId}/sections`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to fetch sections');
        const data = await res.json();
        setSections(data.sections || data.data || []);
      } catch (err) {
        console.error('Failed to load sections:', err);
      }
    };

    fetchCategories();
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

  const selected = categories.find((c) => c._id === store.platform_category_id);

  const isReadyForNext = store.platform_category_id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Platform Category Selection */}
      <div>
        <label className="block text-[11px] font-black uppercase tracking-widest mb-1.5 text-slate-500 dark:text-slate-400 pl-1">
          Platform Category *
        </label>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-300">
            <Loader2 className="animate-spin mr-2" size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Loading...</span>
          </div>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/30 dark:bg-slate-950/30">
            {categories.map((category) => (
              <motion.button
                key={category._id}
                type="button"
                onClick={() => {
                  store.setField('platform_category_id', category._id);
                  store.setField('platform_category_label', category.name);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all border ${
                  store.platform_category_id === category._id
                    ? 'border-orange-500 bg-white dark:bg-slate-900 text-orange-600 shadow-sm'
                    : 'border-transparent hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-[9px] font-bold opacity-50 uppercase block leading-none mb-1">
                            {category.parent_name}
                        </span>
                        <span className={`text-xs uppercase tracking-tight ${store.platform_category_id === category._id ? 'font-black' : 'font-bold'}`}>
                            {category.name}
                        </span>
                    </div>
                    {store.platform_category_id === category._id && (
                        <CheckCircle2 size={14} strokeWidth={3} className="text-orange-500" />
                    )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Vendor Section Selection */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <label className="block text-[11px] font-black uppercase tracking-widest mb-3 text-slate-500 dark:text-slate-400 pl-1">
          Store Menu Section (Optional)
        </label>

        <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl">
                <button
                    onClick={() => {
                        store.setField('vendor_section_id', null);
                        store.setField('vendor_section_label', null);
                    }}
                    className={`h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        !store.vendor_section_id
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                    Default
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
                            className={`h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                                isSelected
                                ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-500/20'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-orange-200'
                            }`}
                        >
                            {section.name}
                        </button>
                    );
                })}

                <button
                    onClick={() => setShowNewSectionForm(!showNewSectionForm)}
                    className="h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest border border-dashed border-orange-300 dark:border-orange-800 text-orange-600 flex items-center gap-1.5 hover:bg-orange-50 dark:hover:bg-orange-950/50 transition-all"
                >
                    <Plus size={12} strokeWidth={3} />
                    New Section
                </button>
            </div>

            <AnimatePresence>
                {showNewSectionForm && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                    >
                        <div className="flex gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm">
                            <input
                                type="text"
                                autoFocus
                                value={newSectionName}
                                onChange={(e) => setNewSectionName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
                                placeholder="E.G. LUNCH DEALS..."
                                className="flex-1 h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest outline-none focus:border-orange-600 transition-colors"
                            />
                            <button
                                onClick={handleCreateSection}
                                disabled={isSavingSection || !newSectionName.trim()}
                                className="h-9 px-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black text-[9px] uppercase tracking-widest rounded-lg disabled:opacity-30 active:scale-95 transition-all"
                            >
                                {isSavingSection ? <Loader2 size={12} className="animate-spin" /> : 'Create'}
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
