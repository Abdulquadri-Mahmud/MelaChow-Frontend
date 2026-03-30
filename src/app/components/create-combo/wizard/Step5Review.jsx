'use client';

import { useCreateComboStore } from '@/app/context/CreateComboStore';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Rocket, CheckCircle2, AlertCircle, Info, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { createComboItem, updateComboItem } from '@/app/lib/menuApi';

export default function Step5Review() {
  const store = useCreateComboStore();
  const router = useRouter();
  const params = useParams();
  const vendorId = params?.vendorId;

  const handleSubmit = async () => {
    try {
      // Basic Validation
      if (!store.name.trim()) throw new Error('Combo name required');
      if (!store.image_url) throw new Error('Image required');
      if (!store.platform_category_id) throw new Error('Category required');
      if (!store.price_naira || Number(store.price_naira) <= 0) throw new Error('Valid price required');

      store.setSubmitting(true);

      const payload = {
        name: store.name,
        description: store.description,
        image_url: store.image_url,
        price_naira: Number(store.price_naira),
        dietary_type: store.dietary_type || 'mixed',
        prep_time_minutes: store.prep_time_minutes,
        tags: store.tags,
        contents: store.contents,
        platform_category_id: store.platform_category_id,
        vendor_section_id: store.vendor_section_id,
        choice_groups: store.choice_groups.map((group) => ({
          name: group.name,
          is_required: group.is_required,
          min_selections: group.min_selections,
          max_selections: group.max_selections,
          options: group.options.map((opt) => ({
            label: opt.label,
            price_modifier_naira: Number(opt.price_modifier_naira) || 0,
            image_url: opt.image_url || null,
            is_available: opt.is_available,
          })),
        })),
      };

      let comboId;
      if (store._id) {
        // Edit mode
        await updateComboItem(store._id, payload);
        comboId = store._id;
        toast.success('Combo updated successfully');
      } else {
        // Create mode
        const res = await createComboItem(vendorId, payload);
        comboId = res.comboItem._id;
        toast.success('Combo created successfully');
      }

      store.resetStore();
      router.push(`/vendors/my-combos/${comboId}`);
    } catch (err) {
      toast.error(err.message || 'Failed to save combo');
      console.error(err);
    } finally {
      store.setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 pb-12"
    >
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Review Details</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Verify bundle accuracy before publishing</p>
          </div>
          <div className="flex h-8 px-4 bg-green-500/10 text-green-600 rounded-lg items-center gap-2 border border-green-500/10 shrink-0">
              <CheckCircle2 size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Valid</span>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Visual Preview & Basic Info */}
          <div className="lg:col-span-5 space-y-4">
              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm relative group bg-slate-50 dark:bg-slate-900">
                  <img src={store.image_url} alt={store.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="px-2 py-0.5 bg-orange-600 text-white text-[8px] font-black uppercase rounded shadow-sm">{store.dietary_type}</span>
                        {store.prep_time_minutes && (
                            <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-white text-[8px] font-black uppercase rounded">{store.prep_time_minutes}m</span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none truncate">{store.name}</h3>
                  </div>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                      <DataCard label="Category" value={store.platform_category_label} />
                      <DataCard label="Section" value={store.vendor_section_label || 'Default'} />
                  </div>

                  {store.description && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Description</p>
                    <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300 leading-normal line-clamp-3 italic">"{store.description}"</p>
                  </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center justify-between px-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Store Price</span>
                          <span className="text-xl font-black text-orange-600 tabular-nums">₦{Number(store.price_naira).toLocaleString()}</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* RIGHT: Contents & Add-ons */}
          <div className="lg:col-span-7 space-y-4">
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 shadow-sm h-full flex flex-col">
                  
                  <div className="space-y-6 flex-1">
                      <div>
                          <div className="flex items-center justify-between mb-3">
                              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">What's Included</h4>
                              <div className="h-px bg-slate-800 flex-1 ml-4" />
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                              {store.contents?.map(c => (
                                  <span key={c} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-white uppercase tracking-widest shadow-sm">{c}</span>
                              ))}
                              {(!store.contents || store.contents.length === 0) && (
                                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest italic bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">Default Combo Set</span>
                              )}
                          </div>
                      </div>

                      <div>
                          <div className="flex items-center justify-between mb-3">
                              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Configuration</h4>
                              <div className="h-px bg-slate-800 flex-1 ml-4" />
                          </div>
                          <div className="space-y-2">
                              {store.choice_groups.map(group => (
                                  <div key={group.tempId} className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2">
                                      <div className="flex items-center justify-between">
                                          <div className="text-[10px] font-black text-white uppercase tracking-tight">{group.name}</div>
                                          <div className="text-[7px] font-black text-orange-500 uppercase px-1.5 py-0.5 bg-orange-500/10 rounded italic border border-orange-500/10">
                                              {group.min_selections}-{group.max_selections} picks
                                          </div>
                                      </div>
                                      <div className="flex flex-wrap gap-1 opacity-50">
                                          {group.options.map(opt => (
                                              <span key={opt.tempId} className="text-[8px] font-bold text-slate-400 bg-white/10 px-1.5 py-0.5 rounded">
                                                  {opt.label} {opt.price_modifier_naira > 0 ? `(+₦${opt.price_modifier_naira})` : ''}
                                              </span>
                                          ))}
                                      </div>
                                  </div>
                              ))}
                              {store.choice_groups.length === 0 && (
                                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Static bundle (one-click-buy)</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-3 opacity-60">
                            <div className="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-600 flex items-center justify-center shrink-0">
                                <Rocket size={14} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-white uppercase tracking-widest">Sync Priority: High</p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Publishes immediately to menus</p>
                            </div>
                        </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="flex flex-col items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
          <button
            onClick={handleSubmit}
            disabled={store.isSubmitting}
            className="w-full h-14 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl shadow-xl flex items-center justify-center gap-3 group transition-all duration-300 active:scale-95"
          >
            {store.isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-black uppercase tracking-[0.2em] italic">Saving...</span>
              </div>
            ) : (
              <>
                <span className="text-xs font-black uppercase tracking-[0.2em] italic">{store._id ? 'Update Bundle' : 'Publish to Store'}</span>
              </>
            )}
          </button>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Confirming updates your live restaurant menu</p>
      </div>

      {/* HIDDEN SUBMIT BUTTON FOR WIZARD FOOTER TRIGGER */}
      <button id="final-publish-btn" className="hidden" onClick={handleSubmit} disabled={store.isSubmitting} />
    </motion.div>
  );
}

function DataCard({ label, value }) {
    return (
        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{label}</p>
            <p className="text-[9px] font-black text-slate-900 dark:text-white uppercase truncate leading-none">{value || 'N/A'}</p>
        </div>
    );
}
