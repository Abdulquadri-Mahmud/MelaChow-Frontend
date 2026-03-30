'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCreateComboStore } from '@/app/context/CreateComboStore';
import { useVendorProfile } from '@/app/context/VendorProfileContext';
import Step1BasicInfo from '@/app/components/create-combo/wizard/Step1BasicInfo';
import Step2Categories from '@/app/components/create-combo/wizard/Step2Categories';
import Step3Pricing from '@/app/components/create-combo/wizard/Step3Pricing';
import Step4AddOnsAndReview from '@/app/components/create-combo/wizard/Step4AddOnsAndReview';
import { useEffect } from 'react';

const STEP_TITLES = {
  1: 'Basic Info',
  2: 'Categories',
  3: 'Pricing',
  4: 'Add-Ons & Review',
};

export default function CreateComboPage() {
  const router = useRouter();
  const { currentStep, resetStore } = useCreateComboStore();
  const { vendorProfile } = useVendorProfile();

  useEffect(() => {
    // Reset wizard on mount
    resetStore();
  }, [resetStore]);

  if (!vendorProfile?._id && !vendorProfile?.id) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-3 rounded-md">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 uppercase tracking-widest"
            >
              ← Back
            </button>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Create Combo Bundle
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Build a value bundle with fixed pricing and optional add-ons
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex-1">
              <div
                className={`h-2 rounded-full transition-all ${
                  step <= currentStep
                    ? 'bg-orange-500'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
              <p className="text-[9px] font-black uppercase tracking-widest mt-1 text-slate-600 dark:text-slate-400">
                Step {step}
              </p>
            </div>
          ))}
        </div>

        {/* Current Step Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {STEP_TITLES[currentStep]}
          </h2>
        </div>

        {/* Form Card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6"
        >
          {currentStep === 1 && <Step1BasicInfo />}
          {currentStep === 2 && <Step2Categories />}
          {currentStep === 3 && <Step3Pricing />}
          {currentStep === 4 && <Step4AddOnsAndReview />}
        </motion.div>
      </div>
    </div>
  );
}
