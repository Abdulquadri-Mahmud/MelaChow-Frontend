"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateFoodStore } from "@/app/context/CreateFoodStore";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Edit2, X } from "lucide-react";
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

export default function CreateFoodWizardPage() {
  const store = useCreateFoodStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for existing dirty draft not on step 1
    if (store.isDirty && store.currentStep > 1) {
      setShowDraftPrompt(true);
    }

    const handleBeforeUnload = (e) => {
      if (store.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [store.isDirty, store.currentStep]);

  const handleClearDraft = () => {
    store.resetForm();
    setShowDraftPrompt(false);
  };

  if (!mounted) return null; // Avoid hydration mismatch

  // Navigation blocks
  const handleNext = () => store.setStep(Math.min(5, store.currentStep + 1));
  const handleBack = () => store.setStep(Math.max(1, store.currentStep - 1));
  const handleJump = (stepId) => {
    // Only allow jumping backward, or jumping to the very next step if current is valid
    if (stepId < store.currentStep) store.setStep(stepId);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">

      {/* Draft Continuation Prompt overlay */}
      <AnimatePresence>
        {showDraftPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative"
            >
              <h3 className="text-xl font-black text-slate-900 mb-2">Continue drafting?</h3>
              <p className="text-slate-500 text-sm mb-6">You have an unsaved food item "{store.name || "Untitled"}". Do you want to continue where you left off?</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowDraftPrompt(false)}
                  className="w-full h-12 bg-orange-500 text-white font-bold rounded-xl active:scale-95 transition-all shadow-md shadow-orange-500/20"
                >
                  Yes, Continue
                </button>
                <button
                  onClick={handleClearDraft}
                  className="w-full h-12 bg-slate-100 text-slate-600 font-bold rounded-xl active:scale-95 transition-all hover:bg-slate-200"
                >
                  Start Fresh
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto pt-6 px-4 md:px-8">
        {/* Header Strip */}
        <div className="flex items-center justify-between mb-8">
          <BackButton label="Back to Menu" className="py-2" />
          {store.isDirty && (
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" /> Draft Saved
            </div>
          )}
        </div>

        {/* Wizard Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            {/* Background Track */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0" />

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
          {store.currentStep === 5 && <Step5Review onBack={handleBack} onSetStep={(s) => store.setStep(s)} onComplete={() => { }} />}
        </div>

      </div>
    </div>
  );
}
