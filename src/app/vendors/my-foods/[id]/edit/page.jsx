"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { useFoodById } from "@/app/hooks/useVendorFoodQuery";
import { updateMenuItem, updatePortion, addPortion, addChoiceGroup, addChoiceOption } from "@/app/lib/menuApi";
import { useVendorProfile } from "@/app/context/VendorProfileContext";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "@/app/components/BackButton";

// Steps
import Step1BasicInfo from "@/app/components/create-food/wizard/Step1BasicInfo";
import Step2Categories from "@/app/components/create-food/wizard/Step2Categories";
import Step3Portions from "@/app/components/create-food/wizard/Step3Portions";
import Step4AddOns from "@/app/components/create-food/wizard/Step4AddOns";
import Step5Review from "@/app/components/create-food/wizard/Step5Review";

const STEPS = [
    { id: 1, title: "Basic Info", short: "Basics" },
    { id: 2, title: "Category", short: "Category" },
    { id: 3, title: "Pricing", short: "Price" },
    { id: 4, title: "Extras", short: "Add-Ons" },
    { id: 5, title: "Review", short: "Done" },
];

export default function EditFoodPage() {
    const { id: foodId } = useParams();
    const router = useRouter();
    const store = useCreateFoodStore();
    const { vendorProfile } = useVendorProfile();
    const vendorId = vendorProfile?._id || vendorProfile?.id;

    const { food: fetchedData, isLoading: fetching, isError } =
        useFoodById(foodId, vendorId);
    const [mounted, setMounted] = useState(false);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleBeforeUnload = (e) => {
            if (store.isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [store.isDirty]);

    // Wait for vendor profile to load before rendering
    if (!vendorId && !fetching) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <Loader2 className="animate-spin text-orange-500" size={32} />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
                <p className="text-slate-500 font-bold">
                    Failed to load this food item.
                </p>
                <button
                    onClick={() => router.push("/vendors/my-foods")}
                    className="h-11 px-6 rounded-2xl bg-orange-500 text-white text-xs font-black uppercase tracking-widest"
                >
                    Back to My Foods
                </button>
            </div>
        );
    }

    // Initialize Store with Fetched Data
    useEffect(() => {
        if (fetchedData?.item && !initialized) {
            const d = fetchedData.item;

            store.initFromFood({
                _id: d._id,
                name: d.name,
                description: d.description,
                image_url: d.image_url || null,
                item_type: d.item_type || "FOOD",
                dietary_type: d.dietary_type || "mixed",
                prep_time_minutes: d.prep_time_minutes || null,
                tags: d.tags || [],

                // Category — buildFullItem populates these
                platform_category_id: d.platform_category_id?._id
                    || d.platform_category_id
                    || null,
                platform_category: d.platform_category_id || null,

                // Section
                vendor_section_id: d.vendor_section_id?._id
                    || d.vendor_section_id
                    || null,
                vendor_section: d.vendor_section_id || null,

                // Portions and choice groups come as top-level arrays from buildFullItem
                portions: fetchedData.portions || d.portions || [],
                choice_groups: fetchedData.choice_groups || d.choice_groups || [],
            });

            setInitialized(true);
        }
    }, [fetchedData, initialized]);

    if (!mounted) return null;

    if (fetching || !initialized) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
                <p className="text-slate-500 font-bold">Loading Food Item...</p>
            </div>
        );
    }

    const handleNext = () => store.setStep(Math.min(5, store.currentStep + 1));
    const handleBack = () => store.setStep(Math.max(1, store.currentStep - 1));
    const handleJump = (stepId) => {
        if (stepId < store.currentStep) store.setStep(stepId);
    };

    const handleUpdatePublish = async () => {
        if (!vendorId) {
            toast.error("Vendor session not found.");
            return;
        }

        store.setField("isSubmitting", true);
        const loadingToast = toast.loading("Updating your food...");

        try {
            // Update Base Item
            const itemPayload = {
                platform_category_id: store.platform_category_id,
                vendor_section_id: store.vendor_section_id,
                name: store.name.trim(),
                description: store.description.trim() || undefined,
                image_url: store.image_url || undefined,
                item_type: store.item_type,
                prep_time_minutes: store.prep_time_minutes,
                tags: store.tags,
            };

            await updateMenuItem(vendorId, foodId, itemPayload);

            // Sequentially update portions
            for (const p of store.portions) {
                const portionPayload = {
                    label: p.label,
                    price: p.price_naira * 100, // Make sure to convert kobo to actual if your backend logic demands it. Here keeping consistent.
                    is_default: p.is_default,
                    max_quantity: p.max_quantity || null,
                    sort_order: p.sort_order,
                };
                if (p.tempId && !p.tempId.includes(foodId) && p.tempId.length > 15) {
                    await updatePortion(vendorId, foodId, p.tempId, portionPayload);
                } else {
                    await addPortion(vendorId, foodId, portionPayload);
                }
            }

            toast.success("Food updated successfully!", { id: loadingToast });
            store.setField("isDirty", false);
            router.push("/vendors/my-foods");

        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Something went wrong.", { id: loadingToast });
            store.setField("isSubmitting", false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            <div className="max-w-4xl mx-auto pt-6 px-4 md:px-8">
                <div className="flex items-center justify-between mb-8">
                    <BackButton label="Back to Menu" className="py-2" />
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Edit Mode
                    </div>
                </div>

                {/* Wizard Progress Bar */}
                <div className="mb-12">
                    <div className="flex items-center justify-between relative">
                        {/* Background Track */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0" />
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-orange-500 rounded-full z-0 transition-all duration-500"
                            style={{ width: `${((store.currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                        />
                        {/* Steps */}
                        {STEPS.map((step) => {
                            const isPast = step.id < store.currentStep;
                            const isCurrent = step.id === store.currentStep;
                            const isFuture = step.id > store.currentStep;

                            return (
                                <button
                                    key={step.id}
                                    disabled={isFuture}
                                    onClick={() => handleJump(step.id)}
                                    className={`relative z-10 flex flex-col items-center group ${isFuture ? "cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-xs md:text-sm transition-all duration-500 border-2 ${isPast ? "bg-orange-500 border-orange-500 text-white" :
                                        isCurrent ? "bg-white border-orange-500 text-orange-600 shadow-md shadow-orange-500/20" :
                                            "bg-white border-slate-200 text-slate-400"
                                        }`}>
                                        {isPast ? "✓" : step.id}
                                    </div>
                                    <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors hidden md:block ${isCurrent ? "text-orange-600" : isPast ? "text-slate-600" : "text-slate-400"
                                        }`}>
                                        {step.title}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 md:p-10 min-h-[500px]">
                    {store.currentStep === 1 && <Step1BasicInfo onNext={handleNext} />}
                    {store.currentStep === 2 && <Step2Categories onNext={handleNext} onBack={handleBack} />}
                    {store.currentStep === 3 && <Step3Portions onNext={handleNext} onBack={handleBack} />}
                    {store.currentStep === 4 && <Step4AddOns onNext={handleNext} onBack={handleBack} />}
                    {store.currentStep === 5 && <Step5Review onBack={handleBack} onSetStep={(s) => store.setStep(s)} onComplete={handleUpdatePublish} />}
                </div>
            </div>
        </div>
    );
}
