"use client";

import { useState, useEffect } from "react";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { getPlatformCategories, getVendorSections, createVendorSection } from "@/app/lib/menuApi";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import { ChevronDown, ChevronRight, CheckCircle2, Loader2, Plus, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function Step2Categories({ onBack, onNext }) {
    const store = useCreateFoodStore();
    const { vendorProfile } = useVendorProfile();
    const vendorId = vendorProfile?._id || vendorProfile?.id;

    const [categories, setCategories] = useState([]);
    const [sections, setSections] = useState([]);
    const [loadingCats, setLoadingCats] = useState(true);
    const [loadingSecs, setLoadingSecs] = useState(true);

    const [expandedRoot, setExpandedRoot] = useState(null);
    const [showSectionForm, setShowSectionForm] = useState(false);
    const [newSectionName, setNewSectionName] = useState("");
    const [savingSection, setSavingSection] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const catRes = await getPlatformCategories();
                setCategories(catRes.data || []);
            } catch (err) {
                toast.error("Failed to load platform categories");
            } finally {
                setLoadingCats(false);
            }

            if (vendorId) {
                try {
                    const secRes = await getVendorSections(vendorId);
                    setSections(secRes.data || []);
                } catch (err) {
                    toast.error("Failed to load your menu sections");
                } finally {
                    setLoadingSecs(false);
                }
            }
        };
        load();
    }, [vendorId]);

    const handleSelectCategory = (categoryId, rootLabel, subLabel) => {
        store.setField("platform_category_id", categoryId);
        store.setField("platform_category_label", `${rootLabel} → ${subLabel}`);
    };

    const handleCreateSection = async () => {
        if (!newSectionName.trim()) return;
        setSavingSection(true);
        try {
            const res = await createVendorSection(vendorId, newSectionName.trim());
            const created = res.data;
            setSections(prev => [...prev, created]);
            store.setField("vendor_section_id", created._id);
            store.setField("vendor_section_label", created.name);
            setShowSectionForm(false);
            setNewSectionName("");
            toast.success("Section created");
        } catch (error) {
            toast.error("Failed to create section");
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
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Split Grid for Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ─── Column 1: Platform Categories ────────────────────────── */}
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 mb-1">What type of food is this?</h2>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">Pick the category that matches your food. This helps customers find it.</p>
                    </div>

                    <div className="space-y-3">
                        {loadingCats ? (
                            <div className="p-8 text-center text-slate-400 font-bold text-sm bg-slate-50 rounded-2xl flex flex-col items-center gap-2">
                                <Loader2 className="animate-spin text-orange-500" /> Loading...
                            </div>
                        ) : categories.map((rootCat) => (
                            <div key={rootCat._id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                                <button
                                    onClick={() => setExpandedRoot(expandedRoot === rootCat._id ? null : rootCat._id)}
                                    className="w-full h-14 px-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                >
                                    <span className="font-black text-slate-900 tracking-tight">{rootCat.name}</span>
                                    {expandedRoot === rootCat._id ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                                </button>

                                {/* Expanded Subcats */}
                                {expandedRoot === rootCat._id && (
                                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-2">
                                        {rootCat.subCategories?.map(sub => {
                                            const isSelected = store.platform_category_id === sub._id;
                                            return (
                                                <button
                                                    key={sub._id}
                                                    onClick={() => handleSelectCategory(sub._id, rootCat.name, sub.name)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${isSelected
                                                        ? "bg-orange-50 border-orange-200 text-orange-600 shadow-sm"
                                                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                                        }`}
                                                >
                                                    {sub.name}
                                                    {isSelected && <CheckCircle2 size={12} />}
                                                </button>
                                            )
                                        })}
                                        {(!rootCat.subCategories || rootCat.subCategories.length === 0) && (
                                            <span className="text-xs text-slate-400 italic">No exact types available</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Selected Badge */}
                    {store.platform_category_label && (
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between shadow-sm">
                            <div className="text-xs font-bold text-orange-800 tracking-wide uppercase">Selected Type</div>
                            <div className="text-sm font-black text-orange-600">{store.platform_category_label}</div>
                        </div>
                    )}
                </div>

                {/* ─── Column 2: Vendor Sections ────────────────────────────── */}
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 mb-1">Which menu section does this go in?</h2>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">Sections are like headings on your menu (e.g., "Starters"). Your food appears under "Other" if you skip this.</p>
                    </div>

                    {loadingSecs ? (
                        <div className="p-8 text-center text-slate-400 font-bold text-sm bg-slate-50 rounded-2xl flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin text-slate-400" /> Loading sections...
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Create New Inline Form */}
                            {showSectionForm ? (
                                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Section Name</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newSectionName}
                                            onChange={e => setNewSectionName(e.target.value)}
                                            placeholder="e.g. Swallows & Soups"
                                            className="flex-1 h-10 px-3 border border-slate-200 rounded-xl focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-bold placeholder:font-normal outline-none"
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleCreateSection}
                                            disabled={savingSection || !newSectionName.trim()}
                                            className="h-10 px-4 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center shrink-0 min-w-[70px]"
                                        >
                                            {savingSection ? <Loader2 size={14} className="animate-spin" /> : "Add"}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setShowSectionForm(false)}
                                        className="text-xs font-bold text-slate-500 hover:text-slate-800 block text-center w-full"
                                    >Cancel</button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowSectionForm(true)}
                                    className="w-full h-12 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 text-slate-500 font-bold text-sm rounded-2xl hover:bg-slate-50 hover:border-slate-400 hover:text-slate-800 transition-all"
                                >
                                    <Plus size={16} /> Create New Section
                                </button>
                            )}

                            {/* Section Pills */}
                            <div className="flex flex-wrap gap-2 pt-2">
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
                                            className={`h-9 px-4 rounded-xl text-xs font-bold transition-all border shadow-sm ${isSelected
                                                ? "bg-slate-900 text-white border-slate-900"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                }`}
                                        >
                                            {sec.name} {isSelected && "✓"}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="h-12 px-6 flex items-center py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all font-bold gap-2 focus:scale-95 text-sm"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <button
                    onClick={handleNext}
                    className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm active:scale-95"
                >
                    Next: Portions & Pricing →
                </button>
            </div>
        </div>
    );
}
