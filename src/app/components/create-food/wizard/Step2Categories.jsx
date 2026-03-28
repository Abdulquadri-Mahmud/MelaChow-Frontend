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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-2 md:p-6 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                
                {/* ── LEFT SIDE: PLATFORM CATEGORY (Discovery) ─────────── */}
                <div className="lg:col-span-7 space-y-6">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase">Where should this appear?</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-[0.15em] leading-relaxed">Pick a category so customers can easily find your dish when searching or browsing.</p>
                    </div>

                    {loadingCats ? (
                        <div className="h-48 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-950 rounded-md border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest">
                            <Loader2 className="animate-spin text-orange-600" size={24} /> 
                            <span>Loading categories...</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Search bar */}
                            <div className="relative">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="SEARCH CATEGORIES (E.G. RICE, PIZZA)..."
                                    className="w-full h-12 pl-12 pr-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-600/5 transition-all"
                                />
                                {search && (
                                    <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 hover:text-orange-600 tracking-widest uppercase bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md">Clear</button>
                                )}
                            </div>

                            {/* Root Tabs */}
                            {!search && (
                                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                    {categoryTree.map(root => (
                                        <button
                                            key={root._id}
                                            onClick={() => setActiveRootId(root._id)}
                                            className={`shrink-0 h-8 px-4 rounded-md text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${activeRootId === root._id
                                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                                                : "bg-white dark:bg-slate-950 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-800 hover:border-slate-300"
                                                }`}
                                        >
                                            {root.name}
                                            <span className={`ml-2 px-1 rounded-md ${activeRootId === root._id ? "bg-orange-600 text-white" : "bg-slate-100 dark:bg-slate-900 text-slate-400"}`}>
                                                {root.subCategories.length}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Subcategory Grid */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-slate-100 dark:border-slate-800 min-h-[140px]">
                                {filteredSubs.length === 0 ? (
                                    <div className="h-40 flex items-center justify-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                        No matches for "{search}"
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-3">
                                        {filteredSubs.map(sub => {
                                            const isSelected = store.platform_category_id === sub._id;
                                            const parentName = search ? categoryTree.find(r => r.subCategories.some(s => s._id === sub._id))?.name : activeRoot?.name;

                                            return (
                                                <button
                                                    key={sub._id}
                                                    onClick={() => handleSelectCategory(sub, parentName)}
                                                    className={`group relative flex flex-col items-center gap-3 p-3 rounded-md border transition-all text-center ${isSelected
                                                        ? "bg-white dark:bg-slate-950 border-orange-600 ring-4 ring-orange-600/5 shadow-none"
                                                        : "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-600/30"
                                                        }`}
                                                >
                                                    <div className={`w-12 h-12 rounded-md overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-900 border ${isSelected ? "border-orange-600/20" : "border-slate-100 dark:border-slate-800"}`}>
                                                        {sub.image ? <img src={sub.image} alt={sub.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" /> : <span className={`text-lg font-black ${isSelected ? "text-orange-600" : "text-slate-300"}`}>{sub.name.charAt(0)}</span>}
                                                    </div>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest leading-tight line-clamp-2 ${isSelected ? "text-orange-600" : "text-slate-500 dark:text-slate-400"}`}>
                                                        {sub.name}
                                                    </span>
                                                    {isSelected && (
                                                        <span className="absolute top-1.5 right-1.5 p-0.5 bg-orange-600 rounded-md">
                                                            <CheckCircle2 size={10} className="text-white" strokeWidth={4} />
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
                                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950 border-2 border-orange-600 rounded-md shadow-none animate-in zoom-in-95">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Selected Category</span>
                                        <span className="text-sm font-black text-orange-600 uppercase tracking-tight">{store.platform_category_label}</span>
                                    </div>
                                    <div className="h-10 w-10 bg-orange-600 text-white rounded-md flex items-center justify-center">
                                        <CheckCircle2 size={24} strokeWidth={3} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── RIGHT SIDE: VENDOR ORGANIZATION ─────────── */}
                <div className="lg:col-span-5 flex flex-col pt-4 lg:pt-0">
                    <div className="bg-white dark:bg-slate-950 rounded-md border border-slate-200 dark:border-slate-800 p-6 space-y-6 sticky top-6">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase">Your Menu Sections</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-[0.15em] leading-relaxed">Which part of your menu does this belong to? (e.g. Breakfast, Mains)</p>
                        </div>

                        {loadingSecs ? (
                            <div className="h-20 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 justify-center">
                                <Loader2 size={18} className="animate-spin text-orange-600" /> 
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Clear Selection */}
                                {store.vendor_section_id && (
                                    <button onClick={() => { store.setField("vendor_section_id", null); store.setField("vendor_section_label", null); }} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-600 transition-colors bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-md border border-slate-100 dark:border-slate-800">
                                        Clear Selection
                                    </button>
                                )}

                                {/* Suggestion */}
                                {suggestedSectionName && !suggestionAlreadyExists && !store.vendor_section_id && (
                                    <div className="p-4 bg-orange-600 text-white rounded-md space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-[10px] uppercase tracking-widest">Suggested Section:</span>
                                        </div>
                                        <p className="text-[11px] font-bold uppercase tracking-widest leading-relaxed">We think "{suggestedSectionName}" is a great fit for this dish.</p>
                                        <button onClick={() => handleQuickCreateSection(suggestedSectionName)} disabled={savingSection} className="w-full h-10 bg-white text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-slate-50 transition-all flex items-center justify-center">
                                            {savingSection ? <Loader2 size={16} className="animate-spin" /> : <>Create "{suggestedSectionName}"</>}
                                        </button>
                                    </div>
                                )}

                                {/* List of sections */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-300 block">Available Sections</label>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => { store.setField("vendor_section_id", null); store.setField("vendor_section_label", null); }} className={`h-10 px-4 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all ${!store.vendor_section_id ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent" : "bg-white dark:bg-slate-950 text-slate-400 border-slate-100 dark:border-slate-800"}`}>Default / None</button>
                                        {sections.map(sec => {
                                            const isSelected = store.vendor_section_id === sec._id;
                                            return (
                                                <button key={sec._id} onClick={() => { if (isSelected) { store.setField("vendor_section_id", null); store.setField("vendor_section_label", null); } else { store.setField("vendor_section_id", sec._id); store.setField("vendor_section_label", sec.name); } }} className={`h-10 px-4 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all ${isSelected ? "bg-orange-600 text-white border-transparent" : "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-300"}`}>{sec.name}</button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Custom Creation */}
                                {!showSectionForm ? (
                                    <button onClick={() => setShowSectionForm(true)} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700 transition-colors py-3 border-t border-slate-100 dark:border-slate-800 w-full">
                                        <Plus size={14} strokeWidth={3} /> Create a New Section
                                    </button>
                                ) : (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <input type="text" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateSection()} placeholder="e.g. Weekend Specials, Cold Drinks..." autoFocus className="w-full h-12 px-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[11px] font-black uppercase tracking-widest focus:border-orange-600 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700" />
                                        <div className="flex gap-2">
                                            <button onClick={handleCreateSection} disabled={savingSection || !newSectionName.trim()} className="flex-1 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[9px] uppercase tracking-widest rounded-md disabled:opacity-30">{savingSection ? <Loader2 size={16} className="animate-spin text-orange-600" /> : "Create Section"}</button>
                                            <button onClick={() => { setShowSectionForm(false); setNewSectionName(""); }} className="px-4 h-10 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancel</button>
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
