"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Edit2, X, ChevronRight, Rocket, Loader2 } from "lucide-react";
import BackButton from "@/app/components/BackButton";
import toast from "react-hot-toast";

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

export default function CreateFoodWizardPage() {
  const store = useCreateFoodStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

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

  if (!mounted) return null; // Avoid hydration mismatch

  // Navigation blocks
  const handleNext = () => store.setStep(Math.min(5, store.currentStep + 1));
  const handleBack = () => store.setStep(Math.max(1, store.currentStep - 1));
  const handleJump = (stepId) => {
    // Only allow jumping backward, or jumping to the very next step if current is valid
    if (stepId < store.currentStep) store.setStep(stepId);
  };

  const validateStep = () => {
    if (store.currentStep === 1) {
      if (!store.name.trim() || store.name.length < 2) {
        toast.error("Please enter a food name (min 2 characters)");
        return false;
      }
      if (!store.item_type) {
        toast.error("Please select a food type");
        return false;
      }
    }
    if (store.currentStep === 2) {
      if (!store.platform_category_id) {
        toast.error("Please pick a specific type of food");
        return false;
      }
    }
    if (store.currentStep === 3) {
      if (store.portions.length === 0) {
        toast.error("Add at least one price before continuing");
        return false;
      }
    }
    if (store.currentStep === 4) {
      for (const g of store.choice_groups) {
        if (g.options.length === 0) {
          toast.error(`Group "${g.name}" has no options. Add options or delete the group.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNextWithValidation = () => {
    if (validateStep()) handleNext();
  };

  // Label helper
  const getNextLabel = () => {
    switch (store.currentStep) {
      case 1: return "Choose Category";
      case 2: return "Set Pricing & Sizes";
      case 3: return "Add Custom Choices";
      case 4: return "Review and Finalize";
      case 5: return store.isSubmitting ? "Publishing..." : "Publish Live";
      default: return "Continue";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 dark:md:px-3 dark:rounded-md pb-32 transition-colors">

      <div className="lg:max-w-7xl mx-auto">
        {/* Header Strip */}
        <div className="flex items-center justify-end dark:pt-3 pr-3">
          {/* <BackButton label="" className="py-2" /> */}
          {store.isDirty && (
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-md flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-md animate-pulse" /> Draft Saved
            </div>
          )}
        </div>

        {/* Page Title & Info */}
        <div className="mb-3 md:mb-4 px-4 md:px-20 text-left">
          <div className="flex gap-3 items-center mb-3">
            <BackButton label="" className="h-10 w-10 flex items-center justify-center rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Add New Dish
            </h1>
          </div>
          <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
            Tell us about your next great dish! Add a name, photo, price, and options for your customers to see.
          </p>
        </div>

        {/* Wizard Progress Bar */}
        <div className="mb-10 md:mb-14 px-6 md:px-20 mt-4">
          <div className="flex items-center justify-between relative">
            {/* Background Track */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-slate-200 dark:bg-slate-800 rounded-full z-0" />

            {/* Progress Fill */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-orange-600 rounded-full z-0 transition-all duration-500"
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
                  <div className={`w-7 h-7 md:w-9 md:h-9 rounded-md flex items-center justify-center font-black text-[10px] md:text-sm transition-all duration-500 border-2 ${isPast ? "bg-orange-600 border-orange-600 text-white" :
                    isCurrent ? "bg-white dark:bg-slate-900 border-orange-600 text-orange-600 dark:text-orange-500" :
                      "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500"
                    }`}>
                    {isPast ? "✓" : step.id}
                  </div>
                  <span className={`absolute -bottom-6 text-[8px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${isCurrent ? "text-orange-600 dark:text-orange-500 opacity-100" : isPast ? "text-slate-600 dark:text-slate-300 opacity-0 md:opacity-100" : "text-slate-400 dark:text-slate-600 opacity-0"} ${isCurrent ? "block" : "hidden md:block"} `}>
                    {isCurrent ? step.title : step.short}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-3 min-h-[500px] transition-colors relative overflow-hidden">
          {store.currentStep === 1 && <Step1BasicInfo onNext={handleNext} />}
          {store.currentStep === 2 && <Step2Categories onNext={handleNext} onBack={handleBack} />}
          {store.currentStep === 3 && <Step3Portions onNext={handleNext} onBack={handleBack} />}
          {store.currentStep === 4 && <Step4AddOns onNext={handleNext} onBack={handleBack} />}
          {store.currentStep === 5 && (
            <Step5Review 
              onBack={handleBack} 
              onSetStep={(s) => store.setStep(s)} 
              onComplete={() => {
                store.resetForm();
                if (typeof window !== "undefined") {
                  sessionStorage.removeItem("gd_create_food_wizard");
                }
                router.push("/vendors/my-foods");
              }} 
            />
          )}
        </div>

      </div>

      {/* FIXED FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 lg:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 transition-all duration-500 animate-in slide-in-from-bottom-full">
         <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1">
               {store.currentStep > 1 && (
                  <button 
                    onClick={handleBack} 
                    disabled={store.isSubmitting}
                    className="h-12 px-6 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-black uppercase tracking-widest gap-2 active:scale-95 text-[10px] disabled:opacity-40 transition-all border border-slate-100 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950"
                  >
                    <ArrowLeft size={16} strokeWidth={3} /> <span className="hidden sm:inline">Back</span>
                  </button>
               )}
            </div>

            <div className="flex-none flex items-center gap-4">
               {/* Step Indicator (All Screens) */}
               <div className="flex flex-col items-end mr-2 md:mr-4">
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Step {store.currentStep} / 5</span>
                  <span className="text-[10px] md:text-xs font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest mt-1">{STEPS[store.currentStep-1].short}</span>
               </div>

               <button 
                  id="wizard-primary-button" 
                  onClick={store.currentStep === 5 ? () => document.getElementById('publish-food-btn')?.click() : handleNextWithValidation} 
                  disabled={store.isSubmitting}
                  className={`h-12 px-6 md:px-8 rounded-md font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all active:scale-95 flex items-center gap-2 md:gap-3 disabled:opacity-50 ${store.currentStep === 5 ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-orange-600 text-white"}`}
               >
                  {store.isSubmitting ? <Loader2 size={14} className="animate-spin" /> : store.currentStep === 5 ? <Rocket size={14} /> : null}
                  <span className="truncate max-w-[100px] md:max-w-none">{getNextLabel()}</span>
                  {store.currentStep < 5 && <ChevronRight size={14} strokeWidth={3} />}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
