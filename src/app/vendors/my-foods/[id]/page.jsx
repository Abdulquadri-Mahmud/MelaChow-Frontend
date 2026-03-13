"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getMenuItemDetail, getPlatformCategories, getVendorSections,
    updateMenuItem, addPortion, updatePortion, deleteMenuItemPortion,
    addChoiceGroup, updateChoiceGroup, deleteChoiceGroup,
    addChoiceOption, updateChoiceOption, deleteChoiceOption,
    toggleMenuItemAvailability, archiveMenuItem
} from "@/app/lib/menuApi";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import { useParams, useRouter } from "next/navigation";
import { Plus, Tag, Clock, ChefHat, Leaf, FolderOpen, LayoutGrid, Edit2, Package, RefreshCw, Zap, Info, ChevronDown, ChevronUp, ImageIcon, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { updateVariant } from "@/app/lib/menuApi";
import toast from "react-hot-toast";
import BackButton from "@/app/components/BackButton";

const ITEM_TYPE_META = {
    FOOD:    { emoji: "🍽️", label: "Food" },
    DRINK:   { emoji: "🥤", label: "Drink" },
    SOUP:    { emoji: "🥘", label: "Soup" },
    SWALLOW: { emoji: "🫓", label: "Swallow" },
    PROTEIN: { emoji: "🍗", label: "Protein" },
    SIDE:    { emoji: "🍟", label: "Side" },
    DESSERT: { emoji: "🍰", label: "Dessert" },
    OTHER:   { emoji: "🍴", label: "Other" },
};

const GROUP_TITLE_PRESETS = {
    "Protein & Meat": ["Choose your protein", "Choose your meat cut", "Choose your fish type", "Choose your suya cut"],
    "Swallows & Soups": ["Choose your swallow", "Choose your soup", "Soup or stew?"],
    "Rice & Pasta": ["Choose your rice type", "Choose your pasta type"],
    "Sides": ["Choose your side", "Add a side dish", "Plantain or chips?"],
    "Sauce & Spice": ["Choose your sauce", "Spice level", "How spicy?"],
    "Drinks": ["Add a drink", "Choose your drink"],
    "Extras & Toppings": ["Add toppings", "Add proteins", "Add extras", "Add-ons"],
    "Packaging & Requests": ["Packaging preference", "Any special requests?"],
};

const DIETARY_COLORS = {
    veg: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400",
    vegan: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
    halal: "bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400",
    kosher: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400",
    "non-veg": "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400",
    mixed: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
};

const DietaryBadge = ({ type }) => (
    <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-[0.15em] border ${DIETARY_COLORS[type] || DIETARY_COLORS.mixed} transition-all`}>
        {type || "mixed"}
    </span>
);

const SectionCard = ({ title, action, children, className = "" }) => (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden transition-all h-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${className}`}>
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 backdrop-blur-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">{title}</h3>
            <div className="flex items-center gap-2">
                {action}
            </div>
        </div>
        <div className="p-3">{children}</div>
    </div>
);

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
    return roots.map(root => ({
        ...root,
        subCategories: childrenMap[root._id] || [],
    })).filter(root => root.subCategories.length > 0);
};

