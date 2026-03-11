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
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

            {/* ── SECTION 1: PLATFORM CATEGORY ──────────────────────── */}
            <div className="space-y-5">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                        What type of food is this?
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Pick the specific category. This is how customers discover your food.
                    </p>
                </div>

                {loadingCats ? (
                    <div className="h-32 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 font-bold text-sm">
                        <Loader2 className="animate-spin text-orange-500" size={20} /> Loading categories...
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Search bar — searches across ALL subcategories */}
                        <div className="relative">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search food type... e.g. Jollof Rice, Suya"
                                className="w-full h-12 pl-10 pr-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors text-xs font-bold"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Root Category Tab Strip — hidden when searching */}
                        {!search && (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                {categoryTree.map(root => (
                                    <button
                                        key={root._id}
                                        onClick={() => setActiveRootId(root._id)}
                                        className={`shrink-0 h-9 px-4 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${activeRootId === root._id
                                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                                            }`}
                                    >
                                        {root.name}
                                        <span className={`ml-1.5 text-[9px] font-black ${activeRootId === root._id ? "opacity-60" : "opacity-40"
                                            }`}>
                                            {root.subCategories.length}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Subcategory Chip Grid */}
                        <div className="min-h-[120px] p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                            {filteredSubs.length === 0 ? (
                                <div className="h-24 flex items-center justify-center text-sm text-slate-400 dark:text-slate-500 font-medium">
                                    {search ? `No results for "${search}"` : "No subcategories"}
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                    {filteredSubs.map(sub => {
                                        const isSelected = store.platform_category_id === sub._id;
                                        const parentName = search
                                            ? categoryTree.find(r =>
                                                r.subCategories.some(s => s._id === sub._id)
                                            )?.name
                                            : activeRoot?.name;

                                        return (
                                            <button
                                                key={sub._id}
                                                onClick={() => handleSelectCategory(sub, parentName)}
                                                className={`relative flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all text-center ${isSelected
                                                    ? "bg-orange-50 dark:bg-orange-500/10 border-orange-400 dark:border-orange-500/60 shadow-md shadow-orange-500/10 ring-2 ring-orange-500/30"
                                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-500/40"
                                                    }`}
                                            >
                                                {/* Image */}
                                                <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 border ${isSelected ? "border-orange-200 dark:border-orange-500/30" : "border-slate-100 dark:border-slate-700"
                                                    }`}>
                                                    {sub.image ? (
                                                        <img
                                                            src={sub.image}
                                                            alt={sub.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className={`text-lg font-black ${isSelected ? "text-orange-500" : "text-slate-400"
                                                            }`}>
                                                            {sub.name.charAt(0)}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Name */}
                                                <span className={`text-[11px] font-bold leading-tight line-clamp-2 ${isSelected ? "text-orange-600 dark:text-orange-400" : "text-slate-700 dark:text-slate-300"
                                                    }`}>
                                                    {sub.name}
                                                </span>

                                                {/* Selected tick */}
                                                {isSelected && (
                                                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                                        <CheckCircle2 size={11} className="text-white" strokeWidth={3} />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Selected Badge */}
                        {store.platform_category_label && (
                            <div className="flex items-center justify-between p-3 px-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-xl">
                                <span className="text-[10px] font-black text-orange-800 dark:text-orange-500/80 uppercase tracking-widest">
                                    Selected
                                </span>
                                <span className="text-sm font-black text-orange-600 dark:text-orange-400">
                                    {store.platform_category_label}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── SECTION 2: VENDOR SECTIONS ────────────────────────── */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-1">
                            Group this food under a section
                            <span className="ml-2 text-slate-400 dark:text-slate-500 font-medium text-sm normal-case tracking-normal">Optional</span>
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Sections help customers browse your menu. You can always change this later.
                        </p>
                    </div>

                    {/* Clear button — only shows when something is selected */}
                    {store.vendor_section_id && (
                        <button
                            onClick={() => {
                                store.setField("vendor_section_id", null);
                                store.setField("vendor_section_label", null);
                            }}
                            className="shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors pt-1"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {loadingSecs ? (
                    <div className="h-12 flex items-center gap-2 text-sm text-slate-400 font-bold">
                        <Loader2 size={16} className="animate-spin" /> Loading...
                    </div>
                ) : (
                    <div className="space-y-4">

                        {/* ── 1. SMART SUGGESTION BANNER ───────────────── */}
                        {suggestedSectionName && !suggestionAlreadyExists && !store.vendor_section_id && (
                            <div className="flex items-center justify-between p-3 px-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl gap-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xl">💡</span>
                                    <div>
                                        <p className="text-xs font-black text-blue-800 dark:text-blue-300 uppercase tracking-wide">Suggested for you</p>
                                        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">Based on the food type you picked above</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleQuickCreateSection(suggestedSectionName)}
                                    disabled={savingSection}
                                    className="shrink-0 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                                >
                                    {savingSection
                                        ? <Loader2 size={13} className="animate-spin" />
                                        : <>Use "{suggestedSectionName}"</>
                                    }
                                </button>
                            </div>
                        )}

                        {/* ── 2. EXISTING SECTIONS (if any) ────────────── */}
                        {sections.length > 0 && (
                            <div className="flex flex-wrap gap-2 items-center">
                                {/* "No section" pill — always the first option */}
                                <button
                                    onClick={() => {
                                        store.setField("vendor_section_id", null);
                                        store.setField("vendor_section_label", null);
                                    }}
                                    className={`h-9 px-4 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${!store.vendor_section_id
                                            ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600"
                                            : "bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                                        }`}
                                >
                                    No section
                                </button>

                                {sections.map(sec => {
                                    const isSelected = store.vendor_section_id === sec._id;
                                    return (
                                        <button
                                            key={sec._id}
                                            onClick={() => {
                                                if (isSelected) {
                                                    store.setField("vendor_section_id", null);
                                                    store.setField("vendor_section_label", null);
                                                } else {
                                                    store.setField("vendor_section_id", sec._id);
                                                    store.setField("vendor_section_label", sec.name);
                                                }
                                            }}
                                            className={`h-9 px-4 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${isSelected
                                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                                                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                                                }`}
                                        >
                                            {sec.name}
                                            {isSelected && <CheckCircle2 size={13} />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── 3. TEMPLATE TILES (only when no sections exist yet) ── */}
                        {sections.length === 0 && !showSectionForm && (
                            <div className="space-y-3">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                    Quick pick — tap one to create it instantly:
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {SECTION_TEMPLATES.map(t => (
                                        <button
                                            key={t.label}
                                            disabled={savingSection}
                                            onClick={() => handleQuickCreateSection(t.label)}
                                            className="h-11 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-orange-300 dark:hover:border-orange-500/40 hover:bg-orange-50 dark:hover:bg-orange-500/5 hover:text-orange-600 dark:hover:text-orange-400 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                                        >
                                            <span className="text-base">{t.emoji}</span>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── 4. CUSTOM SECTION — last resort, never the default ── */}
                        {!showSectionForm ? (
                            <button
                                onClick={() => setShowSectionForm(true)}
                                className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors flex items-center gap-1.5 pt-1"
                            >
                                <Plus size={13} />
                                {sections.length > 0 ? "Create a custom section" : "Or type a custom section name"}
                            </button>
                        ) : (
                            <div className="flex gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <input
                                    type="text"
                                    value={newSectionName}
                                    onChange={e => setNewSectionName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreateSection()}
                                    placeholder="e.g. Chef's Specials, Weekend Menu"
                                    autoFocus
                                    className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-all"
                                />
                                <button
                                    onClick={handleCreateSection}
                                    disabled={savingSection || !newSectionName.trim()}
                                    className="h-10 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs rounded-xl disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                                >
                                    {savingSection ? <Loader2 size={14} className="animate-spin" /> : "Add"}
                                </button>
                                <button
                                    onClick={() => { setShowSectionForm(false); setNewSectionName(""); }}
                                    className="h-10 px-3 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {/* ── STATUS LINE ──────────────────────────────── */}
                        {store.vendor_section_label ? (
                            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle2 size={13} />
                                This food will appear under "{store.vendor_section_label}"
                            </p>
                        ) : (
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                No section selected — food will appear under "Other" on your menu.
                            </p>
                        )}

                    </div>
                )}
            </div>

            {/* ── ACTIONS ───────────────────────────────────────────── */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="h-14 px-6 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all font-black uppercase tracking-widest gap-2 active:scale-95 text-xs"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <button
                    onClick={handleNext}
                    className="h-14 px-8 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 flex items-center gap-2"
                >
                    Next Step
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}