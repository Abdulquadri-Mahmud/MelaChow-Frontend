"use client";

import { useEffect, useState } from "react";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import { useApi } from "@/app/context/ApiContext";
import { TokenManager } from "@/app/lib/auth-token";
import { getPlatformCategories, createVendorSection } from "@/app/lib/menuApi";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2, CheckCircle2, FolderTree, LayoutList, ChevronDown, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

// Transform flat API array into a tree: each root has subCategories[]
// All roots are included (even those without children — they're selectable leaf-parents)
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

    return roots.map(root => ({
        ...root,
        subCategories: childrenMap[root._id] || [],
    }));
};

export default function Step2Categories() {
  const store = useCreateFoodStore();
  const { vendorProfile } = useVendorProfile();
  const { baseUrl } = useApi();
  
  const [loading, setLoading] = useState(false);
  const [categoryTree, setCategoryTree] = useState([]);
  const [sections, setSections] = useState([]);
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isSavingSection, setIsSavingSection] = useState(false);
  // Track which parent groups are expanded to show their children
  const [expandedParents, setExpandedParents] = useState({});

  useEffect(() => {
    const vendorId = vendorProfile?._id || vendorProfile?.id;
    if (!vendorId) return;

    const fetchCategories = async () => {
      setLoading(true);
      try {
        const catRes = await getPlatformCategories();
        const flat = catRes.categories || catRes.data || [];
        const tree = buildCategoryTree(flat);
        setCategoryTree(tree);

        // Auto-expand all groups that have children by default
        const expanded = {};
        tree.forEach(root => {
          if (root.subCategories.length > 0) expanded[root._id] = true;
        });
        setExpandedParents(expanded);
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

  const toggleExpanded = (parentId) => {
    setExpandedParents(prev => ({ ...prev, [parentId]: !prev[parentId] }));
  };

  const handleSelectCategory = (id, name) => {
    store.setField('platform_category_id', id);
    store.setField('platform_category_label', name);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Platform Category Selection */}
      <div className="group">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-zinc-400 dark:text-zinc-500 pl-1 transition-colors group-focus-within:text-orange-600">
          <FolderTree size={10} strokeWidth={3} />
          Platform Directory *
        </label>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-zinc-300">
            <Loader2 className="animate-spin mr-2" size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Loading taxonomy...</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 bg-zinc-50/50 dark:bg-zinc-950/50 shadow-inner custom-scrollbar">
            {categoryTree.map((parent) => {
              const isParentActive = store.platform_category_id === parent._id;
              const isExpanded = expandedParents[parent._id];
              const hasChildren = parent.subCategories.length > 0;

              return (
                <div key={parent._id} className="space-y-1">
                  {/* ── Parent Category Row ── */}
                  <div className="flex items-center gap-1.5">
                    {/* Expand/collapse toggle — only visible if parent has children */}
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(parent._id)}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-orange-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                      >
                        {isExpanded
                          ? <ChevronDown size={12} strokeWidth={3} />
                          : <ChevronRight size={12} strokeWidth={3} />
                        }
                      </button>
                    ) : (
                      <div className="flex-shrink-0 w-6" />
                    )}

                    {/* Selectable parent card */}
                    <motion.button
                      type="button"
                      onClick={() => handleSelectCategory(parent._id, parent.name)}
                      className={`flex-1 text-left px-4 py-3 rounded-xl transition-all border ${
                        isParentActive
                          ? 'border-orange-500 bg-white dark:bg-zinc-900 text-orange-600 shadow-lg shadow-orange-500/10 scale-[1.005]'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-orange-300 dark:hover:border-orange-500/40 hover:shadow-sm'
                      }`}
                      whileHover={!isParentActive ? { scale: 1.003 } : {}}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {/* Visual indicator that this is a parent group */}
                          <div className={`w-1.5 h-6 rounded-full flex-shrink-0 ${isParentActive ? 'bg-orange-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                          <div>
                            <span className={`text-[9px] font-black uppercase tracking-widest block leading-none mb-1 ${isParentActive ? 'text-orange-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                              Category Group
                            </span>
                            <span className={`text-[13px] uppercase tracking-tight ${isParentActive ? 'font-black' : 'font-bold'}`}>
                              {parent.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasChildren && (
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">
                              {parent.subCategories.length} sub
                            </span>
                          )}
                          <div className={`transition-transform duration-300 ${isParentActive ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                            <CheckCircle2 size={18} strokeWidth={3} className="text-orange-500" />
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  </div>

                  {/* ── Children (sub-categories) ── */}
                  <AnimatePresence>
                    {hasChildren && isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-8 space-y-1 pl-3 border-l-2 border-zinc-100 dark:border-zinc-800">
                          {parent.subCategories.map((child) => {
                            const isChildActive = store.platform_category_id === child._id;
                            return (
                              <motion.button
                                key={child._id}
                                type="button"
                                onClick={() => handleSelectCategory(child._id, child.name)}
                                className={`w-full text-left px-4 py-2.5 rounded-xl transition-all border ${
                                  isChildActive
                                    ? 'border-orange-500 bg-white dark:bg-zinc-900 text-orange-600 shadow-lg shadow-orange-500/10 scale-[1.01]'
                                    : 'border-transparent hover:bg-white dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:shadow-sm hover:border-zinc-200 dark:hover:border-zinc-700'
                                }`}
                                whileHover={!isChildActive ? { scale: 1.005 } : {}}
                                whileTap={{ scale: 0.99 }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className={`text-[9px] font-bold uppercase block leading-none mb-1 ${isChildActive ? 'text-orange-500/70' : 'opacity-40'}`}>
                                      {parent.name}
                                    </span>
                                    <span className={`text-[12px] uppercase tracking-tight ${isChildActive ? 'font-black' : 'font-bold'}`}>
                                      {child.name}
                                    </span>
                                  </div>
                                  <div className={`transition-transform duration-300 ${isChildActive ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                                    <CheckCircle2 size={16} strokeWidth={3} className="text-orange-500" />
                                  </div>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected category confirmation */}
        {store.platform_category_label && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-orange-500/5 border border-orange-500/20 rounded-xl">
            <CheckCircle2 size={12} className="text-orange-500 flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
              Selected: {store.platform_category_label}
            </span>
          </div>
        )}
      </div>

      {/* Vendor Section Selection */}
      <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-zinc-400 dark:text-zinc-500 pl-1">
          <LayoutList size={10} strokeWidth={3} />
          Store Menu Placement (Optional)
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
                                placeholder="E.G. WEEKEND SPECIALS..."
                                className="flex-1 h-12 px-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                            />
                            <button
                                onClick={handleCreateSection}
                                disabled={isSavingSection || !newSectionName.trim()}
                                className="h-12 px-6 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-black text-[10px] uppercase tracking-[0.15em] rounded-xl disabled:opacity-30 active:scale-95 transition-all shadow-xl shadow-zinc-950/20"
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
