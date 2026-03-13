"use client";

import { useEffect, useState } from "react";
import { useCreateComboStore } from "@/app/context/CreateComboStore";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import ComboStep1Basics from "./components/ComboStep1Basics";
import ComboStep2Components from "./components/ComboStep2Components";
import ComboStep3Swaps from "./components/ComboStep3Swaps";
import { 
    ChevronRight, 
    ArrowLeft, 
    Loader2, 
    Rocket,
    Info,
    Sparkles,
    ShieldCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import BackButton from "@/app/components/BackButton";
import {
    createVariant,
    addVariantComponent,
    addVariantChoiceGroup,
    addVariantChoiceOption,
    toggleVariantAvailability,
} from "@/app/lib/menuApi";

const STEPS = [
    { id: 1, label: "Basics", icon: "💎" },
    { id: 2, label: "Building", icon: "🍱" },
    { id: 3, label: "Swaps", icon: "🔄" },
];

export default function CreateComboPage() {
    const store = useCreateComboStore();
    const router = useRouter();
    const { vendorProfile } = useVendorProfile();
    const vendorId = vendorProfile?._id || vendorProfile?.id;
    const [step, setStep] = useState(1);

    // Sync store step with local step
    useEffect(() => {
        store.setStep(step);
    }, [step]);

    const isDirty = store.name || store.components.length > 0;

    // Warn before leaving if data is entered
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    const handlePublish = async () => {
        if (!vendorId) {
            toast.error("Vendor session not found.");
            return;
        }

        store.setField("isSubmitting", true);
        const loadingToast = toast.loading("Finalizing your combo deal...");

        try {
            // 1. Create base variant
            const variantRes = await createVariant(vendorId, {
                name: store.name.trim(),
                description: store.description?.trim() || undefined,
                image_url: store.image_url || undefined,
                price: Math.round(Number(store.price_naira) * 100),
                prep_time_minutes: store.prep_time_minutes || undefined,
                tags: store.tags || [],
            });

            const variantId = variantRes?.variant?._id || variantRes?.variant?.id || variantRes?._id;
            if (!variantId) throw new Error("Combo created but ID wasn't returned.");

            // 2. Add fixed components
            for (let i = 0; i < store.components.length; i++) {
                const comp = store.components[i];
                await addVariantComponent(vendorId, variantId, {
                    component_type: "FIXED",
                    menu_item_id: comp.menu_item_id,
                    quantity: comp.quantity || 1,
                    label: comp.menu_item_name,
                    sort_order: i,
                });
            }

            // 3. Add swap groups
            if (store.swap_groups?.length > 0) {
                for (let i = 0; i < store.swap_groups.length; i++) {
                    const swapGroup = store.swap_groups[i];
                    if (swapGroup.options.length === 0) continue;

                    const groupRes = await addVariantChoiceGroup(vendorId, variantId, {
                        name: swapGroup.label,
                        min_selections: 0,
                        max_selections: 1,
                        is_required: false,
                        sort_order: i,
                    });

                    const groupId = groupRes?.group?._id || groupRes?.choiceGroup?._id || groupRes?.id;
                    if (!groupId) continue;

                    for (let j = 0; j < swapGroup.options.length; j++) {
                        const opt = swapGroup.options[j];
                        await addVariantChoiceOption(groupId, {
                            label: opt.label,
                            menu_item_id: opt.menu_item_id || null,
                            price_modifier: Math.round(Number(opt.price_modifier_naira || 0) * 100),
                            is_available: true,
                            sort_order: j,
                        });
                    }
                }
            }

            // 4. Finalize
            await toggleVariantAvailability(vendorId, variantId, true);
            toast.success("Combo is live on your menu! 🎉", { id: loadingToast });
            store.reset();
            if (typeof window !== "undefined") sessionStorage.removeItem("gd_create_combo_wizard");
            router.push("/vendors/my-foods");

        } catch (error) {
            console.error("Publishing error", error);
            const msg = error?.response?.data?.message || error?.message;
            toast.error(msg || "Failed to publish combo.", { id: loadingToast });
        } finally {
            store.setField("isSubmitting", false);
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (!store.name.trim() || store.name.length < 2) {
                toast.error("Give your combo a name (min 2 chars)");
                return;
            }
            if (!store.price_naira || Number(store.price_naira) <= 0) {
                toast.error("Valid price is required");
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (store.components.length < 2) {
                toast.error("Must add at least 2 items");
                return;
            }
            setStep(3);
        } else if (step === 3) {
            handlePublish();
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
        else router.back();
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 transition-colors">
            {/* Header Strip */}
            <div className="max-w-[1400px] mx-auto p-6 md:p-8 flex items-center justify-between">
                <BackButton label="Exit Studio" className="py-2.5 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-orange-200 transition-all active:scale-95" />
                
                <div className="flex items-center gap-6">
                    {isDirty && (
                        <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-full shadow-sm">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> Draft in Progress
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 font-black text-xs">CS</div>
                         <div className="hidden sm:block">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Operating Studio</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">Combo Builder v2.4</p>
                         </div>
                    </div>
                </div>
            </div>

            {/* Page Title & Wizard Container */}
            <div className="dark:max-w-[950px] max-w-[1400px] mx-auto px-6">
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Creation Environment</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[0.9] mb-4">
                        Combo <span className="text-orange-500">Studio</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed flex items-start gap-2 max-w-2xl">
                        <Sparkles size={20} className="text-orange-500 shrink-0 mt-1" />
                        Bundle your best-selling items into high-value deals. Curate the perfect mix and set your own rules.
                    </p>
                </div>

                {/* PROGRESS TRACKER */}
                <div className="mb-14 relative px-4">
                    <div className="absolute top-7 left-10 right-10 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-orange-500 transition-all duration-700 ease-in-out"
                            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                        />
                    </div>
                    
                    <div className="relative flex justify-between">
                        {STEPS.map((s) => (
                            <div key={s.id} className="flex flex-col items-center gap-3">
                                <div className={`w-14 h-14 rounded-[1.4rem] flex items-center justify-center text-xl transition-all duration-500 border-2 ${
                                    step === s.id 
                                        ? "bg-white dark:bg-slate-900 border-orange-500 text-white shadow-xl shadow-orange-500/10 scale-110" 
                                        : step > s.id 
                                            ? "bg-slate-900 border-slate-900 text-white" 
                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                                }`}>
                                    {step > s.id ? (
                                        <ShieldCheck size={24} className="text-emerald-500" />
                                    ) : (
                                        <span className={step === s.id ? "grayscale-0" : "grayscale opacity-50"}>{s.icon}</span>
                                    )}
                                </div>
                                <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${
                                    step === s.id ? "text-orange-500" : "text-slate-400"
                                }`}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* STEP CONTENT CONTAINER */}
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-[0_40px_80px_-12px_rgba(0,0,0,0.06)] dark:shadow-none min-h-[500px] overflow-hidden transition-all duration-500">
                    {step === 1 && <ComboStep1Basics onNext={handleNext} />}
                    {step === 2 && <ComboStep2Components onNext={handleNext} onBack={handleBack} />}
                    {step === 3 && <ComboStep3Swaps onBack={handleBack} />}
                </div>

                {/* Information Card */}
                <div className="mt-12 flex items-center gap-4 p-6 rounded-[2rem] bg-slate-900 text-white shadow-2xl">
                     <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0">
                          <Info size={24} className="text-orange-500" />
                     </div>
                     <div className="flex-1">
                          <p className="text-xs font-black uppercase tracking-widest text-orange-500 mb-1">Operational Tip</p>
                          <p className="text-sm font-medium text-slate-300">Your combo Deal will be marked as "Active" immediately after publishing. You can toggle availability anytime from the Menu Manager.</p>
                     </div>
                </div>
            </div>

            {/* FIXED FOOTER */}
            <div className="fixed -bottom-5 left-0 md:left-[265px] right-0 z-50 flex justify-center p-4 pointer-events-none transition-all duration-500 animate-in slide-in-from-bottom-full">
                <div className="w-full max-w-[950px] p-6 rounded-t-[2.5rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-b-0 border-slate-200 dark:border-slate-800 pointer-events-auto shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.05)] transition-all">
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex-1">
                            <button 
                                onClick={handleBack}
                                disabled={store.isSubmitting}
                                className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-3 disabled:opacity-30 active:scale-95"
                            >
                                <ArrowLeft size={16} strokeWidth={3} /> Previous Step
                            </button>
                        </div>

                        <div className="flex-none flex items-center gap-8">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Deployment Module</span>
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase">Phase {step} of 3</span>
                            </div>

                            <button 
                                onClick={handleNext}
                                disabled={store.isSubmitting}
                                className={`h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl ${
                                    step === 3 
                                        ? 'bg-orange-500 text-white shadow-orange-500/20' 
                                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                }`}
                            >
                                {store.isSubmitting ? (
                                    <><Loader2 className="animate-spin" size={18} strokeWidth={3} /> Finalizing...</>
                                ) : (
                                    <>
                                        {step === 3 ? (
                                             <><Rocket size={18} strokeWidth={3} /> Launch Combo Deal</>
                                        ) : (
                                             <>
                                                  {step === 1 ? 'Configure Components' : 'Review & Setup Swaps'}
                                                  <ChevronRight size={18} strokeWidth={3} />
                                             </>
                                        )}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
