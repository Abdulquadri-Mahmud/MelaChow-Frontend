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
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-3">
        <div className="text-center space-y-4">
          <AlertTriangle size={48} className="mx-auto text-rose-500" />
          <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Combo Not Found</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">We couldn't retrieve the combo details you're trying to edit.</p>
          <button onClick={() => router.push('/vendors/my-combos')} className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black uppercase tracking-widest rounded-md">Back to My Combos</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors flex flex-col">
      <div className="lg:max-w-7xl mx-auto w-full flex-1 p-4 lg:p-0 pb-10">
        
        {/* Header Strip — Command Center Style */}
        <div className="mb-8 mt-4 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-4 md:p-6 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group">
          {/* Brand Accent Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[100px] -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50" />
          
          <div className="relative z-10">
            <div className="flex gap-4 items-center mb-3">
                <BackButton label="" className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:text-orange-500 hover:bg-white/10 transition-all border border-white/5" />
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase leading-none">
                    Edit Bundle
                  </h1>
                </div>
            </div>
            <p className="text-[11px] md:text-xs font-bold text-zinc-400 max-w-xl leading-relaxed uppercase tracking-wider opacity-80">
                Updating <span className="text-white underline">{data?.combo?.name}</span>. Changes sync immediately.
            </p>
          </div>

          {store.isDirty && (
            <div className="relative z-10 shrink-0">
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner">
                <div className="relative">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]"></span>
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  Draft Mode
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Progress Bar — Premium Style */}
        <div className="mb-12 px-4 md:px-12 max-w-3xl mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[3px] bg-zinc-200 dark:bg-zinc-800 rounded-full z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-orange-600 to-amber-500 rounded-full z-0 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(249,115,22,0.4)]"
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
                  <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-[10px] md:text-sm transition-all duration-500 border-2 ${
                    isPast ? "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20" :
                    isCurrent ? "bg-white dark:bg-zinc-900 border-orange-600 text-orange-600 dark:text-orange-500 shadow-xl" :
                    "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500"
                  }`}>
                    {isPast ? "✓" : step.id}
                  </div>
                  <span className={`absolute -bottom-8 text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                    isCurrent ? "text-orange-600 dark:text-orange-500 opacity-100 translate-y-0" : 
                    isPast ? "text-zinc-500 dark:text-zinc-400 opacity-0 md:opacity-100" : 
                    "text-zinc-300 dark:text-zinc-600 opacity-0 -translate-y-1"
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
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-zinc-200 dark:border-white/5 p-4 lg:p-6 min-h-[400px] shadow-xl shadow-black/5 relative overflow-hidden transition-all">
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
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">
                  Updated Preview
                </h3>
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 p-4 aspect-video flex flex-col justify-end relative overflow-hidden group">
                  {store.image_url ? (
                    <img src={store.image_url} alt="Preview" className="absolute inset-0 w-full h-full object-cover grayscale-[0.2]" />
                  ) : (
                    <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                      <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">No Image Provided</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
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

      {/* STICKY FOOTER */}
      <div className="sticky bottom-0 z-40 w-full p-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 mt-auto transition-all duration-500">
         <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1">
               {store.currentStep > 1 && (
                  <button 
                    onClick={handleBack} 
                    disabled={store.isSubmitting}
                    className="h-12 px-6 flex items-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-black uppercase tracking-widest gap-2 active:scale-95 text-[10px] transition-all border border-zinc-100 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 shadow-sm"
                  >
                    <ArrowLeft size={16} strokeWidth={3} /> <span className="hidden sm:inline">Back</span>
                  </button>
               )}
            </div>

            <div className="flex-none flex items-center gap-4">
               <div className="hidden sm:flex flex-col items-end mr-4">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] leading-none">Step {store.currentStep} / {STEPS.length}</span>
                  <span className="text-[11px] font-black text-zinc-800 dark:text-zinc-300 uppercase tracking-widest mt-1">{STEPS[store.currentStep-1].title}</span>
               </div>

               <button 
                  onClick={store.currentStep === STEPS.length ? () => document.getElementById('submit-combo-btn')?.click() : handleNextWithValidation} 
                  disabled={store.isSubmitting}
                  className={`h-12 px-8 rounded-md font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 flex items-center gap-3 shadow-md disabled:opacity-50 ${
                    store.currentStep === STEPS.length 
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" 
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

