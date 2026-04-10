"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight, Rocket, Loader2, Info } from "lucide-react";
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
    return true;
  };

  const handleNextWithValidation = () => {
    if (validateStep()) handleNext();
  };

  const getNextLabel = () => {
    switch (store.currentStep) {
      case 1: return "Assign Categories";
      case 2: return "Set Pricing & Sizes";
      case 3: return "Add Custom Choices";
      case 4: return "Final Review";
      case 5: return store.isSubmitting ? "Publishing..." : "Publish Live";
      default: return "Continue";
    }
  };

  const isLastStep = store.currentStep === STEPS.length;
  
  // Get primary price for preview
  const defaultPortion = store.portions.find(p => p.is_default) || store.portions[0];
  const previewPrice = defaultPortion?.price_naira || 0;

  return (
    <div className="min-h-screen dark:p-3 p-0 bg-slate-50 dark:bg-slate-950 pb-32 transition-colors">
      <div className="lg:max-w-6xl mx-auto">
        
        {/* Header Strip */}
        <div className="mb-6 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex gap-3 items-center mb-2">
                <BackButton label="" className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-orange-600 transition-colors" />
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                {store._id ? 'Edit Dish' : 'Add New Dish'}
                </h1>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                Tell us about your next great dish! Add a name, photo, price, and options.
            </p>
          </div>

          {store.isDirty && (
            <div className="shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> 
              Draft Saved
            </div>
          )}
        </div>

        {/* Wizard Progress Bar */}
        <div className="mb-10 px-4 md:px-12 max-w-3xl mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-slate-200 dark:bg-slate-800 rounded-full z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-orange-600 rounded-full z-0 transition-all duration-700 ease-out"
              style={{ width: `${((store.currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
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
                  <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center font-black text-[10px] md:text-sm transition-all duration-500 border ${
                    isPast ? "bg-orange-600 border-orange-600 text-white" :
                    isCurrent ? "bg-white dark:bg-slate-900 border-orange-600 text-orange-600 dark:text-orange-500" :
                    "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500"
                  }`}>
                    {isPast ? "✓" : step.id}
                  </div>
                  <span className={`absolute -bottom-6 text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                    isCurrent ? "text-orange-600 dark:text-orange-500 opacity-100 translate-y-0" : 
                    isPast ? "text-slate-600 dark:text-slate-300 opacity-0 md:opacity-100" : 
                    "text-slate-400 dark:text-slate-600 opacity-0 -translate-y-1"
                  }`}>
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className={`transition-all duration-500 ${isLastStep ? 'max-w-4xl mx-auto' : 'grid grid-cols-1 lg:grid-cols-12 gap-6'}`}>
          
          {/* Main Form Content */}
          <div className={`${isLastStep ? 'col-span-full' : 'lg:col-span-8'} space-y-4`}>
            <div className={`bg-white dark:bg-slate-900 ${isLastStep ? 'rounded-2xl p-3 lg:p-5' : 'rounded-2xl p-4 lg:p-5'} border border-slate-100 dark:border-slate-800 min-h-[450px] relative overflow-hidden transition-colors`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={store.currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full"
                >
                  {store.currentStep === 1 && <Step1BasicInfo onNext={handleNext} />}
                  {store.currentStep === 2 && <Step2Categories />}
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
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Live Preview / Tips (Hidden on Review Step) */}
          {!isLastStep && (
            <div className="lg:col-span-4 space-y-4">
                <div className="sticky top-6 space-y-4">
                
                {/* Contextual Tips */}
                <div className="bg-orange-500/5 dark:bg-orange-950/10 border border-orange-500/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
                          <Info size={16} />
                      </div>
                      <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                        Pro Tip
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                          Clear names and great photos perform 40% better than generic ones.
                      </p>
                    </div>
                </div>

                {/* Live Preview Card Mockup */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      Live Preview
                    </h3>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3 aspect-video flex flex-col justify-end relative overflow-hidden ring-1 ring-slate-100">
                    {store.image_url ? (
                        <img src={store.image_url} alt="Preview" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000" />
                    ) : (
                        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800 flex items-center justify-center uppercase tracking-widest text-[9px] font-black text-slate-300">
                          Waiting...
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                    <div className="relative z-10">
                        <h4 className="text-lg font-black text-white uppercase truncate tracking-tight">
                        {store.name || "UNNAMED DISH"}
                        </h4>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xl font-black text-orange-500 tabular-nums">
                              ₦{Number(previewPrice || 0).toLocaleString()}
                          </span>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </div>
          )}

        </div>
      </div>

      {/* FIXED FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] p-3 lg:p-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800">
         <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1">
               {store.currentStep > 1 && (
                  <button 
                    onClick={handleBack} 
                    disabled={store.isSubmitting}
                    className="h-11 px-6 flex items-center text-slate-600 dark:text-slate-300 hover:text-orange-600 font-black uppercase tracking-widest gap-2 active:scale-95 text-[10px] transition-all border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
                  >
                    <ArrowLeft size={14} strokeWidth={3} /> 
                    <span className="hidden sm:inline">Back</span>
                  </button>
               )}
            </div>

            <div className="flex-none flex items-center gap-4">
               <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Step {store.currentStep} of {STEPS.length}</span>
                  <span className="text-[11px] font-black text-slate-950 dark:text-white uppercase tracking-widest italic">{STEPS[store.currentStep-1].title}</span>
               </div>

               <button 
                  onClick={store.currentStep === STEPS.length ? () => document.getElementById('publish-food-btn')?.click() : handleNextWithValidation} 
                  disabled={store.isSubmitting}
                  className={`h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50 shadow-lg ${
                    store.currentStep === STEPS.length 
                    ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950" 
                    : "bg-orange-600 text-white hover:bg-orange-700"
                  }`}
               >
                  {store.isSubmitting ? <Loader2 size={16} className="animate-spin" /> : store.currentStep === STEPS.length ? <Rocket size={16} /> : null}
                  <span>{getNextLabel()}</span>
                  {store.currentStep < STEPS.length && <ChevronRight size={16} strokeWidth={3} />}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
