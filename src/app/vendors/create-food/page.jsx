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
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> Draft Saved
            </div>
          )}
        </div>

        {/* Page Title & Info */}
        <div className="mb-8 md:pl-0 pl-3 text-left">
          <div className="flex gap-2 items-center">
            <BackButton label="" className="py-2 px-3 rounded-md bg-white dark:bg-gray-800" />
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
              Menu Creation Studio
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
            Craft your next best-selling dish! Set up visuals, pricing, and custom add-ons in a few simple steps to launch your food live on the platform.
          </p>
        </div>

        {/* Wizard Progress Bar */}
        <div className="md:mb-14 mb-8 px-20">
          <div className="flex items-center justify-between relative">
            {/* Background Track */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full z-0" />

            {/* Progress Fill */}
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
                    isCurrent ? "bg-white dark:bg-slate-900 border-orange-500 text-orange-600 dark:text-orange-500 shadow-md shadow-orange-500/20" :
                      "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500"
                    }`}>
                    {isPast ? "✓" : step.id}
                  </div>
                  <span className={`absolute -bottom-6 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors hidden sm:block ${isCurrent ? "text-orange-600 dark:text-orange-500" : isPast ? "text-slate-600 dark:text-slate-300" : "text-slate-400 dark:text-slate-600"
                    }`}>
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-sm border border-slate-200 dark:border-slate-800 p-3 min-h-[500px] transition-colors relative overflow-hidden">
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
                    className="h-14 px-8 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-black uppercase tracking-widest gap-2 active:scale-95 text-xs disabled:opacity-40 transition-all border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 shadow-sm"
                  >
                    <ArrowLeft size={16} strokeWidth={3} /> <span className="hidden sm:inline">Back</span>
                  </button>
               )}
            </div>

            <div className="flex-none flex items-center gap-4">
               {/* Step Indicator (Mobile/Tablet) */}
               <div className="hidden md:flex flex-col items-end mr-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Step {store.currentStep} of 5</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-300">{STEPS[store.currentStep-1].title}</span>
               </div>

               <button 
                  id="wizard-primary-button" 
                  onClick={store.currentStep === 5 ? () => document.getElementById('publish-food-btn')?.click() : handleNextWithValidation} 
                  disabled={store.isSubmitting}
                  className={`h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center gap-3 shadow-xl disabled:opacity-50 ${store.currentStep === 5 ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-orange-500 text-white shadow-orange-500/20"}`}
               >
                  {store.isSubmitting ? <Loader2 size={18} className="animate-spin" /> : store.currentStep === 5 ? <Rocket size={18} /> : null}
                  {getNextLabel()}
                  {store.currentStep < 5 && <ChevronRight size={18} strokeWidth={3} />}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
