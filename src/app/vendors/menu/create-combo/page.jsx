"use client";

import { useEffect } from "react";
import { useCreateComboStore } from "@/app/context/CreateComboStore";
import ComboStep1Basics from "./components/ComboStep1Basics";
import ComboStep2Components from "./components/ComboStep2Components";
import ComboStep3Swaps from "./components/ComboStep3Swaps";
import { ChevronRight, Home, LayoutGrid, RotateCcw, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const STEPS = [
    { id: 1, label: "Combo Details", icon: <LayoutGrid size={16} /> },
    { id: 2, label: "Add Items", icon: <LayoutGrid size={16} /> },
    { id: 3, label: "Swap Options", icon: <LayoutGrid size={16} /> },
];

export default function CreateComboPage() {
    const store = useCreateComboStore();
    const router = useRouter();

    // Warn before leaving if data is entered
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (store.name || store.components.length > 0) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [store.name, store.components.length]);

    const handleNext = () => store.setStep(store.currentStep + 1);
    const handleBack = () => store.setStep(store.currentStep - 1);

    const renderStep = () => {
        switch (store.currentStep) {
            case 1: return <ComboStep1Basics onNext={handleNext} />;
            case 2: return <ComboStep2Components onNext={handleNext} onBack={handleBack} />;
            case 3: return <ComboStep3Swaps onBack={handleBack} />;
            default: return <ComboStep1Basics onNext={handleNext} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header / Nav */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <button
                            onClick={() => router.push("/vendors/dashboard")}
                            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 transition-all shadow-lg shadow-slate-900/10 dark:shadow-white/10"
                        >
                            <Home size={20} />
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-slate-900 dark:text-white leading-none">Create Combo Deal</h1>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">New Menu Product</p>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (confirm("Discard all changes?")) {
                                store.reset();
                                router.push("/vendors/dashboard");
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                    >
                        <RotateCcw size={14} /> Discard
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="max-w-2xl mx-auto px-4 pb-6 mt-4">
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, idx) => (
                            <div key={step.id} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${store.currentStep === step.id
                                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 scale-110 shadow-lg shadow-slate-900/10 dark:shadow-white/10 ring-4 ring-slate-900/10 dark:ring-white/10"
                                        : store.currentStep > step.id
                                            ? "bg-emerald-500 text-white"
                                            : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600"
                                        }`}>
                                        {store.currentStep > step.id ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                        ) : (
                                            <span className="text-sm font-black">{step.id}</span>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${store.currentStep === step.id ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-600"
                                        }`}>
                                        {step.label}
                                    </span>
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className="flex-1 h-[2px] mx-4 -mt-6 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 transition-all duration-500"
                                            style={{ width: store.currentStep > step.id ? "100%" : "0%" }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Step Content */}
            <main className="max-w-5xl mx-auto px-4 py-12">
                {renderStep()}
            </main>
        </div>
    );
}
