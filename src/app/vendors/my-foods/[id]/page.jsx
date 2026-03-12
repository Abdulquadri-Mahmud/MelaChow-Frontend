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
import { Loader2, ImageIcon, X, Plus, Tag, Clock, ChefHat, Leaf, FolderOpen, LayoutGrid } from "lucide-react";
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

const DIETARY_COLORS = {
    veg: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400",
    vegan: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
    halal: "bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400",
    kosher: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400",
    "non-veg": "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400",
    mixed: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
};

const DietaryBadge = ({ type }) => (
    <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border border-transparent ${DIETARY_COLORS[type] || DIETARY_COLORS.mixed}`}>
        {type || "mixed"}
    </span>
);

const SectionCard = ({ title, action, children }) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] overflow-hidden transition-colors mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{title}</h3>
            {action}
        </div>
        <div className="p-6">{children}</div>
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
        <SectionCard title="Basic Info" action={<button onClick={openEdit} className="h-8 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 transition-all">Edit</button>}>
            <div className="space-y-5">
                {/* Image + description row */}
                <div className="flex gap-4">
                    <div className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                        {item.image_url
                            ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-3xl">{typeMeta.emoji}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Description</p>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{item.description || <span className="italic text-slate-300 dark:text-slate-600">No description provided.</span>}</p>
                    </div>
                </div>
                {/* Meta chips */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1"><ChefHat size={10}/> Type</p>
                        <p className="text-sm font-black text-slate-800 dark:text-white">{typeMeta.emoji} {typeMeta.label}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1"><Leaf size={10}/> Dietary</p>
                        <DietaryBadge type={item.dietary_type} />
                    </div>
                    {item.prep_time_minutes && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1"><Clock size={10}/> Prep Time</p>
                            <p className="text-sm font-black text-slate-800 dark:text-white">{item.prep_time_minutes} min</p>
                        </div>
                    )}
                    {item.image_url && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 col-span-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Image URL</p>
                            <p className="text-[11px] font-medium text-slate-500 truncate">{item.image_url}</p>
                        </div>
                    )}
                </div>
                {/* Tags */}
                {item.tags?.length > 0 && (
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><Tag size={10}/> Tags</p>
                        <div className="flex flex-wrap gap-1.5">
                            {item.tags.map(t => (
                                <span key={t} className="h-7 px-3 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">#{t}</span>
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
                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={handleSave} disabled={saving} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-11 px-6 rounded-xl font-black text-xs uppercase tracking-widest flex gap-2 items-center active:scale-95 transition-all">
                        {saving && <Loader2 className="animate-spin" size={16} />} Save Changes
                    </button>
                    <button onClick={() => setEditing(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-white h-11 px-4 font-bold text-sm transition-all">Cancel</button>
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
        <SectionCard title="Category & Section" action={<button onClick={openEdit} className="h-8 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 transition-all">Edit</button>}>
            <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><FolderOpen size={10}/> Platform Category</p>
                    {cat ? (
                        <div className="flex items-center gap-2">
                            {cat.parent && <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{cat.parent.name}</span>}
                            {cat.parent && <span className="text-slate-300 dark:text-slate-700">›</span>}
                            <span className="text-sm font-black text-orange-600 dark:text-orange-400">{cat.name}</span>
                        </div>
                    ) : <p className="text-sm font-medium text-slate-400">No category set</p>}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><LayoutGrid size={10}/> Your Menu Section</p>
                    {sectionName
                        ? <span className="h-8 px-4 inline-flex items-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-800 dark:text-white">{sectionName}</span>
                        : <p className="text-sm font-medium text-slate-400">All items / no specific section</p>}
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
                                <button key={sub._id} onClick={() => setForm({ ...form, platform_category_id: sub._id, platform_category_label: sub.name })} className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${isSelected ? "border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 shadow-sm ring-2 ring-orange-500/20" : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 hover:border-orange-300 hover:bg-orange-50/40"}`}>
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
    const [newPortion, setNewPortion] = useState({ label: "", price_naira: "" });
    const [adding, setAdding] = useState(false);

    const openEdit = (p) => {
        setPortionForm({ label: p.label, price_naira: p.price_naira, is_default: p.is_default });
        setEditingPortionId(p._id);
    };

    const handleSave = async (pId) => {
        if (!portionForm.price_naira || Number(portionForm.price_naira) <= 0) return toast.error("Price must be > 0");
        setSaving(true);
        try {
            await updatePortion(vendorId, itemId, pId, { label: portionForm.label.trim(), price: Math.round(Number(portionForm.price_naira) * 100), is_default: portionForm.is_default });
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
            await addPortion(vendorId, itemId, { label: newPortion.label.trim(), price: Math.round(Number(newPortion.price_naira) * 100), is_default: item.portions.length === 0, sort_order: item.portions.length });
            queryClient.invalidateQueries({ queryKey: ["food-item", itemId] });
            setShowAdd(false); setNewPortion({ label: "", price_naira: "" });
            toast.success("Size added");
        } catch (err) { toast.error(err?.response?.data?.message || "Error adding"); }
        finally { setAdding(false); }
    };

    return (
        <SectionCard title="Sizes & Prices" action={!showAdd && <button onClick={() => setShowAdd(true)} className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-colors">+ Add Size</button>}>
            <div className="space-y-3 mt-2">
                {item.portions?.map(p => (
                    <div key={p._id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                        {editingPortionId === p._id ? (
                            <div className="flex-1 flex flex-wrap gap-2 items-center">
                                <input className="h-10 px-3 w-32 rounded-xl text-sm border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" placeholder="Label" value={portionForm.label} onChange={e => setPortionForm({ ...portionForm, label: e.target.value })} />
                                <input className="h-10 px-3 w-28 rounded-xl text-sm border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" type="number" placeholder="Price ₦" value={portionForm.price_naira} onChange={e => setPortionForm({ ...portionForm, price_naira: e.target.value })} />
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 ml-2"><input type="checkbox" className="rounded" checked={portionForm.is_default} onChange={e => setPortionForm({ ...portionForm, is_default: e.target.checked })} /> Default</label>
                                <button onClick={() => handleSave(p._id)} disabled={saving} className="h-10 ml-auto px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold active:scale-95 transition-all">Save</button>
                                <button onClick={() => setEditingPortionId(null)} className="h-10 px-3 text-xs font-bold text-slate-500 transition-all">Cancel</button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-4 text-sm font-bold">
                                    <span className="text-slate-800 dark:text-white">{p.label}</span>
                                    <span className="text-orange-600 dark:text-orange-400">₦{p.price_naira?.toLocaleString()}</span>
                                    {p.is_default && <span className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 font-black uppercase tracking-widest px-2.5 py-1 rounded-md">Default</span>}
                                </div>
                                <div className="flex gap-1 ml-auto shrink-0">
                                    <button onClick={() => openEdit(p)} className="h-8 px-3 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-all active:scale-95">Edit</button>
                                    <button onClick={() => handleDelete(p._id)} disabled={item.portions.length <= 1} className="h-8 px-3 rounded-lg text-xs font-black text-rose-500 lg:bg-white dark:lg:bg-slate-900 lg:border lg:border-slate-200 dark:border-slate-700 hover:text-rose-700 hover:border-rose-300 transition-all disabled:opacity-30 active:scale-95">✕</button>
                                </div>
                            </>
                        )}
                    </div>
                ))}

                {showAdd && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-200 dark:border-orange-500/20 flex flex-wrap gap-2 items-center mt-4">
                        <input className="h-10 px-3 w-32 rounded-xl text-sm border border-orange-200 dark:border-orange-500/30 bg-white dark:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" placeholder="Label e.g. Medium" value={newPortion.label} onChange={e => setNewPortion({ ...newPortion, label: e.target.value })} autoFocus />
                        <input className="h-10 px-3 w-28 rounded-xl text-sm border border-orange-200 dark:border-orange-500/30 bg-white dark:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" type="number" placeholder="Price ₦" value={newPortion.price_naira} onChange={e => setNewPortion({ ...newPortion, price_naira: e.target.value })} />
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

    const [showAddGroup, setShowAddGroup] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: "", is_required: false });
    const [addingToGroup, setAddingToGroup] = useState(null);
    const [newOption, setNewOption] = useState({ label: "", price_modifier_naira: "" });

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
            await addChoiceOption(gId, { label: newOption.label.trim(), price_modifier_naira: Number(newOption.price_modifier_naira) || 0, is_available: true, sort_order: 999 });
            queryClient.invalidateQueries({ queryKey: ["food-item", itemId] });
            setAddingToGroup(null); setNewOption({ label: "", price_modifier_naira: "" });
            toast.success("Option added");
        } catch (err) { toast.error("Error adding option"); }
    };

    return (
        <SectionCard title="Customer Choices" action={!showAddGroup && <button onClick={() => setShowAddGroup(true)} className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-colors">+ Add Group</button>}>
            <div className="space-y-6">
                {item.choice_groups?.map(g => (
                    <div key={g._id} className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                        <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-4 flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 dark:border-slate-800 gap-4">
                            {editingGroupId === g._id ? (
                                <div className="flex-1 flex flex-wrap gap-2 items-center">
                                    <input className="h-10 px-3 min-w-[150px] flex-1 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" placeholder="Group Name e.g Add Extra Meat" value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} />
                                    <label className="text-xs font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300 ml-2"><input type="checkbox" className="rounded" checked={groupForm.is_required} onChange={e => setGroupForm({ ...groupForm, is_required: e.target.checked })} /> Required</label>
                                    <input type="number" className="h-10 px-3 w-20 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" value={groupForm.max_selections} onChange={e => setGroupForm({ ...groupForm, max_selections: e.target.value })} placeholder="Max" />
                                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 ml-auto">
                                        <button onClick={() => handleSaveGroup(g._id)} className="h-10 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold active:scale-95 transition-all">Save</button>
                                        <button onClick={() => setEditingGroupId(null)} className="h-10 px-3 text-xs font-bold text-slate-500">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-black text-[15px] text-slate-800 dark:text-white uppercase tracking-tight">{g.name}</h4>
                                            {g.is_required ? (
                                                <span className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 text-[10px] px-2 py-0.5 rounded font-black tracking-widest uppercase">Required</span>
                                            ) : (
                                                <span className="bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded font-black tracking-widest uppercase">Optional</span>
                                            )}
                                        </div>
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Can select up to {g.max_selections || 1} {g.max_selections > 1 ? "options" : "option"}</span>
                                    </div>
                                    <div className="flex gap-2 shrink-0 self-start sm:self-auto">
                                        <button onClick={() => { setGroupForm({ name: g.name, is_required: g.is_required, min_selections: g.min_selections, max_selections: g.max_selections }); setEditingGroupId(g._id); }} className="h-8 px-3 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-all active:scale-95">Edit</button>
                                        <button onClick={() => handleDeleteGroup(g._id, g.name)} className="h-8 px-3 rounded-lg text-xs font-black text-rose-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-rose-700 hover:border-rose-300 transition-all active:scale-95">✕</button>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="p-2 space-y-1">
                            {g.options?.map(o => (
                                <div key={o._id} className="flex flex-wrap justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl group transition-colors">
                                    {editingOptionId === o._id ? (
                                        <div className="flex-1 flex flex-wrap gap-2 items-center">
                                            <input className="h-9 px-3 w-40 rounded-lg text-sm border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-orange-500" placeholder="Option Label" value={optionForm.label} onChange={e => setOptionForm({ ...optionForm, label: e.target.value })} />
                                            <input className="h-9 px-3 w-28 rounded-lg text-sm border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-orange-500" type="number" placeholder="+₦" value={optionForm.price_modifier_naira} onChange={e => setOptionForm({ ...optionForm, price_modifier_naira: e.target.value })} />
                                            <button onClick={() => handleSaveOption(g._id, o._id)} className="h-9 px-4 ml-auto lg:ml-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold active:scale-95">Save</button>
                                            <button onClick={() => setEditingOptionId(null)} className="h-9 px-3 text-xs font-bold text-slate-500">Cancel</button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700 shrink-0" />
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{o.label}</span>
                                                <span className={`text-[11px] font-black uppercase tracking-widest ml-1 ${o.price_modifier_naira > 0 ? 'text-slate-500 dark:text-slate-400' : 'text-emerald-500 dark:text-emerald-400'}`}>{o.price_modifier_naira > 0 ? `+ ₦${o.price_modifier_naira?.toLocaleString()}` : "FREE"}</span>
                                            </div>
                                            <div className="flex gap-2 ml-auto mt-2 sm:mt-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setOptionForm({ label: o.label, price_modifier_naira: o.price_modifier_naira, image_url: o.image_url }); setEditingOptionId(o._id); }} className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white px-2">Edit</button>
                                                <button onClick={() => handleDeleteOption(g._id, o._id)} className="text-xs font-bold text-rose-500 hover:text-rose-700 px-2 lg:bg-white dark:lg:bg-slate-900 lg:border lg:border-slate-200 dark:lg:border-slate-700 rounded-lg">✕</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {addingToGroup === g._id ? (
                                <div className="p-3 my-2 mx-2 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex flex-wrap gap-2 items-center border border-orange-200 dark:border-orange-500/30">
                                    <input className="h-9 px-3 w-40 rounded-lg text-sm border bg-white dark:bg-slate-900 border-orange-200 dark:border-orange-500/30 focus:border-orange-500" placeholder="Option Label" value={newOption.label} onChange={e => setNewOption({ ...newOption, label: e.target.value })} autoFocus />
                                    <input className="h-9 px-3 w-28 rounded-lg text-sm border bg-white dark:bg-slate-900 border-orange-200 dark:border-orange-500/30 focus:border-orange-500" type="number" placeholder="+₦" value={newOption.price_modifier_naira} onChange={e => setNewOption({ ...newOption, price_modifier_naira: e.target.value })} />
                                    <button onClick={() => handleAddOption(g._id)} className="h-9 px-4 ml-auto lg:ml-2 bg-orange-500 text-white rounded-lg text-xs font-bold active:scale-95 transition-all">Add</button>
                                    <button onClick={() => setAddingToGroup(null)} className="h-9 px-3 text-xs font-bold text-slate-500">Cancel</button>
                                </div>
                            ) : (
                                <button onClick={() => setAddingToGroup(g._id)} className="w-full text-left py-3 px-4 text-[11px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition-colors hover:bg-orange-50/50 dark:hover:bg-orange-500/5 rounded-xl">+ Add Option</button>
                            )}
                        </div>
                    </div>
                ))}

                {showAddGroup && (
                    <div className="p-5 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-[1.5rem] flex flex-col gap-4">
                        <p className="text-xs font-black uppercase text-orange-600 dark:text-orange-400 tracking-widest">New Choice Group</p>
                        <input className="h-11 px-4 rounded-xl border border-orange-200 dark:border-orange-500/30 bg-white dark:bg-slate-900 text-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" placeholder="e.g. Choose Protein" value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} autoFocus />
                        <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300 ml-1"><input type="checkbox" className="rounded" checked={newGroup.is_required} onChange={e => setNewGroup({ ...newGroup, is_required: e.target.checked })} /> Required choice</label>
                        <div className="flex gap-3 pt-2">
                            <button onClick={handleAddGroup} className="h-11 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all">Create Group</button>
                            <button onClick={() => setShowAddGroup(false)} className="h-11 px-4 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all">Cancel</button>
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
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-24 transition-colors">
            <div className="max-w-xl mx-auto pt-6 px-4 md:px-8 space-y-6">

                {/* BACK BUTTON */}
                <BackButton label="Back to My Foods" href="/vendors/my-foods" />

                {/* HEADER STRIP */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-[1.5rem] shadow-sm mb-6">
                    <div className="relative h-48 rounded-[1rem] overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon size={48} className="text-slate-300 dark:text-slate-700" />
                            </div>
                        )}
                        <div className="absolute top-3 left-3 flex gap-2">
                            {item.is_archived && <span className="px-3 py-1 bg-slate-900/80 text-white text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur">Archived</span>}
                            {!item.is_available && !item.is_archived && <span className="px-3 py-1 bg-amber-500/90 text-white text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur">Hidden</span>}
                            {item.is_available && <span className="px-3 py-1 bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur">Live</span>}
                        </div>
                    </div>

                    <div className="flex items-start justify-between gap-4 mt-4 px-2">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{item.name}</h1>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <DietaryBadge type={item.dietary_type} />
                                <span className="text-[10px] px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest rounded-lg">{item.item_type}</span>
                                {item.prep_time_minutes && <span className="text-[10px] px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-lg">⏱ {item.prep_time_minutes} min</span>}
                            </div>
                        </div>

                        <div className="flex gap-2 shrink-0 flex-col sm:flex-row">
                            <button onClick={handleToggleAvailability} className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-600 dark:text-slate-300 hover:border-slate-400 transition-all active:scale-95 bg-white dark:bg-slate-900">
                                {item.is_available ? "Hide" : "Show"}
                            </button>
                            <button onClick={handleArchiveToggle} className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-500 hover:border-rose-300 hover:text-rose-500 transition-all active:scale-95 bg-white dark:bg-slate-900">
                                {item.is_archived ? "Restore" : "Archive"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* COMPONENT SECTIONS */}
                <BasicInfoSection item={item} vendorId={vendorId} itemId={itemId} queryClient={queryClient} />
                <CategorySection item={item} vendorId={vendorId} itemId={itemId} queryClient={queryClient} allSections={allSections} />
                <PortionsSection item={item} vendorId={vendorId} itemId={itemId} queryClient={queryClient} />
                <AddOnsSection item={item} vendorId={vendorId} itemId={itemId} queryClient={queryClient} />

                {item.combos?.length > 0 && (
                    <SectionCard title="In Combos">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">This item is part of these combos. Archive or remove it from a combo before deleting.</p>
                        <div className="flex flex-wrap gap-2">
                            {item.combos.map(combo => (
                                <span key={combo._id} className="h-8 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-sm">
                                    🍱 {combo.name} <span className="text-slate-400 dark:text-slate-500 font-medium">₦{combo.price_naira?.toLocaleString()}</span>
                                </span>
                            ))}
                        </div>
                    </SectionCard>
                )}
            </div>
        </div>
    );
}
