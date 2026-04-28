'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useComboById } from '@/app/hooks/useComboById';
import { useQueryClient } from '@tanstack/react-query';
import { toggleComboAvailability, archiveComboItem } from '@/app/lib/menuApi';
import { useCreateComboStore } from '@/app/context/CreateComboStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Tag, Archive, ArchiveRestore, ToggleLeft, ToggleRight, 
  ArrowLeft, ChevronRight, Rocket, Loader2, Info, AlertTriangle, 
  Settings2, Edit2, LayoutGrid, CheckCircle2, ChevronDown, Plus, X 
} from 'lucide-react';
import toast from 'react-hot-toast';

// Step Components
import Step1BasicInfo from '@/app/components/create-combo/wizard/Step1BasicInfo';
import Step2Categories from '@/app/components/create-combo/wizard/Step2Categories';
import Step3Pricing from '@/app/components/create-combo/wizard/Step3Pricing';
import Step4AddOnsAndReview from '@/app/components/create-combo/wizard/Step4AddOnsAndReview';
import Step5Review from '@/app/components/create-combo/wizard/Step5Review';

const STEPS = [
  { id: 1, title: 'Basic Info', short: 'Basics' },
  { id: 2, title: 'Categories', short: 'Category' },
  { id: 3, title: 'Pricing', short: 'Price' },
  { id: 4, title: 'Add-Ons', short: 'Options' },
  { id: 5, title: 'Publish', short: 'Summary' },
];

const DIETARY_BADGE = {
  halal: {
    label: 'Halal',
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
  },
  veg: {
    label: 'Veg',
    color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10',
  },
  vegan: {
    label: 'Vegan',
    color: 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-500/10',
  },
  kosher: {
    label: 'Kosher',
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10',
  },
  'non-veg': {
    label: 'Non-Veg',
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10',
  },
  mixed: null,
};

