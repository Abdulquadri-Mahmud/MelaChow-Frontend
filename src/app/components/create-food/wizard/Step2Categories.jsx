"use client";

import { useState, useEffect } from "react";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { getPlatformCategories, getVendorSections, createVendorSection } from "@/app/lib/menuApi";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import { CheckCircle2, Loader2, Plus, ArrowLeft, Search } from "lucide-react";
import toast from "react-hot-toast";

// Transform flat API array into { root, subCategories[] } tree
const buildCategoryTree = (flatCategories) => {
    const roots = [];
    const childrenMap = {};

    flatCategories.forEach(cat => {
        const parentId = cat.parent?._id || null;
        if (!parentId) {
            roots.push({ ...cat, subCategories: [] });
        } else {
            if (!childrenMap[parentId]) childrenMap[parentId] = [];
            childrenMap[parentId].push(cat);
        }
    });

    return roots
        .map(root => ({
            ...root,
            subCategories: childrenMap[root._id] || [],
        }))
        // Only show roots that have children — roots without children
        // are leaf categories themselves and cannot be assigned
        .filter(root => root.subCategories.length > 0);
};

const SECTION_TEMPLATES = [
    { label: "Rice Dishes", emoji: "🍛" },
    { label: "Soups & Swallows", emoji: "🥘" },
    { label: "Proteins & Grills", emoji: "🍗" },
    { label: "Sides & Extras", emoji: "🍟" },
    { label: "Drinks", emoji: "🥤" },
    { label: "Snacks", emoji: "🫘" },
    { label: "Breakfast", emoji: "🍳" },
    { label: "Desserts", emoji: "🍰" },
    { label: "Fast Food", emoji: "🍔" },
    { label: "Specials", emoji: "⭐" },
];

