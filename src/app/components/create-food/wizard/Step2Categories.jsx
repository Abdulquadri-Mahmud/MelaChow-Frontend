"use client";

import { useEffect, useState } from "react";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import { useApi } from "@/app/context/ApiContext";
import { TokenManager } from "@/app/lib/auth-token";
import { getPlatformCategories, createVendorSection } from "@/app/lib/menuApi";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2, CheckCircle2, FolderTree, LayoutList } from "lucide-react";
import toast from "react-hot-toast";

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
  const store = useCreateFoodStore();
  const { vendorProfile } = useVendorProfile();
  const { baseUrl } = useApi();
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [sections, setSections] = useState([]);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Platform Category Selection */}
      <div className="group">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-slate-400 dark:text-slate-500 pl-1 transition-colors group-focus-within:text-orange-600">
          <FolderTree size={10} strokeWidth={3} />
          Platform Directory *
        </label>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-300">
            <Loader2 className="animate-spin mr-2" size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Loading taxonomy...</span>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-950/50 shadow-inner custom-scrollbar">
            {categories.map((category) => {
              const isActive = store.platform_category_id === category._id;
              return (
                <motion.button
                  key={category._id}
                  type="button"
                  onClick={() => {
                    store.setField('platform_category_id', category._id);
                    store.setField('platform_category_label', category.name);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${
                    isActive
                      ? 'border-orange-500 bg-white dark:bg-slate-900 text-orange-600 shadow-lg shadow-orange-500/10 scale-[1.01]'
                      : 'border-transparent hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:shadow-sm'
                  }`}
                  whileHover={!isActive ? { scale: 1.005 } : {}}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between">
                      <div>
                          <span className={`text-[9px] font-bold uppercase block leading-none mb-1.5 ${isActive ? 'text-orange-500/70' : 'opacity-50'}`}>
                              {category.parent_name}
                          </span>
                          <span className={`text-[13px] uppercase tracking-tight ${isActive ? 'font-black' : 'font-bold'}`}>
                              {category.name}
                          </span>
                      </div>
                      <div className={`transition-transform duration-300 ${isActive ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                          <CheckCircle2 size={18} strokeWidth={3} className="text-orange-500" />
                      </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Vendor Section Selection */}
      <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-slate-400 dark:text-slate-500 pl-1">
          <LayoutList size={10} strokeWidth={3} />
          Store Menu Placement (Optional)
        </label>

        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl min-h-[64px]">
                <button
                    onClick={() => {
                        store.setField('vendor_section_id', null);
                        store.setField('vendor_section_label', null);
                    }}
                    className={`h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        !store.vendor_section_id
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
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
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-orange-300 dark:hover:border-orange-500/50 hover:text-orange-600'
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
                        <div className="flex gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm mt-1">
                            <input
                                type="text"
                                autoFocus
                                value={newSectionName}
                                onChange={(e) => setNewSectionName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
                                placeholder="E.G. WEEKEND SPECIALS..."
                                className="flex-1 h-12 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                            />
                            <button
                                onClick={handleCreateSection}
                                disabled={isSavingSection || !newSectionName.trim()}
                                className="h-12 px-6 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black text-[10px] uppercase tracking-[0.15em] rounded-xl disabled:opacity-30 active:scale-95 transition-all shadow-xl shadow-slate-950/20"
                            >
                                {isSavingSection ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
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