export default function ComboDetailPage() {
  const router = useRouter();
  const params = useParams();
  const comboId = params?.id;
  const queryClient = useQueryClient();
  const store = useCreateComboStore();

  const { data, isLoading, isError } = useComboById(comboId);
  const combo = data?.combo;

  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dietary = combo ? DIETARY_BADGE[combo.dietary_type] : null;

  const handleToggleAvailability = async () => {
    if (!combo) return;
    try {
      await toggleComboAvailability(comboId, !combo.is_available);
      queryClient.invalidateQueries(['combo', comboId]);
      toast.success('Availability updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    }
  };

  const handleArchive = async () => {
    if (!combo) return;
    try {
      await archiveComboItem(comboId, !combo.is_archived);
      queryClient.invalidateQueries(['combo', comboId]);
      toast.success(combo.is_archived ? 'Combo restored' : 'Combo archived');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    }
  };

  const startEditing = () => {
    if (!combo) return;
    store.initFromCombo(combo);
    setIsEditing(true);
  };

  const stopEditing = () => {
    setIsEditing(false);
    store.resetStore();
  };

  // Wizard Handlers
  const handleNext = () => store.nextStep();
  const handleBack = () => store.prevStep();
  const handleJump = (stepId) => {
    if (stepId < store.currentStep) store.goToStep(stepId);
  };

  const validateStep = () => {
    if (store.currentStep === 1) {
      if (!store.name.trim()) { toast.error('Name required'); return false; }
      if (!store.image_url) { toast.error('Image required'); return false; }
    }
    if (store.currentStep === 2) {
      if (!store.platform_category_id) { toast.error('Category required'); return false; }
    }
    if (store.currentStep === 3) {
      if (!store.price_naira || Number(store.price_naira) <= 0) {
          toast.error('Valid price required');
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
      case 1: return 'Next: Categories';
      case 2: return 'Next: Pricing';
      case 3: return 'Next: Config';
      case 4: return 'Next: Review';
      case 5: return store.isSubmitting ? 'Saving...' : 'Finish & Save';
      default: return 'Continue';
    }
  };

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (isError || !combo) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-3">
        <div className="text-center space-y-4">
          <AlertTriangle size={48} className="mx-auto text-rose-500" />
          <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Combo Not Found</h2>
          <button onClick={() => router.push('/vendors/my-combos')} className="px-6 h-10 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-widest rounded-lg">Back to List</button>
        </div>
      </div>
    );
  }

  // --- RENDERING WIZARD VIEW ---
  if (isEditing) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors flex flex-col">
        <div className="lg:max-w-6xl mx-auto w-full flex-1 p-4 lg:p-0">
          
          {/* Header Area */}
          <div className="mb-6 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-4">
            <div>
              <div className="flex gap-3 items-center mb-2">
                  <button 
                    onClick={stopEditing}
                    className="h-9 w-9 flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-orange-600 transition-all"
                  >
                    <ArrowLeft size={16} strokeWidth={3} />
                  </button>
                  <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">
                    Edit Bundle
                  </h1>
              </div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 max-w-2xl">
                  Updating <span className="font-bold underline">{combo.name}</span>. Changes sync instantly.
              </p>
            </div>

            {store.isDirty && (
              <div className="shrink-0 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> 
                Draft Ready
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-10 px-4 md:px-12 max-w-3xl mx-auto">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-zinc-200 dark:bg-zinc-800 rounded-full z-0" />
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
                      isCurrent ? "bg-white dark:bg-zinc-900 border-orange-600 text-orange-600 dark:text-orange-500" :
                      "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500"
                    }`}>
                      {isPast ? "✓" : step.id}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Step Content */}
            <div className={`${store.currentStep === 5 ? 'lg:col-span-12' : 'lg:col-span-8'} bg-white dark:bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-zinc-100 dark:border-white/5 p-4 lg:p-6 min-h-[500px] shadow-xl shadow-black/5`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={store.currentStep}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {store.currentStep === 1 && <Step1BasicInfo />}
                  {store.currentStep === 2 && <Step2Categories />}
                  {store.currentStep === 3 && <Step3Pricing />}
                  {store.currentStep === 4 && <Step4AddOnsAndReview />}
                  {store.currentStep === 5 && <Step5Review />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sidebar Preview */}
            {store.currentStep < 5 && (
              <div className="lg:col-span-4 space-y-6 sticky top-6">
                 {/* Live Preview Card */}
                 <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4">
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <LayoutGrid size={12} /> Sync Preview
                    </h3>
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                      {store.image_url ? (
                        <img src={store.image_url} alt="" className="w-full h-full object-cover grayscale-[0.1]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-300 uppercase text-[9px] font-black">Missing Asset</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h4 className="text-white font-black text-sm uppercase truncate leading-none">{store.name || 'UPDATING...'}</h4>
                        <p className="text-[10px] font-black text-orange-500 mt-1 tabular-nums">₦{Number(store.price_naira).toLocaleString()}</p>
                      </div>
                    </div>
                 </div>

                 <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-500/10 rounded-2xl">
                    <div className="flex gap-3">
                      <Info size={16} className="text-orange-500 shrink-0" />
                      <div>
                        <h4 className="text-[10px] font-black text-orange-900 dark:text-orange-400 uppercase tracking-widest mb-1">Live Sync</h4>
                        <p className="text-[9px] font-bold text-orange-800/60 dark:text-orange-400/50 leading-relaxed uppercase tracking-wide">
                          Updates made here are immediate. Customers see changed prices or components the second you save.
                        </p>
                      </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* STICKY FOOTER */}
        <div className="sticky bottom-0 z-40 w-full p-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 mt-auto">
          <div className="max-w-4xl mx-auto flex items-center justify-between px-6 gap-4">
            <div className="flex-1">
              {store.currentStep > 1 && (
                <button 
                  onClick={handleBack} 
                  className="h-12 px-6 flex items-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white font-black uppercase tracking-widest gap-2 active:scale-95 text-[10px] transition-all border border-zinc-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950"
                >
                  <ArrowLeft size={16} /> Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-6">
               <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em] leading-none">Step {store.currentStep} of 5</span>
                  <span className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-widest mt-1">{STEPS[store.currentStep-1].short}</span>
               </div>
               
               <button 
                onClick={store.currentStep === 5 ? () => document.getElementById('final-publish-btn')?.click() : handleNextWithValidation}
                disabled={store.isSubmitting}
                className={`h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 flex items-center gap-3 ${
                  store.currentStep === 5 
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-black' 
                  : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {store.isSubmitting ? <Loader2 size={16} className="animate-spin" /> : store.currentStep === 5 ? <Rocket size={16} /> : null}
                <span>{getNextLabel()}</span>
                {store.currentStep < 5 && <ChevronRight size={16} strokeWidth={3} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING DETAIL VIEW ---
  const priceDisplay = combo.price_naira
    ? `₦${combo.price_naira.toLocaleString()}`
    : 'No price';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-3 rounded-md transition-colors">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-orange-600 transition-all border border-zinc-100 dark:border-zinc-800"
            >
              <ArrowLeft size={18} strokeWidth={3} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                {combo.name}
              </h1>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                Manage your combo bundle
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 items-center">
            <button
              onClick={startEditing}
              className="h-10 px-6 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center gap-2"
            >
              <Edit2 size={14} strokeWidth={3} />
              Edit Bundle
            </button>
            
            <div className="w-[1px] h-6 bg-zinc-200 dark:bg-zinc-800 mx-1" />

            <button
              onClick={handleToggleAvailability}
              className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${
                combo.is_available
                  ? 'border-orange-200/50 bg-orange-50/50 text-orange-600'
                  : 'border-zinc-200 bg-zinc-100 text-zinc-400 font-bold'
              }`}
              title={combo.is_available ? 'Hide combo' : 'Show combo'}
            >
              {combo.is_available ? <ToggleRight size={20} strokeWidth={3} /> : <ToggleLeft size={20} strokeWidth={3} />}
            </button>
            <button
              onClick={handleArchive}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-rose-600 transition-all"
              title={combo.is_archived ? 'Restore combo' : 'Archive combo'}
            >
              {combo.is_archived ? <ArchiveRestore size={20} /> : <Archive size={20} />}
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Display Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* Visual Header */}
            <div className="relative aspect-[16/8] rounded-3xl overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 group">
              {combo.image_url ? (
                <img src={combo.image_url} alt={combo.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">🍱</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-70" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex gap-2 items-center mb-3">
                   {dietary && (
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${dietary.color}`}>
                        {dietary.label}
                      </span>
                   )}
                   {combo.prep_time_minutes && (
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-white">
                        {combo.prep_time_minutes} min prep
                      </span>
                   )}
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-2">{combo.name}</h2>
                <p className="text-white/70 text-sm italic font-medium leading-relaxed">"{combo.description || 'No description provided'}"</p>
              </div>
            </div>

            {/* Choice Groups */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Add-On Sections ({combo.choice_groups?.length || 0})</h3>
                  {!combo.choice_groups?.length && <span className="text-[9px] font-bold text-zinc-400 uppercase italic">This is a static bundle</span>}
                </div>
                <div className="grid gap-4">
                  {combo.choice_groups?.map((group) => (
                    <div key={group._id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
                      <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">{group.name}</h4>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1 italic leading-none">
                            {group.is_required ? 'Mandatory' : 'Optional'} · Pick up to {group.max_selections}
                          </p>
                        </div>
                      </div>
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {group.options.map((opt) => (
                          <div key={opt._id} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-100/50 dark:border-zinc-800/50">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase truncate pr-2">{opt.label}</span>
                            {opt.price_modifier_naira > 0 && (
                              <span className="text-[10px] font-black text-orange-600 tabular-nums shrink-0">+₦{opt.price_modifier_naira}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
            {/* Price Detail Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-3">
               <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-1">Base Bundle Price</p>
               <div className="flex items-baseline gap-2 mb-6 px-1">
                  <span className="text-4xl font-black text-zinc-950 dark:text-white tabular-nums">{priceDisplay}</span>
                  <span className="text-xs font-bold text-zinc-400 uppercase italic">Per Serve</span>
               </div>
               
               <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">What's Inside</p>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {combo.contents?.map(c => (
                        <span key={c} className="px-3 py-1.5 bg-orange-500/5 dark:bg-orange-600/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 text-[10px] font-black uppercase tracking-tight rounded-lg">
                          {c}
                        </span>
                      ))}
                      {!combo.contents?.length && <span className="text-[10px] font-bold text-zinc-300 uppercase italic">Default set</span>}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Search Tags</p>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {combo.tags?.map(t => (
                        <span key={t} className="px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md text-[9px] font-bold uppercase tracking-widest border border-zinc-200 dark:border-zinc-700">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
               </div>
            </div>

            {/* Quick Status Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 text-center">
                 <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Status</p>
                 <p className={`text-[11px] font-black uppercase ${combo.is_available ? 'text-green-600' : 'text-amber-500'}`}>
                    {combo.is_available ? 'Live' : 'Hidden'}
                 </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 text-center">
                 <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Visibility</p>
                 <p className={`text-[11px] font-black uppercase ${combo.is_archived ? 'text-rose-600' : 'text-sky-600'}`}>
                    {combo.is_archived ? 'Archived' : 'Public'}
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