export default function Step2Categories({ onBack, onNext }) {
    const store = useCreateFoodStore();
    const { vendorProfile } = useVendorProfile();
    const vendorId = vendorProfile?._id || vendorProfile?.id;

    const [categoryTree, setCategoryTree] = useState([]);
    const [sections, setSections] = useState([]);
    const [loadingCats, setLoadingCats] = useState(true);
    const [loadingSecs, setLoadingSecs] = useState(true);
    const [activeRootId, setActiveRootId] = useState(null);
    const [search, setSearch] = useState("");

    const [showSectionForm, setShowSectionForm] = useState(false);
    const [newSectionName, setNewSectionName] = useState("");
    const [savingSection, setSavingSection] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const catRes = await getPlatformCategories();
                const flat = catRes.categories || [];
                const tree = buildCategoryTree(flat);
                setCategoryTree(tree);
                // Auto-select the first root tab
                if (tree.length > 0) setActiveRootId(tree[0]._id);
            } catch {
                toast.error("Failed to load categories");
            } finally {
                setLoadingCats(false);
            }

            if (vendorId) {
                try {
                    const secRes = await getVendorSections(vendorId);
                    setSections(secRes.sections || secRes.data || []);
                } catch {
                    toast.error("Failed to load your menu sections");
                } finally {
                    setLoadingSecs(false);
                }
            } else {
                setLoadingSecs(false);
            }
        };
        load();
    }, [vendorId]);

    // Active root category object
    const activeRoot = categoryTree.find(r => r._id === activeRootId);

    // Filter subcategories by search query
    const filteredSubs = search.trim()
        ? categoryTree.flatMap(r => r.subCategories).filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase())
        )
        : activeRoot?.subCategories || [];

    const handleSelectCategory = (sub, rootName) => {
        // Toggle: clicking the already-selected category deselects it
        if (store.platform_category_id === sub._id) {
            store.setField("platform_category_id", null);
            store.setField("platform_category_label", null);
        } else {
            store.setField("platform_category_id", sub._id);
            store.setField("platform_category_label", `${rootName} → ${sub.name}`);
        }
    };

    const handleCreateSection = async () => {
        if (!newSectionName.trim()) return;
        setSavingSection(true);
        try {
            const res = await createVendorSection(vendorId, newSectionName.trim());
            const created = res.section || res.data;
            setSections(prev => [...prev, created]);
            store.setField("vendor_section_id", created._id);
            store.setField("vendor_section_label", created.name);
            setShowSectionForm(false);
            setNewSectionName("");
            toast.success("Section created");
        } catch {
            toast.error("Failed to create section");
        } finally {
            setSavingSection(false);
        }
    };

    // Derive a smart suggestion from the category already selected above
    const suggestedSectionName = store.platform_category_label
        ? store.platform_category_label.split(" → ")[0]
        : null;

    // Suppress the suggestion if that section name already exists
    const suggestionAlreadyExists = sections.some(
        s => s.name.toLowerCase() === suggestedSectionName?.toLowerCase()
    );

    const handleQuickCreateSection = async (name) => {
        if (!name?.trim()) return;
        setSavingSection(true);
        try {
            const res = await createVendorSection(vendorId, name.trim());
            const created = res.section || res.data;
            setSections(prev => [...prev, created]);
            store.setField("vendor_section_id", created._id);
            store.setField("vendor_section_label", created.name);
            toast.success(`"${created.name}" section created`);
        } catch {
            toast.error("Couldn't create section. Please try again.");
        } finally {
            setSavingSection(false);
        }
    };

    const handleNext = () => {
        if (!store.platform_category_id) {
            toast.error("Please pick a specific type of food");
            return;
        }
        onNext();
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-2 lg:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* ── LEFT SIDE: PLATFORM CATEGORY (60% context) ─────────── */}
                <div className="lg:col-span-7 space-y-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                            Discovery Category
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Pick the specific category. This is how customers find your food.
                        </p>
                    </div>

                    {loadingCats ? (
                        <div className="h-48 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-800/20 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold text-sm">
                            <Loader2 className="animate-spin text-orange-500" size={24} /> 
                            <span>Loading global categories...</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Search bar */}
                            <div className="relative">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search food type... e.g. Jollof Rice, Suya"
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                />
                                {search && (
                                    <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 hover:text-slate-900 dark:hover:text-white tracking-widest uppercase">Clear</button>
                                )}
                            </div>

                            {/* Root Tabs */}
                            {!search && (
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                    {categoryTree.map(root => (
                                        <button
                                            key={root._id}
                                            onClick={() => setActiveRootId(root._id)}
                                            className={`shrink-0 h-10 px-4 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${activeRootId === root._id
                                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                                                }`}
                                        >
                                            {root.name}
                                            <span className={`ml-2 text-[10px] font-black ${activeRootId === root._id ? "opacity-60" : "opacity-40"}`}>
                                                {root.subCategories.length}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Subcategory Grid */}
                            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 min-h-[300px]">
                                {filteredSubs.length === 0 ? (
                                    <div className="h-40 flex items-center justify-center text-sm text-slate-400 dark:text-slate-500 font-medium">
                                        No results for "{search}"
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {filteredSubs.map(sub => {
                                            const isSelected = store.platform_category_id === sub._id;
                                            const parentName = search ? categoryTree.find(r => r.subCategories.some(s => s._id === sub._id))?.name : activeRoot?.name;

                                            return (
                                                <button
                                                    key={sub._id}
                                                    onClick={() => handleSelectCategory(sub, parentName)}
                                                    className={`group relative flex flex-col items-center gap-3 p-3 rounded-2xl border transition-all text-center ${isSelected
                                                        ? "bg-white dark:bg-slate-900 border-orange-500 dark:border-orange-500 shadow-xl shadow-orange-500/10 ring-2 ring-orange-500/20"
                                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500/40"
                                                        }`}
                                                >
                                                    <div className={`w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800 border transition-transform group-hover:scale-110 ${isSelected ? "border-orange-100 dark:border-orange-500/20" : "border-slate-100 dark:border-slate-700"}`}>
                                                        {sub.image ? <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" /> : <span className={`text-xl font-black ${isSelected ? "text-orange-500" : "text-slate-300"}`}>{sub.name.charAt(0)}</span>}
                                                    </div>
                                                    <span className={`text-xs font-black tracking-tight leading-tight line-clamp-2 ${isSelected ? "text-orange-600 dark:text-orange-400" : "text-slate-700 dark:text-slate-300"}`}>
                                                        {sub.name}
                                                    </span>
                                                    {isSelected && (
                                                        <span className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40">
                                                            <CheckCircle2 size={12} className="text-white" strokeWidth={3} />
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Selected Indicator */}
                            {store.platform_category_label && (
                                <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-2xl">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-orange-800 dark:text-orange-500/80 uppercase tracking-widest">Active Selection</span>
                                        <span className="text-base font-black text-orange-600 dark:text-orange-400">{store.platform_category_label}</span>
                                    </div>
                                    <CheckCircle2 className="text-orange-500" size={24} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── RIGHT SIDE: VENDOR ORGANIZATION (Sidebar) ─────────── */}
                <div className="lg:col-span-5 flex flex-col pt-4 lg:pt-0">
                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 lg:p-8 space-y-6 sticky top-6">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                                Menu Organization
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Organize this food into a section in your store.
                            </p>
                        </div>

                        {loadingSecs ? (
                            <div className="h-20 flex items-center gap-2 text-sm text-slate-400 font-bold justify-center">
                                <Loader2 size={18} className="animate-spin text-orange-500" /> 
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Clear Label */}
                                {store.vendor_section_id && (
                                    <button onClick={() => { store.setField("vendor_section_id", null); store.setField("vendor_section_label", null); }} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors">
                                        Remove from section
                                    </button>
                                )}

                                {/* Suggestion */}
                                {suggestedSectionName && !suggestionAlreadyExists && !store.vendor_section_id && (
                                    <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">💡</span>
                                            <p className="text-xs font-bold text-blue-800 dark:text-blue-300">Section Suggestion</p>
                                        </div>
                                        <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 font-medium leading-relaxed">We think "{suggestedSectionName}" would be a great fit for this food type.</p>
                                        <button onClick={() => handleQuickCreateSection(suggestedSectionName)} disabled={savingSection} className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center">
                                            {savingSection ? <Loader2 size={16} className="animate-spin" /> : <>Use "{suggestedSectionName}"</>}
                                        </button>
                                    </div>
                                )}

                                {/* List of sections */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">Your Current Sections</label>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => { store.setField("vendor_section_id", null); store.setField("vendor_section_label", null); }} className={`h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${!store.vendor_section_id ? "bg-slate-900 text-white border-slate-900" : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800"}`}>None</button>
                                        {sections.map(sec => {
                                            const isSelected = store.vendor_section_id === sec._id;
                                            return (
                                                <button key={sec._id} onClick={() => { if (isSelected) { store.setField("vendor_section_id", null); store.setField("vendor_section_label", null); } else { store.setField("vendor_section_id", sec._id); store.setField("vendor_section_label", sec.name); } }} className={`h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${isSelected ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"}`}>{sec.name}</button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Custom Toggle */}
                                {!showSectionForm ? (
                                    <button onClick={() => setShowSectionForm(true)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-colors pt-2">
                                        <Plus size={16} strokeWidth={3} /> Create New Section
                                    </button>
                                ) : (
                                    <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                                        <input type="text" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateSection()} placeholder="e.g. Weekend Specials" autoFocus className="w-full h-12 px-4 rounded-xl border border-orange-200 dark:border-orange-500/30 bg-white dark:bg-slate-900 text-sm font-bold focus:border-orange-500 outline-none transition-all" />
                                        <div className="flex gap-2">
                                            <button onClick={handleCreateSection} disabled={savingSection || !newSectionName.trim()} className="flex-1 h-10 bg-orange-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl disabled:opacity-50">{savingSection ? <Loader2 size={16} className="animate-spin" /> : "Create & Use"}</button>
                                            <button onClick={() => { setShowSectionForm(false); setNewSectionName(""); }} className="px-4 h-10 text-[10px] font-black uppercase tracking-widest text-slate-500">Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