const BasicInfoSection = ({ item, vendorId, itemId, queryClient }) => {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({});
    const [tagInput, setTagInput] = useState("");

    const openEdit = () => {
        setForm({
            name: item.name, description: item.description || "", image_url: item.image_url || "",
            item_type: item.item_type || "FOOD", dietary_type: item.dietary_type || "mixed",
            prep_time_minutes: item.prep_time_minutes || "", tags: item.tags || [],
        });
        setTagInput("");
        setEditing(true);
    };

    const handleSave = async () => {
        if (!form.name?.trim()) return toast.error("Name is required");
        setSaving(true);
        try {
            await updateMenuItem(vendorId, itemId, {
                name: form.name.trim(), description: form.description.trim() || null,
                image_url: form.image_url.trim() || null, item_type: form.item_type,
                dietary_type: form.dietary_type, prep_time_minutes: form.prep_time_minutes ? Number(form.prep_time_minutes) : null,
                tags: form.tags,
            });
            queryClient.invalidateQueries({ queryKey: ["food-item", itemId] });
            queryClient.invalidateQueries({ queryKey: ["vendor-foods", vendorId] });
            setEditing(false);
            toast.success("Basic info updated");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Could not save");
        } finally {
            setSaving(false);
        }
    };

    const addTag = () => {
        const t = tagInput.trim().toLowerCase();
        if (!t || form.tags.includes(t)) { setTagInput(""); return; }
        setForm({ ...form, tags: [...form.tags, t] });
        setTagInput("");
    };
    const removeTag = (t) => setForm({ ...form, tags: form.tags.filter(x => x !== t) });

    const typeMeta = ITEM_TYPE_META[item.item_type] || ITEM_TYPE_META.FOOD;

    if (!editing) return (
        <SectionCard title="Basic Info" action={<button onClick={openEdit} className="h-9 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-orange-500 hover:border-orange-200 transition-all active:scale-95">Edit</button>}>
            <div className="space-y-6">
                {/* Image + description row */}
                <div className="flex gap-3 items-start">
                    <div className="shrink-0 w-24 h-24 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner group relative">
                        {item.image_url
                            ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            : <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">{typeMeta.emoji}</div>}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 mb-2">
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Description</span>
                             <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                        </div>
                        <p className="text-[15px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                            "{item.description || "No description provided for this item."}"
                        </p>
                    </div>
                </div>

                {/* Meta chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-950 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500">
                             <ChefHat size={20} strokeWidth={2.5}/>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Category Type</p>
                            <p className="text-sm font-black text-slate-800 dark:text-white">{typeMeta.label}</p>
                        </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-950 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                             <Leaf size={20} strokeWidth={2.5}/>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Dietary Standard</p>
                            <DietaryBadge type={item.dietary_type} />
                        </div>
                    </div>

                    {item.prep_time_minutes && (
                        <div className="p-4 bg-white dark:bg-slate-950 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                                 <Clock size={20} strokeWidth={2.5}/>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Prep Estimate</p>
                                <p className="text-sm font-black text-slate-800 dark:text-white">{item.prep_time_minutes} Minutes</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tags */}
                {item.tags?.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-3">
                             <Tag size={12} className="text-orange-500" />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Search Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {item.tags.map(t => (
                                <span key={t} className="h-8 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 hover:border-orange-200 transition-colors">#{t}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </SectionCard>
    );

    const DIETARY_OPTIONS = ["mixed","veg","vegan","halal","kosher","non-veg"];
    const TYPE_OPTIONS = ["FOOD","DRINK","SIDE","PROTEIN","SWALLOW","SOUP","DESSERT","OTHER"];

    return (
        <SectionCard title="Editing Basic Info">
            <div className="space-y-5">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Food Name *</label>
                    <input className="h-11 px-4 w-full rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" placeholder="e.g. Jollof Rice" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Description</label>
                    <textarea rows={3} className="p-4 w-full rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium leading-relaxed focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all resize-none" placeholder="Describe this dish — ingredients, flavours, what makes it special..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Image URL</label>
                    <input className="h-11 px-4 w-full rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" placeholder="https://..." value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
                    {form.image_url && <img src={form.image_url} alt="preview" className="mt-2 h-20 w-20 rounded-xl object-cover border border-slate-200 dark:border-slate-800" onError={e => e.target.style.display='none'} />}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Item Type</label>
                        <select className="h-11 px-3 w-full rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" value={form.item_type} onChange={e => setForm({ ...form, item_type: e.target.value })}>
                            {TYPE_OPTIONS.map(t => <option key={t} value={t}>{ITEM_TYPE_META[t]?.emoji} {ITEM_TYPE_META[t]?.label || t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Dietary Type</label>
                        <select className="h-11 px-3 w-full rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" value={form.dietary_type} onChange={e => setForm({ ...form, dietary_type: e.target.value })}>
                            {DIETARY_OPTIONS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Prep Time (minutes)</label>
                    <input className="h-11 px-4 w-32 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" type="number" placeholder="e.g. 15" value={form.prep_time_minutes} onChange={e => setForm({ ...form, prep_time_minutes: e.target.value })} />
                </div>
                {/* Tags */}
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Tags</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {form.tags.map(t => (
                            <span key={t} className="flex items-center gap-1 h-7 px-3 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                #{t}
                                <button onClick={() => removeTag(t)} className="ml-0.5 text-slate-400 hover:text-rose-500 transition-colors"><X size={10}/></button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input className="h-9 px-3 flex-1 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm font-medium focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none" placeholder="Add a tag e.g. bestseller" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                        <button onClick={addTag} className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black hover:bg-orange-50 hover:text-orange-600 transition-all"><Plus size={14}/></button>
                    </div>
                </div>
                <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={handleSave} disabled={saving} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-12 px-10 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex gap-3 items-center justify-center active:scale-95 transition-all shadow-lg disabled:opacity-50">
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />} Save Changes
                    </button>
                    <button onClick={() => setEditing(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-white h-12 px-6 font-bold text-xs transition-all">Discard</button>
                </div>
            </div>
        </SectionCard>
    );
};

const CategorySection = ({ item, vendorId, itemId, queryClient, allSections }) => {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({});
    const [categoryTree, setCategoryTree] = useState([]);
    const [editSections, setEditSections] = useState([]);

    useEffect(() => {
        if (!editing) return;
        getPlatformCategories().then(r => setCategoryTree(buildCategoryTree(r.categories || [])));
        getVendorSections(vendorId).then(r => setEditSections(r.sections || []));
    }, [editing, vendorId]);

    const catId = item.platform_category?.id || item.platform_category?._id || item.platform_category_id;
    const sectionId = item.vendor_section_id;
    const sectionName = allSections.find(s => s._id === sectionId)?.name;

    const openEdit = () => {
        setForm({
            platform_category_id: catId || null,
            platform_category_label: item.platform_category?.name || null,
            vendor_section_id: sectionId || null,
            activeRootId: null
        });
        setEditing(true);
    };

    const handleSave = async () => {
        if (!form.platform_category_id) return toast.error("Please select a food category");
        setSaving(true);
        try {
            await updateMenuItem(vendorId, itemId, { platform_category_id: form.platform_category_id, vendor_section_id: form.vendor_section_id || null });
            queryClient.invalidateQueries({ queryKey: ["food-item", itemId] });
            queryClient.invalidateQueries({ queryKey: ["vendor-foods", vendorId] });
            setEditing(false);
            toast.success("Category updated");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Could not save");
        } finally {
            setSaving(false);
        }
    };

    const cat = item.platform_category;

    if (!editing) return (
        <SectionCard title="Category & Section" action={<button onClick={openEdit} className="h-9 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-orange-500 hover:border-orange-200 transition-all active:scale-95">Edit</button>}>
            <div className="space-y-4">
                <div className="p-5 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-orange-200 transition-colors">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2"><div className="w-1 h-3 bg-orange-500 rounded-full" /> Platform Category</p>
                    {cat ? (
                        <div className="flex flex-wrap items-center gap-2.5">
                            {cat.parent && (
                                <div className="flex items-center gap-2.5">
                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{cat.parent.name}</span>
                                    <span className="text-slate-300 dark:text-slate-700">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                    </span>
                                </div>
                            )}
                            <div className="h-9 px-4 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-black flex items-center border border-orange-500/20">
                                {cat.name}
                            </div>
                        </div>
                    ) : <p className="text-sm font-medium text-slate-400 italic">No category assigned to this item.</p>}
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-emerald-200 transition-colors">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2"><div className="w-1 h-3 bg-emerald-500 rounded-full" /> Internal Section</p>
                    {sectionName ? (
                         <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                 <LayoutGrid size={16} />
                             </div>
                             <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{sectionName}</span>
                         </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-400 italic">
                             <LayoutGrid size={16} className="opacity-40" />
                             <p className="text-sm font-medium">Ungrouped / Master List</p>
                        </div>
                    )}
                </div>
            </div>
        </SectionCard>
    );

    const activeRoot = categoryTree.find(r => r._id === form.activeRootId) || categoryTree[0] || { subCategories: [] };

    return (
        <SectionCard title="Editing Category & Section">
            <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">1. Category Group</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {categoryTree.map(root => (
                            <button key={root._id} onClick={() => setForm({ ...form, activeRootId: root._id })} className={`shrink-0 h-9 px-4 rounded-xl text-xs font-bold border transition-all ${form.activeRootId === root._id || (activeRoot?._id === root._id && !form.activeRootId) ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900" : "bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 hover:border-slate-400"}`}>
                                {root.name}
                            </button>
                        ))}
                    </div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4 mb-2">2. Select Subcategory</label>
                    {form.platform_category_id && form.platform_category_label && (
                        <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2">✓ Selected: {form.platform_category_label}</p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                        {activeRoot.subCategories.map(sub => {
                            const isSelected = form.platform_category_id === sub._id;
                            return (
                                <button key={sub._id} onClick={() => setForm({ ...form, platform_category_id: sub._id, platform_category_label: sub.name })} className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${isSelected ? "border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 ring-2 ring-orange-500/20" : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 hover:border-orange-300 hover:bg-orange-50/40"}`}>
                                    {sub.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">3. Your Menu Section (optional)</label>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setForm({ ...form, vendor_section_id: null })} className={`h-9 px-4 rounded-xl text-xs font-bold border transition-all ${!form.vendor_section_id ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900" : "bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 hover:border-slate-400"}`}>No section</button>
                        {editSections.map(s => (
                            <button key={s._id} onClick={() => setForm({ ...form, vendor_section_id: s._id })} className={`h-9 px-4 rounded-xl text-xs font-bold border transition-all ${form.vendor_section_id === s._id ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900" : "bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 hover:border-slate-400"}`}>{s.name}</button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={handleSave} disabled={saving} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-11 px-6 rounded-xl font-black text-xs uppercase tracking-widest flex gap-2 items-center active:scale-95 transition-all">
                        {saving && <Loader2 className="animate-spin" size={16} />} Save Category
                    </button>
                    <button onClick={() => setEditing(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-white h-11 px-4 font-bold transition-all">Cancel</button>
                </div>
            </div>
        </SectionCard>
    );
};

const PortionsSection = ({ item, vendorId, itemId, queryClient }) => {
    const [editingPortionId, setEditingPortionId] = useState(null);
    const [portionForm, setPortionForm] = useState({});
    const [saving, setSaving] = useState(false);

    const [showAdd, setShowAdd] = useState(false);
    const [newPortion, setNewPortion] = useState({ label: "", price_naira: "", max_quantity: "" });
    const [adding, setAdding] = useState(false);

    const openEdit = (p) => {
        setPortionForm({ label: p.label, price_naira: p.price_naira, is_default: p.is_default, max_quantity: p.max_quantity || '' });

        setEditingPortionId(p._id);
    };

    const handleSave = async (pId) => {
        if (!portionForm.price_naira || Number(portionForm.price_naira) <= 0) return toast.error("Price must be > 0");
        setSaving(true);
        try {
            await updatePortion(vendorId, itemId, pId, { label: portionForm.label.trim(), price: Math.round(Number(portionForm.price_naira) * 100), is_default: portionForm.is_default, max_quantity: portionForm.max_quantity ? parseInt(portionForm.max_quantity, 10) : null });
            queryClient.invalidateQueries({ queryKey: ["food-item", itemId] });
            setEditingPortionId(null);
            toast.success("Size updated");
        } catch (err) { toast.error(err?.response?.data?.message || "Error saving"); }
        finally { setSaving(false); }
    };

    const handleDelete = async (pId) => {
        if (item.portions.length <= 1) return toast.error("Cannot delete the only size.");
        try {
            await deleteMenuItemPortion(vendorId, itemId, pId);
            queryClient.invalidateQueries({ queryKey: ["food-item", itemId] });
            toast.success("Size removed");
        } catch (err) { toast.error(err?.response?.data?.message || "Error deleting"); }
    };

    const handleAdd = async () => {
        if (!newPortion.label.trim()) return toast.error("Label required");
        if (!newPortion.price_naira || Number(newPortion.price_naira) <= 0) return toast.error("Price must be > 0");
        setAdding(true);
        try {
            await addPortion(vendorId, itemId, { label: newPortion.label.trim(), price: Math.round(Number(newPortion.price_naira) * 100), is_default: item.portions.length === 0, sort_order: item.portions.length, max_quantity: newPortion.max_quantity ? parseInt(newPortion.max_quantity, 10) : null });
            queryClient.invalidateQueries({ queryKey: ["food-item", itemId] });
            setShowAdd(false); setNewPortion({ label: "", price_naira: "", max_quantity: "" });
            toast.success("Size added");
        } catch (err) { toast.error(err?.response?.data?.message || "Error adding"); }
        finally { setAdding(false); }
    };

    return (
        <SectionCard title="Sizes & Prices" action={!showAdd && <button onClick={() => setShowAdd(true)} className="h-9 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-colors active:scale-95">+ Add Size</button>}>
            <div className="space-y-3 mt-2">
                {item.portions?.map(p => (
                    <div key={p._id} className="p-5 bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 group transition-all hover:border-orange-200 hover:shadow-md hover:shadow-orange-500/5">
                        {editingPortionId === p._id ? (
                            <div className="flex-1 flex flex-wrap gap-3 items-center">
                                <input className="h-11 px-4 w-36 rounded-xl text-sm border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-orange-500 font-bold outline-none" placeholder="Label" value={portionForm.label} onChange={e => setPortionForm({ ...portionForm, label: e.target.value })} />
                                <div className="relative">
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">₦</span>
                                 <input className="h-11 pl-10 pr-4 w-32 rounded-xl text-sm border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-orange-500 font-black text-orange-600 outline-none" type="number" placeholder="Price" value={portionForm.price_naira} onChange={e => setPortionForm({ ...portionForm, price_naira: e.target.value })} />
                            </div>
                            <input className="h-11 px-4 w-28 rounded-xl text-sm border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-orange-500 font-bold outline-none" type="number" placeholder="Max Qty" value={portionForm.max_quantity} onChange={e => setPortionForm({ ...portionForm, max_quantity: e.target.value })} />
                            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 cursor-pointer">
                                 <input type="checkbox" className="w-4 h-4 rounded-md border-slate-300 text-orange-500 focus:ring-orange-500" checked={portionForm.is_default} onChange={e => setPortionForm({ ...portionForm, is_default: e.target.checked })} /> 
                                 Set as Default
                            </label>
                                <div className="flex gap-2 ml-auto">
                                     <button onClick={() => handleSave(p._id)} disabled={saving} className="h-11 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg">Save</button>
                                     <button onClick={() => setEditingPortionId(null)} className="h-11 px-4 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Size/Portion</span>
                                         <span className="text-lg font-black text-slate-800 dark:text-white leading-tight">{p.label}</span>
                                    </div>
                                    <div className="flex flex-col">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Base Price</span>
                                 <span className="text-xl font-black text-orange-600 dark:text-orange-400">₦{p.price_naira?.toLocaleString()}</span>
                            </div>
                            {p.max_quantity && (
                                <div className="flex flex-col ml-2">
                                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Max Limit</span>
                                     <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{p.max_quantity} qty</span>
                                </div>
                            )}
                                    {p.is_default && (
                                        <div className="self-end pb-1">
                                             <span className="text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full border border-indigo-500/20">Primary Default</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 ml-auto shrink-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <button onClick={() => openEdit(p)} className="h-9 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-300 hover:text-orange-500 transition-all active:scale-95">Edit</button>
                                    <button onClick={() => handleDelete(p._id)} disabled={item.portions.length <= 1} className="h-9 w-9 rounded-2xl flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all disabled:opacity-30 active:scale-95"><X size={16} strokeWidth={3}/></button>
                                </div>
                            </>
                        )}
                    </div>
                ))}

                {showAdd && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-200 dark:border-orange-500/20 flex flex-wrap gap-2 items-center mt-4">
                        <input className="h-10 px-3 w-32 rounded-xl text-sm border border-orange-200 dark:border-orange-500/30 bg-white dark:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" placeholder="Label e.g. Medium" value={newPortion.label} onChange={e => setNewPortion({ ...newPortion, label: e.target.value })} autoFocus />
                        <input className="h-10 px-3 w-28 rounded-xl text-sm border border-orange-200 dark:border-orange-500/30 bg-white dark:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" type="number" placeholder="Price ₦" value={newPortion.price_naira} onChange={e => setNewPortion({ ...newPortion, price_naira: e.target.value })} />
                        <input className="h-10 px-3 w-24 rounded-xl text-sm border border-orange-200 dark:border-orange-500/30 bg-white dark:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" type="number" placeholder="Max Qty" value={newPortion.max_quantity} onChange={e => setNewPortion({ ...newPortion, max_quantity: e.target.value })} />
                        <button onClick={handleAdd} disabled={adding} className="h-10 ml-auto px-5 bg-orange-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all">Add Size</button>
                        <button onClick={() => setShowAdd(false)} className="h-10 px-4 text-xs font-bold text-slate-500 transition-all">Cancel</button>
                    </div>
                )}
            </div>
        </SectionCard>
    );
};

const AddOnsSection = ({ item, vendorId, itemId, queryClient }) => {
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [groupForm, setGroupForm] = useState({});
    const [editingOptionId, setEditingOptionId] = useState(null);
    const [optionForm, setOptionForm] = useState({});

    // Group naming mode: preset vs custom
    const [isCustomTitle, setIsCustomTitle] = useState(false);
    const [isAddingCustomTitle, setIsAddingCustomTitle] = useState(false);

    const [showAddGroup, setShowAddGroup] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: "", is_required: false });
    const [addingToGroup, setAddingToGroup] = useState(null);
    const [newOption, setNewOption] = useState({ label: "", price_modifier_naira: "", image_url: "" });

    const handleSaveGroup = async (gId) => {
        if (!groupForm.name?.trim()) return toast.error("Name required");
        try {
            await updateChoiceGroup(vendorId, itemId, gId, { name: groupForm.name.trim(), is_required: groupForm.is_required, min_selections: groupForm.is_required ? Math.max(1, Number(groupForm.min_selections || 1)) : 0, max_selections: Number(groupForm.max_selections || 1) });
            queryClient.invalidateQueries({ queryKey: ["food-item", itemId] });
            setEditingGroupId(null);
            toast.success("Group updated");
        } catch (err) { toast.error("Error saving group"); }
    };

    const handleDeleteGroup = (gId, name) => {
        toast(t => (
            <div className="flex flex-col gap-3 min-w-[240px]">
                <p className="text-sm font-black text-slate-900 dark:text-white">Delete "{name}"?</p>
                <div className="flex gap-2">
                    <button onClick={() => toast.dismiss(t.id)} className="flex-1 h-8 rounded-lg border text-xs font-bold">Cancel</button>
                    <button onClick={async () => { toast.dismiss(t.id); try { await deleteChoiceGroup(vendorId, itemId, gId); queryClient.invalidateQueries({ queryKey: ["food-item", itemId] }); toast.success("Group removed"); } catch (err) { toast.error("Error deleting group"); } }} className="flex-1 h-8 rounded-lg bg-rose-600 text-white text-xs font-bold">Delete</button>
                </div>
            </div>
        ), { duration: 6000 });
    };

    const handleAddGroup = async () => {
        if (!newGroup.name?.trim()) return toast.error("Name required");
        try {
            await addChoiceGroup(vendorId, itemId, { name: newGroup.name.trim(), is_required: newGroup.is_required, min_selections: newGroup.is_required ? 1 : 0, max_selections: 1, sort_order: item.choice_groups?.length || 0 });
            queryClient.invalidateQueries({ queryKey: ["food-item", itemId] });
            setShowAddGroup(false); setNewGroup({ name: "", is_required: false });
            toast.success("Choice group added");
        } catch (err) { toast.error("Error adding group"); }
    };

    const handleSaveOption = async (gId, optId) => {
        if (!optionForm.label?.trim()) return toast.error("Label required");
        try {
            await updateChoiceOption(gId, optId, { label: optionForm.label.trim(), price_modifier_naira: Number(optionForm.price_modifier_naira) || 0, image_url: optionForm.image_url?.trim() || null });
            queryClient.invalidateQueries({ queryKey: ["food-item", itemId] });
            setEditingOptionId(null);
            toast.success("Option updated");
        } catch (err) { toast.error("Error saving option"); }
    };

    const handleDeleteOption = async (gId, optId) => {
        try { await deleteChoiceOption(gId, optId); queryClient.invalidateQueries({ queryKey: ["food-item", itemId] }); toast.success("Option removed"); } catch (err) { toast.error("Error deleting option"); }
    };

    const handleAddOption = async (gId) => {
        if (!newOption.label?.trim()) return toast.error("Label required");
        try {
            await addChoiceOption(gId, { label: newOption.label.trim(), price_modifier_naira: Number(newOption.price_modifier_naira) || 0, image_url: newOption.image_url?.trim() || null, is_available: true, sort_order: 999 });
            queryClient.invalidateQueries({ queryKey: ["food-item", itemId] });
            setAddingToGroup(null); setNewOption({ label: "", price_modifier_naira: "", image_url: "" });
            toast.success("Option added");
        } catch (err) { toast.error(err?.response?.data?.message || "Error adding option"); }
    };

    return (
        <SectionCard title="Customer Choices" action={!showAddGroup && <button onClick={() => setShowAddGroup(true)} className="h-9 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-colors active:scale-95">+ Add Group</button>}>
            <div className="space-y-8">
                {item.choice_groups?.map(g => (
                    <div key={g._id} className="border border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-hidden bg-white dark:bg-slate-950 transition-all hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-none">
                        <div className="bg-slate-50/50 dark:bg-slate-900 px-6 py-5 flex flex-col lg:flex-row justify-between lg:items-center border-b border-slate-100 dark:border-slate-800 gap-4">
                            {editingGroupId === g._id ? (
                                <div className="flex-1 flex flex-col gap-4">
                                    <div className="flex flex-wrap gap-3 items-end">
                                        {!isCustomTitle ? (
                                            <div className="space-y-4 flex-1 min-w-[300px]">
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl max-h-[250px] overflow-y-auto shadow-inner">
                                                    {Object.entries(GROUP_TITLE_PRESETS).map(([hdr, list]) => (
                                                        <div key={hdr} className="col-span-full first:mt-0 mt-3">
                                                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 block pl-1">{hdr}</span>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                                {list.map(p => (
                                                                    <button 
                                                                        key={p} 
                                                                        onClick={() => setGroupForm({ ...groupForm, name: p })}
                                                                        className={`p-3 rounded-2xl border text-[10px] font-black leading-tight text-left transition-all ${groupForm.name === p ? "border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-500/10" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-orange-200"}`}
                                                                    >
                                                                        {p}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button onClick={() => { setIsCustomTitle(true); setGroupForm({ ...groupForm, name: "" }); }} className="text-[10px] font-black text-orange-500 uppercase tracking-widest pl-2 hover:translate-x-1 transition-transform">+ Use Custom Group Name</button>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col gap-1">
                                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Group Name</label>
                                                <div className="flex gap-2">
                                                    <input className="h-12 px-4 flex-1 rounded-2xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-orange-500 font-bold outline-none" placeholder="Enter custom name" value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} autoFocus />
                                                    <button onClick={() => setIsCustomTitle(false)} className="px-4 text-xs font-bold text-slate-500 hover:text-slate-800">Use presets</button>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="flex flex-col gap-1">
                                             <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Max Select</label>
                                             <input type="number" className="h-12 px-4 w-20 rounded-2xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-orange-500 font-black outline-none" value={groupForm.max_selections} onChange={e => setGroupForm({ ...groupForm, max_selections: e.target.value })} placeholder="Max" />
                                        </div>

                                        <label className="h-12 px-4 flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 cursor-pointer">
                                             <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" checked={groupForm.is_required} onChange={e => setGroupForm({ ...groupForm, is_required: e.target.checked })} /> 
                                             Required
                                        </label>
                                    </div>
                                    <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <button onClick={() => handleSaveGroup(g._id)} className="h-11 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg">Save Group</button>
                                        <button onClick={() => setEditingGroupId(null)} className="h-11 px-5 text-xs font-bold text-slate-500 hover:text-slate-800">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tight">{g.name}</h4>
                                            {g.is_required ? (
                                                <span className="bg-orange-500 text-white text-[9px] px-2.5 py-1 rounded-lg font-black tracking-[0.15em] uppercase shadow-lg shadow-orange-500/20">Required</span>
                                            ) : (
                                                <span className="bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[9px] px-2.5 py-1 rounded-lg font-black tracking-[0.15em] uppercase border border-slate-300/30">Optional</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                             <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                             Selection Rule: Choose up to <span className="font-black text-slate-700 dark:text-slate-200">{g.max_selections || 1} {g.max_selections > 1 ? "options" : "option"}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => { setGroupForm({ name: g.name, is_required: g.is_required, min_selections: g.min_selections, max_selections: g.max_selections }); setEditingGroupId(g._id); }} className="h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-200 hover:text-orange-500 transition-all active:scale-95">Edit Group</button>
                                        <button onClick={() => handleDeleteGroup(g._id, g.name)} className="h-10 w-10 rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all border border-transparent active:scale-95">✕</button>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-950/50 space-y-2">
                            {g.options?.map(o => (
                                <div key={o._id} className="flex flex-wrap justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-[1.5rem] group/item transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                    {editingOptionId === o._id ? (
                                        <div className="flex-1 flex flex-col gap-4 py-2">
                                            <div className="flex flex-wrap gap-3 items-end">
                                                <div className="flex flex-col gap-1">
                                                     <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Option Label</label>
                                                     <input className="h-11 px-4 w-48 rounded-2xl text-sm border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-orange-500 font-bold outline-none" placeholder="Label" value={optionForm.label} onChange={e => setOptionForm({ ...optionForm, label: e.target.value })} />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                     <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Upcharge</label>
                                                     <div className="relative">
                                                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">₦</span>
                                                         <input className="h-11 pl-10 pr-4 w-32 rounded-2xl text-sm border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-orange-500 font-black text-orange-600 outline-none" type="number" placeholder="+₦" value={optionForm.price_modifier_naira} onChange={e => setOptionForm({ ...optionForm, price_modifier_naira: e.target.value })} />
                                                     </div>
                                                </div>
                                                <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                                                     <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Image URL (Optional)</label>
                                                     <input className="h-11 px-4 w-full rounded-2xl text-sm border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-orange-500 font-medium outline-none" placeholder="https://..." value={optionForm.image_url || ""} onChange={e => setOptionForm({ ...optionForm, image_url: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 justify-end pt-2">
                                                 <button onClick={() => handleSaveOption(g._id, o._id)} className="h-10 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all">Update</button>
                                                 <button onClick={() => setEditingOptionId(null)} className="h-10 px-4 text-xs font-bold text-slate-500">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-inner group/img relative">
                                                     {o.image_url ? (
                                                         <img src={o.image_url} alt={o.label} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
                                                     ) : (
                                                         <ImageIcon size={20} className="text-slate-300" strokeWidth={1.5} />
                                                     )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[15px] font-bold text-slate-700 dark:text-slate-200 truncate">{o.label}</span>
                                                    <div className="flex items-center gap-2">
                                                         <span className={`text-[11px] font-black uppercase tracking-[0.1em] ${o.price_modifier_naira > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                                                              {o.price_modifier_naira > 0 ? `+ ₦${o.price_modifier_naira?.toLocaleString()}` : "Free"}
                                                         </span>
                                                         <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                         <span className="text-[10px] font-medium text-slate-400">Option ID: {o._id.slice(-6).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-auto shrink-0 opacity-100 lg:opacity-0 group-hover/item:opacity-100 transition-all">
                                                <button onClick={() => { setOptionForm({ label: o.label, price_modifier_naira: o.price_modifier_naira, image_url: o.image_url || "" }); setEditingOptionId(o._id); }} className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Edit</button>
                                                <button onClick={() => handleDeleteOption(g._id, o._id)} className="h-9 w-9 rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all">✕</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            
                            {addingToGroup === g._id ? (
                                <div className="p-3 my-2 mx-2 bg-slate-50 dark:bg-slate-900/80 rounded-[2rem] flex flex-col gap-5 border border-slate-200 dark:border-slate-800 shadow-inner">
                                    <div className="flex items-center gap-2 mb-1">
                                         <div className="p-1.5 bg-orange-500 rounded-lg shadow-lg shadow-orange-500/20">
                                              <Plus size={14} className="text-white" />
                                         </div>
                                         <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Quick Add Option</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Display Label *</label>
                                            <input className="h-12 px-4 rounded-2xl text-sm border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-orange-500 font-bold outline-none" placeholder="e.g. Extra Cheese" value={newOption.label} onChange={e => setNewOption({ ...newOption, label: e.target.value })} autoFocus />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Upcharge Amount</label>
                                            <div className="relative">
                                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">₦</span>
                                                 <input className="h-12 pl-10 pr-4 w-full rounded-2xl text-sm border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-orange-500 font-black text-orange-600 outline-none" type="number" placeholder="0.00" value={newOption.price_modifier_naira} onChange={e => setNewOption({ ...newOption, price_modifier_naira: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5 md:col-span-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Image Reference (Optional)</label>
                                            <div className="flex gap-3">
                                                 <input className="h-12 px-4 flex-1 rounded-2xl text-sm border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-orange-500 font-medium outline-none" placeholder="https://image-hosting.com/image.jpg" value={newOption.image_url} onChange={e => setNewOption({ ...newOption, image_url: e.target.value })} />
                                                 <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                                                      {newOption.image_url ? <img src={newOption.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-slate-300" />}
                                                 </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => handleAddOption(g._id)} className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-[1.25rem] text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-[0_8px_20px_-6px_rgba(249,115,22,0.5)]">Confirm & Add</button>
                                        <button onClick={() => setAddingToGroup(null)} className="h-12 px-6 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all">Dismiss</button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setAddingToGroup(g._id)} className="w-full text-center py-4 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 hover:text-orange-600 transition-all hover:bg-orange-50/50 dark:hover:bg-orange-500/5 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800 mt-2">+ New Option for {g.name}</button>
                            )}
                        </div>
                    </div>
                ))}

                {showAddGroup && (
                    <div className="p-5 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-[1.5rem] flex flex-col gap-4">
                        <p className="text-xs font-black uppercase text-orange-600 dark:text-orange-400 tracking-widest">New Choice Group</p>
                        
                        {!isAddingCustomTitle ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-white dark:bg-slate-900 border border-orange-100 dark:border-orange-500/20 rounded-[2rem] max-h-[300px] overflow-y-auto">
                                    {Object.entries(GROUP_TITLE_PRESETS).map(([hdr, list]) => (
                                        <div key={hdr} className="col-span-full first:mt-0 mt-3">
                                            <span className="text-[10px] font-black text-orange-600/50 dark:text-orange-400/50 uppercase tracking-widest mb-1.5 block pl-1">{hdr}</span>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {list.map(p => (
                                                    <button 
                                                        key={p} 
                                                        onClick={() => setNewGroup({ ...newGroup, name: p })}
                                                        className={`p-3 rounded-2xl border text-[11px] font-black leading-tight text-left transition-all ${newGroup.name === p ? "border-orange-500 bg-orange-50 text-orange-600 dark:bg-emerald-500/10 dark:text-orange-400" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-orange-200"}`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => { setIsAddingCustomTitle(true); setNewGroup({ ...newGroup, name: "" }); }} className="text-[10px] font-black text-orange-500 uppercase tracking-widest pl-2 hover:translate-x-1 transition-transform">+ Set Custom Group Name</button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input className="h-12 px-4 flex-1 rounded-xl border border-orange-200 dark:border-orange-500/30 bg-white dark:bg-slate-900 text-sm focus:border-orange-500 font-bold outline-none" placeholder="e.g. Extra Toppings" value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} autoFocus />
                                <button onClick={() => setIsAddingCustomTitle(false)} className="px-3 text-xs font-bold text-orange-600">Preset list</button>
                            </div>
                        )}

                        <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300 ml-1"><input type="checkbox" className="rounded" checked={newGroup.is_required} onChange={e => setNewGroup({ ...newGroup, is_required: e.target.checked })} /> Required choice</label>
                        <div className="flex gap-3 pt-2">
                            <button onClick={handleAddGroup} className="h-11 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all">Create Group</button>
                            <button onClick={() => { setShowAddGroup(false); setIsAddingCustomTitle(false); }} className="h-11 px-4 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all">Cancel</button>
                        </div>
                    </div>
                )}
            </div>
        </SectionCard>
    );
};

export default function FoodManagementPage() {
    const { id: itemId } = useParams();
    const router = useRouter();
    const { vendorProfile } = useVendorProfile();
    const vendorId = vendorProfile?._id || vendorProfile?.id;
    const queryClient = useQueryClient();
    const [allSections, setAllSections] = useState([]);

    // Combo editing state
    const [editingComboId, setEditingComboId]   = useState(null);
    const [comboForm, setComboForm]             = useState({});
    const [savingCombo, setSavingCombo]         = useState(false);
    const [expandedComboId, setExpandedComboId] = useState(null);

    useEffect(() => {
        if (!vendorId) return;
        getVendorSections(vendorId).then(r => setAllSections(r.sections || [])).catch(() => {});
    }, [vendorId]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["food-item", itemId],
        queryFn: () => getMenuItemDetail(vendorId, itemId),
        enabled: !!vendorId && !!itemId,
        staleTime: 1000 * 60 * 5,
    });

    const item = data?.item;

    const handleToggleAvailability = async () => {
        try {
            await toggleMenuItemAvailability(vendorId, itemId);
            queryClient.invalidateQueries({ queryKey: ["food-item", itemId] });
            queryClient.invalidateQueries({ queryKey: ["vendor-foods", vendorId] });
            toast.success(item.is_available ? "Food is now hidden from customers" : "Food is now live on your menu");
        } catch (err) { toast.error(err?.response?.data?.message || "Could not update availability"); }
    };

    const handleArchiveToggle = async () => {
        const archiving = !item.is_archived;
        try {
            await archiveMenuItem(vendorId, itemId, archiving);
            queryClient.invalidateQueries({ queryKey: ["food-item", itemId] });
            queryClient.invalidateQueries({ queryKey: ["vendor-foods", vendorId] });
            toast.success(archiving ? "Food archived" : "Food restored");
        } catch (err) {
            const msg = err?.response?.data?.message;
            toast.error(msg || "Could not archive food", { duration: msg?.includes("combo") ? 6000 : 4000 });
        }
    };

    const openComboEdit = (combo) => {
        setComboForm({
            name:              combo.name,
            description:       combo.description || "",
            image_url:         combo.image_url || "",
            price_naira:       combo.price_naira,
            prep_time_minutes: combo.prep_time_minutes || "",
        });
        setEditingComboId(combo._id);
        // Close expansion when editing
        setExpandedComboId(null);
    };

    const handleSaveCombo = async (comboId) => {
        if (!comboForm.name?.trim()) {
            toast.error("Combo name is required");
            return;
        }
        if (!comboForm.price_naira || Number(comboForm.price_naira) <= 0) {
            toast.error("Price must be greater than zero");
            return;
        }
        setSavingCombo(true);
        try {
            await updateVariant(vendorId, comboId, {
                name:              comboForm.name.trim(),
                description:       comboForm.description.trim() || null,
                image_url:         comboForm.image_url.trim() || null,
                price_naira:       Number(comboForm.price_naira),
                prep_time_minutes: comboForm.prep_time_minutes
                                   ? Number(comboForm.prep_time_minutes)
                                   : null,
            });
            queryClient.invalidateQueries({ queryKey: ["food-item", itemId] });
            queryClient.invalidateQueries({ queryKey: ["vendor-foods", vendorId] });
            setEditingComboId(null);
            toast.success("Combo updated");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Could not update combo");
        } finally {
            setSavingCombo(false);
        }
    };

    if (isLoading || !item) return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
            <p className="text-slate-500 font-bold text-sm">Loading food details...</p>
        </div>
    );

    if (isError) return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
            <p className="text-slate-500 font-bold">Could not load this food item.</p>
            <button onClick={() => router.push("/vendors/my-foods")} className="h-11 px-6 rounded-2xl bg-orange-500 text-white text-xs font-black uppercase tracking-widest">Back to My Foods</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] rounded-md dark:bg-slate-950 pb-32 transition-all duration-500">
            <div className="max-w-[1400px] mx-auto px-2 md:px-12 space-y-12">

                {/* PAGE TITLE & INFO */}
                <div className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <BackButton label="" href="/vendors/my-foods" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 hover:border-orange-200 transition-all active:scale-95" />
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                     <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Inventory Manager</span>
                                </div>
                                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Command Center</h2>
                            </div>
                        </div>
                        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed pl-[66px]">
                            Operational oversight for <span className="text-slate-900 dark:text-white font-bold underline decoration-orange-500/30 decoration-2 underline-offset-4">"{item.name}"</span>. 
                        </p>
                    </div>

                    <div className="flex items-center gap-4 pl-[66px] md:pl-0">
                         <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Last Synced</span>
                              <span className="text-xs font-black text-slate-900 dark:text-slate-300">Just moments ago</span>
                         </div>
                         <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
                         <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-orange-500">
                              <ChefHat size={24} />
                         </div>
                    </div>
                </div>

                {/* MASTER STATUS CARD */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-[4rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-none relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse" />
                    
                    <div className="bg-slate-50/50 dark:bg-slate-800/40 rounded-[3.5rem] md:p-2 border border-slate-100 dark:border-slate-800 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                            {/* Visual Asset Container */}
                            <div className="lg:col-span-3">
                                <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-slate-200 dark:bg-slate-950 border-4 border-white dark:border-slate-800 shadow-2xl group/thumb pointer-events-none">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-1000" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                            <ImageIcon size={64} strokeWidth={1} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">No Visual Attached</span>
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-6 flex flex-col gap-2">
                                        {item.is_archived && <span className="px-4 py-2 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-2xl border border-white/20">Archived</span>}
                                        {!item.is_available && !item.is_archived && <span className="px-5 py-2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/30">Offline</span>}
                                        {item.is_available && <span className="px-5 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/30">Live Now</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Essential Details & Quick Moves */}
                            <div className="lg:col-span-9 flex flex-col xl:flex-row justify-between xl:items-center gap-10">
                                <div className="space-y-6 md:px-0 px-2">
                                    <div>
                                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.05] mb-6">{item.name}</h1>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <DietaryBadge type={item.dietary_type} />
                                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
                                            <span className="h-10 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-[0.2em] rounded-2xl flex items-center text-[10px] shadow-lg shadow-slate-950/10 dark:shadow-none">{item.item_type}</span>
                                            {item.prep_time_minutes && (
                                                <span className="h-10 px-5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-[10px]">
                                                    <Clock size={16} className="text-orange-500" /> {item.prep_time_minutes} MINS
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                                    <button 
                                        onClick={handleToggleAvailability} 
                                        className={`h-16 px-10 rounded-[2rem] border text-[12px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-4 shadow-2xl ${item.is_available 
                                            ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900 group/btn' 
                                            : 'bg-emerald-500 border-emerald-400 text-white hover:bg-emerald-600 hover:shadow-emerald-500/40'}`}
                                    >
                                        <div className={`w-2.5 h-2.5 rounded-full ${item.is_available ? 'bg-slate-300 group-hover/btn:bg-orange-500 group-hover/btn:animate-ping' : 'bg-white animate-pulse'}`} />
                                        {item.is_available ? "Deactivate on App" : "Publish to Customers"}
                                    </button>
                                    <button 
                                        onClick={handleArchiveToggle} 
                                        className="h-16 px-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 hover:border-rose-300 hover:text-rose-500 transition-all active:scale-95 bg-white dark:bg-slate-950 flex items-center justify-center"
                                    >
                                        {item.is_archived ? "Restore Content" : "Archive"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MANAGEMENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    {/* PRIMARY CONFIGURATION COLUMN */}
                    <div className="lg:col-span-7 space-y-10">
                        <BasicInfoSection item={item} vendorId={vendorId} itemId={itemId} queryClient={queryClient} />
                        <AddOnsSection item={item} vendorId={vendorId} itemId={itemId} queryClient={queryClient} />
                    </div>

                    {/* SIDEBAR LOGISTICS COLUMN */}
                    <div className="lg:col-span-5 space-y-10 lg:sticky lg:top-12">
                        <CategorySection item={item} vendorId={vendorId} itemId={itemId} queryClient={queryClient} allSections={allSections} />
                        <PortionsSection item={item} vendorId={vendorId} itemId={itemId} queryClient={queryClient} />

                        {item.combos?.length > 0 && (
                            <SectionCard
                                title="In Combos"
                                action={
                                    <div className="flex items-center gap-2">
                                        <Package size={14} className="text-orange-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {item.combos.length} bundle{item.combos.length > 1 ? "s" : ""}
                                        </span>
                                    </div>
                                }
                            >
                                <div className="p-4 mb-6 rounded-2xl bg-orange-50/50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/10 flex gap-3 items-start">
                                    <Info size={16} className="text-orange-500 mt-0.5 shrink-0" />
                                    <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                                        This item is currently bundled in the active combos listed below. Changes to the base item may affect customer selection in these bundles.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {item.combos.map(combo => (
                                        <div key={combo._id}
                                             className={`rounded-[2rem] border overflow-hidden transition-all duration-300 ${
                                                 editingComboId === combo._id 
                                                 ? 'border-orange-500 shadow-2xl shadow-orange-500/10 bg-white dark:bg-slate-950 ring-4 ring-orange-500/5' 
                                                 : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-orange-200 dark:hover:border-slate-700'
                                             }`}>

                                            {/* ── COMBO HEADER ROW ─────────────────── */}
                                            <div className="flex items-center justify-between gap-4 p-5">
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    {/* Combo image or emoji fallback */}
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-inner group-hover:scale-105 transition-transform">
                                                        {combo.image_url ? (
                                                            <img src={combo.image_url} alt={combo.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package size={20} className="text-slate-400" />
                                                        )}
                                                    </div>

                                                    {/* Name + price */}
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-[15px] text-slate-900 dark:text-white truncate uppercase tracking-tight">
                                                            {combo.name}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-sm font-black text-orange-600 dark:text-orange-400">
                                                                ₦{combo.price_naira?.toLocaleString()}
                                                            </span>
                                                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                            <span className={`text-[9px] font-black uppercase tracking-widest ${combo.is_available ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                {combo.is_available ? "Live" : "Offline"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={() => setExpandedComboId(expandedComboId === combo._id ? null : combo._id)}
                                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                                            expandedComboId === combo._id
                                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                        }`}>
                                                        {expandedComboId === combo._id ? <ChevronUp size={16} strokeWidth={3} /> : <ChevronDown size={16} strokeWidth={3} />}
                                                    </button>

                                                    <button
                                                        onClick={() => openComboEdit(combo)}
                                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                                            editingComboId === combo._id
                                                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10'
                                                        }`}>
                                                        <Edit2 size={14} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* ── INLINE EDIT FORM ─────────────────── */}
                                            <AnimatePresence>
                                                {editingComboId === combo._id && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                                                    >
                                                        <div className="p-6 space-y-5">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                                <div className="sm:col-span-2">
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-1">Bundle Identity</label>
                                                                    <input
                                                                        value={comboForm.name}
                                                                        onChange={e => setComboForm(f => ({ ...f, name: e.target.value }))}
                                                                        className="w-full h-12 px-4 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                                                        placeholder="Combo Name"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-1">Smart Price (₦)</label>
                                                                    <div className="relative">
                                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300">₦</span>
                                                                        <input
                                                                            type="number"
                                                                            value={comboForm.price_naira}
                                                                            onChange={e => setComboForm(f => ({ ...f, price_naira: e.target.value }))}
                                                                            className="w-full h-12 pl-10 pr-4 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-black text-orange-600 dark:text-orange-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-1">Prep Time (min)</label>
                                                                    <div className="relative">
                                                                        <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                                        <input
                                                                            type="number"
                                                                            value={comboForm.prep_time_minutes}
                                                                            onChange={e => setComboForm(f => ({ ...f, prep_time_minutes: e.target.value }))}
                                                                            className="w-full h-12 pl-10 pr-4 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                                                            placeholder="Est. prep"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="sm:col-span-2">
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-1">Description / Market Catchphrase</label>
                                                                    <textarea
                                                                        value={comboForm.description}
                                                                        onChange={e => setComboForm(f => ({ ...f, description: e.target.value }))}
                                                                        rows={2}
                                                                        className="w-full px-4 py-3 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none"
                                                                        placeholder="Tell customers what's in the bundle..."
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-3 pt-2">
                                                                <button
                                                                    onClick={() => setEditingComboId(null)}
                                                                    className="flex-1 h-12 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all uppercase tracking-widest"
                                                                >
                                                                    Discard Changes
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSaveCombo(combo._id)}
                                                                    disabled={savingCombo}
                                                                    className="flex-1 h-12 rounded-[1.25rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl uppercase tracking-widest"
                                                                >
                                                                    {savingCombo ? <Loader2 size={16} className="animate-spin" /> : <Zap size={14} className="fill-current" />}
                                                                    Apply Update
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* ── EXPANDED DETAIL (components + swaps) ─ */}
                                            <AnimatePresence>
                                                {expandedComboId === combo._id && editingComboId !== combo._id && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
                                                    >
                                                        <div className="p-5 space-y-6">
                                                            {/* Components */}
                                                            {combo.components?.length > 0 && (
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <LayoutGrid size={12} className="text-orange-500" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bundle Contents</span>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 gap-2">
                                                                        {combo.components.map(comp => (
                                                                            <div key={comp._id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all">
                                                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-700 font-black text-xs text-slate-400">
                                                                                    {comp.image_url ? <img src={comp.image_url} alt={comp.name} className="w-full h-full object-cover" /> : "🍽"}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block truncate">{comp.name}</span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{comp.component_type || "FIXED"}</span>
                                                                                        {comp.quantity > 1 && <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-md">×{comp.quantity}</span>}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Swap groups */}
                                                            {combo.swap_groups?.length > 0 && (
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <RefreshCw size={12} className="text-orange-500" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customization Swaps</span>
                                                                    </div>
                                                                    <div className="space-y-4">
                                                                        {combo.swap_groups.map(group => (
                                                                            <div key={group._id} className="p-4 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                                                                                <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full -mr-8 -mt-8 grayscale blur-xl" />
                                                                                <div className="flex items-center gap-2 mb-3">
                                                                                    <div className="w-1 h-3 bg-orange-500 rounded-full" />
                                                                                    <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight">{group.name}</p>
                                                                                </div>
                                                                                <div className="flex flex-wrap gap-2 pl-3">
                                                                                    {group.options.map(opt => (
                                                                                        <span key={opt._id} className="text-[10px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                                                                            {opt.name}
                                                                                            {opt.price_modifier_naira > 0 ? <span className="text-orange-500 font-black">+₦{opt.price_modifier_naira.toLocaleString()}</span> : <span className="text-emerald-500 uppercase">Free</span>}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {combo.swap_groups?.length === 0 && (
                                                                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                                                                    <Package size={24} className="text-slate-300 mx-auto mb-2 opacity-50" />
                                                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Standard Combo · Rigid Contents</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}


                        {/* Quick Tips or Audit Trail Placeholder */}
                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400 mb-4">Merchant Tip</h4>
                             <p className="text-sm font-medium leading-relaxed text-slate-300 italic mb-6">
                                "High-quality photos and detailed add-on descriptions can increase your conversion rate by up to <span className="text-white font-black underline decoration-orange-500">40%</span>. Ensure your visual assets are eye-catching!"
                             </p>
                             <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">💡</div>
                                  <span className="text-xs font-bold text-slate-400">Merchant Success Board</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
