'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useCreateComboStore } from '@/app/context/CreateComboStore';
import { useComboById } from '@/app/hooks/useComboById';
import { useVendorProfile } from '@/app/context/VendorProfileContext';
import { ArrowLeft, Rocket, ChevronRight, Loader2, Info, AlertTriangle } from 'lucide-react';
import BackButton from '@/app/components/BackButton';
import toast from 'react-hot-toast';

// Step Components
import Step1BasicInfo from '@/app/components/create-combo/wizard/Step1BasicInfo';
import Step2Categories from '@/app/components/create-combo/wizard/Step2Categories';
import Step3Pricing from '@/app/components/create-combo/wizard/Step3Pricing';
import Step4AddOnsAndReview from '@/app/components/create-combo/wizard/Step4AddOnsAndReview';

const STEPS = [
  { id: 1, title: 'Basic Info', short: 'Basics' },
  { id: 2, title: 'Categories', short: 'Category' },
  { id: 3, title: 'Pricing', short: 'Price' },
  { id: 4, title: 'Add-Ons & Review', short: 'Review' },
];

export default function EditComboPage() {
  const router = useRouter();
  const params = useParams();
  const comboId = params?.id;
  
  const store = useCreateComboStore();
  const { vendorProfile } = useVendorProfile();
  const { data, isLoading, isError } = useComboById(comboId);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (data?.combo && !isLoading) {
      store.initFromCombo(data.combo);
    }
  }, [data?.combo, isLoading]);

  if (!mounted) return null;

  const handleNext = () => store.nextStep();
  const handleBack = () => store.prevStep();
  const handleJump = (stepId) => {
    if (stepId < store.currentStep) store.goToStep(stepId);
  };

  const validateStep = () => {
    if (store.currentStep === 1) {
      if (!store.name.trim()) {
        toast.error('Please enter a combo name');
        return false;
      }
      if (!store.price_naira) {
        toast.error('Please enter a base price');
        return false;
      }
    }
    if (store.currentStep === 2) {
      if (!store.platform_category_id) {
        toast.error('Please select a category');
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
      case 1: return 'Edit Categories';
      case 2: return 'Adjust Pricing';
      case 3: return 'Review Updates';
      case 4: return store.isSubmitting ? 'Updating...' : 'Update Combo';
      default: return 'Continue';
    }
  };

  if (isLoading || !vendorProfile?._id && !vendorProfile?.id) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-3">
        <div className="text-center space-y-4">
          <AlertTriangle size={48} className="mx-auto text-rose-500" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Combo Not Found</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">We couldn't retrieve the combo details you're trying to edit.</p>
          <button onClick={() => router.push('/vendors/my-combos')} className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest rounded-md">Back to My Combos</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-32 transition-colors">
      <div className="lg:max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Header Strip */}
        <div className="flex items-center justify-end pt-4 pr-3">
          {store.isDirty && (
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-md flex items-center gap-2 shadow-sm">
              <span className="w-1.5 h-1.5 bg-sky-500 rounded-md animate-pulse" /> Changes in Draft
            </div>
          )}
        </div>

        {/* Page Title */}
        <div className="mb-8 mt-4">
          <div className="flex gap-4 items-center mb-4">
            <BackButton label="" className="h-10 w-10 flex items-center justify-center rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm" />
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Edit Combo
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Updating details for <span className="text-slate-900 dark:text-white font-bold underline">{data?.combo?.name}</span>. Changes will be live immediately after saving.
          </p>
        </div>

        {/* Wizard Progress Bar */}
        <div className="mb-12 px-2 md:px-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-slate-200 dark:bg-slate-800 rounded-full z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-orange-600 rounded-full z-0 transition-all duration-500"
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
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-md flex items-center justify-center font-black text-xs md:text-sm transition-all duration-500 border-2 ${
                    isPast ? "bg-orange-600 border-orange-600 text-white" :
                    isCurrent ? "bg-white dark:bg-slate-900 border-orange-600 text-orange-600 dark:text-orange-500 shadow-md" :
                    "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500"
                  }`}>
                    {isPast ? "✓" : step.id}
                  </div>
                  <span className={`absolute -bottom-7 text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${
                    isCurrent ? "text-orange-600 dark:text-orange-500 opacity-100" : 
                    isPast ? "text-slate-600 dark:text-slate-300 opacity-0 md:opacity-100" : 
                    "text-slate-400 dark:text-slate-600 opacity-0"
                  }`}>
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-COLUMN GRID ON DESKTOP */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Form Content */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 min-h-[400px] shadow-sm relative overflow-hidden transition-colors">
              <AnimatePresence mode="wait">
                <motion.div
                  key={store.currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {store.currentStep === 1 && <Step1BasicInfo />}
                  {store.currentStep === 2 && <Step2Categories />}
                  {store.currentStep === 3 && <Step3Pricing />}
                  {store.currentStep === 4 && <Step4AddOnsAndReview />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Live Preview / Tips */}
          <div className="hidden lg:block space-y-6">
            <div className="sticky top-6 space-y-6">
              
              {/* Contextual Tips */}
              <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-xl p-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-md bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                    <Info size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-orange-900 dark:text-orange-400 uppercase tracking-widest">
                      Editing Tips
                    </h3>
                    <p className="text-xs text-orange-800/70 dark:text-orange-400/60 font-medium">
                      Keep your combo fresh
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-orange-900/80 dark:text-orange-300 font-medium leading-relaxed">
                    Changing the price? Make sure to update the description if you've added or removed high-value items from the bundle.
                  </p>
                  <p className="text-xs text-orange-900/80 dark:text-orange-300 font-medium leading-relaxed">
                    Users love seasonal combos. Try adding "Limited Time" tags to boost interest after an update.
                  </p>
                </div>
              </div>

              {/* Combo Preview Card Mockup */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                  Updated Preview
                </h3>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 aspect-video flex flex-col justify-end relative overflow-hidden group">
                  {store.image_url ? (
                    <img src={store.image_url} alt="Preview" className="absolute inset-0 w-full h-full object-cover grayscale-[0.2]" />
                  ) : (
                    <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">No Image Provided</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  <div className="relative z-10">
                    <h4 className="text-xl font-black text-white uppercase truncate">
                      {store.name || "UNNAMED COMBO"}
                    </h4>
                    <p className="text-[10px] text-white/70 font-medium mt-1 truncate">
                      {store.description || "Updating bundle components..."}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-black text-orange-500">
                        ₦{store.price_naira || "0"}
                      </span>
                      <div className="h-6 px-3 bg-white/20 backdrop-blur-md rounded-md flex items-center text-[8px] font-black text-white uppercase tracking-widest">
                        Draft
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* FIXED FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 transition-all duration-500">
         <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1">
               {store.currentStep > 1 && (
                  <button 
                    onClick={handleBack} 
                    disabled={store.isSubmitting}
                    className="h-12 px-6 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-black uppercase tracking-widest gap-2 active:scale-95 text-[10px] transition-all border border-slate-100 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 shadow-sm"
                  >
                    <ArrowLeft size={16} strokeWidth={3} /> <span className="hidden sm:inline">Back</span>
                  </button>
               )}
            </div>

            <div className="flex-none flex items-center gap-4">
               <div className="hidden sm:flex flex-col items-end mr-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Step {store.currentStep} / {STEPS.length}</span>
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest mt-1">{STEPS[store.currentStep-1].title}</span>
               </div>

               <button 
                  onClick={store.currentStep === STEPS.length ? () => document.getElementById('submit-combo-btn')?.click() : handleNextWithValidation} 
                  disabled={store.isSubmitting}
                  className={`h-12 px-8 rounded-md font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 flex items-center gap-3 shadow-md disabled:opacity-50 ${
                    store.currentStep === STEPS.length 
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" 
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

