"use client";

import { useState, useEffect } from "react";
import { useCreateComboStore } from "@/app/context/CreateComboStore";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import { getVendorMenuItems } from "@/app/lib/menuApi";
import {
    Search,
    Plus,
    Minus,
    X,
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    UtensilsCrossed
} from "lucide-react";
import toast from "react-hot-toast";

export default function ComboStep2Components({ onNext, onBack }) {
    const store = useCreateComboStore();
    const { vendorProfile } = useVendorProfile();
    const vendorId = vendorProfile?._id || vendorProfile?.id;

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!vendorId) return;
        const fetchItems = async () => {
            try {
                const data = await getVendorMenuItems(vendorId);
                // The API returns { items: [...] } based on common patterns
                setItems(data?.items || data || []);
            } catch (err) {
                console.error("Failed to fetch items", err);
                toast.error("Could not load your menu items");
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [vendorId]);

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddItem = (item) => {
        store.addComponent({
            menu_item_id: item._id,
            menu_item_name: item.name,
            menu_item_image: item.image_url || null,
            unit_price_naira: (item.default_portion?.price || 0) / 100, // API uses kobo
        });
    };

    const handleNext = () => {
        if (store.components.length < 2) {
            toast.error("A combo needs at least 2 items");
            return;
        }
        onNext();
    };

    // Calculations
    const totalSeparately = store.components.reduce(
        (sum, c) => sum + (c.unit_price_naira * c.quantity),
        0
    );
    const comboPrice = Number(store.price_naira) || 0;
    const savings = totalSeparately - comboPrice;
    const savingsPercent = totalSeparately > 0 ? Math.round((savings / totalSeparately) * 100) : 0;
    const isOverpriced = comboPrice >= totalSeparately && totalSeparately > 0;

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-xl">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Add Items to Bundle</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Search your menu and pick the items that make up this combo.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                {/* Left: Picker */}
                <div className="space-y-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Find an item..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-500 focus:ring-4 focus:ring-slate-900/10 dark:focus:ring-slate-500/10 transition-all font-bold text-slate-900 dark:text-white outline-none"
                        />
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="p-12 flex flex-col items-center justify-center gap-4 text-slate-400">
                                    <Loader2 className="animate-spin" size={32} />
                                    <p className="text-xs font-black uppercase tracking-widest">Loading menu...</p>
                                </div>
                            ) : filteredItems.length > 0 ? (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredItems.map(item => (
                                        <button
                                            key={item._id}
                                            onClick={() => handleAddItem(item)}
                                            className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-black text-slate-400">{item.name.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 dark:text-white truncate">{item.name}</h4>
                                                <p className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mt-0.5">
                                                    ₦{(item.default_portion?.price / 100 || 0).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-all">
                                                <Plus size={16} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center space-y-3">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                        <UtensilsCrossed size={20} />
                                    </div>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No items found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Selected components */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            Included Items
                            <span className="w-5 h-5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-[10px]">{store.components.length}</span>
                        </label>
                    </div>

                    <div className="space-y-3">
                        {store.components.map(comp => (
                            <div key={comp.tempId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 group/card shadow-sm">
                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shrink-0">
                                    {comp.menu_item_image ? (
                                        <img src={comp.menu_item_image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-black text-slate-400 text-xs">
                                            {comp.menu_item_name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm">{comp.menu_item_name}</h4>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
                                            <button
                                                onClick={() => store.updateComponent(comp.tempId, { quantity: Math.max(1, comp.quantity - 1) })}
                                                className="w-6 h-6 flex items-center justify-center rounded-md bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                            ><Minus size={12} /></button>
                                            <span className="w-6 text-center font-black text-xs text-slate-900 dark:text-white">{comp.quantity}</span>
                                            <button
                                                onClick={() => store.updateComponent(comp.tempId, { quantity: Math.min(10, comp.quantity + 1) })}
                                                className="w-6 h-6 flex items-center justify-center rounded-md bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                            ><Plus size={12} /></button>
                                        </div>
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                            ₦{(comp.unit_price_naira * comp.quantity).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => store.removeComponent(comp.tempId)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-0 group-hover/card:opacity-100"
                                ><X size={16} /></button>
                            </div>
                        ))}

                        {store.components.length === 0 && (
                            <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-2">
                                <p className="text-sm font-bold text-slate-400">Your combo is empty</p>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Select items from the list</p>
                            </div>
                        )}
                    </div>

                    {/* Savings Summary */}
                    {store.components.length > 0 && (
                        <div className="bg-slate-900 dark:bg-slate-800 rounded-[2rem] p-8 text-white space-y-6 shadow-xl shadow-slate-900/20">
                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400">
                                <span>Savings Summary</span>
                                {savings > 0 && <CheckCircle2 className="text-emerald-400" size={16} />}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400 font-medium">Items separately</span>
                                    <span className="text-sm font-black line-through text-slate-500">₦{totalSeparately.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-300 font-bold">Your combo price</span>
                                    <span className="text-2xl font-black text-white tracking-tight">₦{comboPrice.toLocaleString()}</span>
                                </div>
                            </div>

                            {savings > 0 ? (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                                            <span className="text-[10px] font-black leading-none">%</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Customer saves</span>
                                            <span className="text-lg font-black text-emerald-500 tracking-tight">₦{savings.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-black text-emerald-400">{savingsPercent}% <span className="text-[10px] font-bold">off</span></span>
                                </div>
                            ) : totalSeparately > 0 ? (
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-start gap-3">
                                    <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={16} />
                                    <p className="text-xs font-bold text-orange-400 leading-relaxed">
                                        Your combo price is higher than buying items separately. Customers may not see value in this deal.
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="h-14 px-6 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-900 rounded-2xl transition-all font-black uppercase tracking-widest gap-2 active:scale-95 text-xs shadow-sm border border-slate-100 dark:border-slate-800"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <button
                    onClick={handleNext}
                    disabled={store.components.length < 2}
                    className="h-14 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-40"
                >
                    Next Step <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </button>
            </div>
        </div>
    );
}
