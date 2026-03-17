"use client";

import { motion } from "framer-motion";
import { CheckCircle, Clock, Loader2, CreditCard } from "lucide-react";

/**
 * Loading state component displayed during order processing
 * 
 * Shows animated progress steps to provide visual feedback during
 * the order creation and payment initialization process.
 * 
 * @param {Object} props
 * @param {string} props.currentStep - Current processing step (validating, checking, calculating, preparing)
 * @returns {JSX.Element}
 */
export default function OrderProcessingLoader({ currentStep = "validating" }) {
    const steps = [
        { id: "validating", label: "Validating items", icon: CheckCircle },
        { id: "checking", label: "Checking availability", icon: CheckCircle },
        { id: "calculating", label: "Calculating total", icon: Loader2 },
        { id: "preparing", label: "Preparing payment", icon: Clock }
    ];

    const getStepStatus = (stepId) => {
        const currentIndex = steps.findIndex(s => s.id === currentStep);
        const stepIndex = steps.findIndex(s => s.id === stepId);

        if (stepIndex < currentIndex) return "completed";
        if (stepIndex === currentIndex) return "loading";
        return "pending";
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-zinc-900 rounded-[40px] p-8 max-w-md w-full shadow-2xl border border-zinc-100 dark:border-zinc-800 relative overflow-hidden"
            >
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -translate-y-12 translate-x-12 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/5 rounded-full translate-y-12 -translate-x-12 blur-2xl pointer-events-none" />

                {/* Spinner */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-zinc-100 dark:border-zinc-800 rounded-full"></div>
                        <div className="w-24 h-24 border-4 border-orange-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <CreditCard className="text-orange-500" size={36} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white text-center mb-2 italic uppercase tracking-tight">
                    Confirming Order
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-10 font-black uppercase tracking-widest opacity-60">
                    Hang tight, magic is happening
                </p>

                {/* Progress Steps */}
                <div className="space-y-4 mb-8">
                    {steps.map((step, index) => {
                        const status = getStepStatus(step.id);
                        const Icon = step.icon;

                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${status === "completed"
                                        ? "bg-green-50/50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30"
                                        : status === "loading"
                                            ? "bg-orange-50/50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-500/30 shadow-sm"
                                            : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 border-zinc-100 dark:border-zinc-800"
                                    }`}
                            >
                                <div className={`flex-shrink-0 ${status === "loading" ? "animate-spin" : ""
                                    }`}>
                                    {status === "completed" ? (
                                        <CheckCircle size={20} className="text-green-500" />
                                    ) : status === "loading" ? (
                                        <Loader2 size={20} className="text-orange-500" />
                                    ) : (
                                        <Clock size={20} className="text-zinc-400" />
                                    )}
                                </div>

                                <span className="text-xs font-black uppercase tracking-widest italic">
                                    {step.label}
                                </span>

                                {status === "completed" && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="ml-auto"
                                    >
                                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Warning Message */}
                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-2xl p-4">
                    <p className="text-[10px] text-orange-700 dark:text-orange-400 text-center font-black uppercase tracking-[0.2em] italic">
                        ⚠️ Do not close or refresh
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

/**
 * Minimal loading spinner for inline use
 * 
 * @param {Object} props
 * @param {string} props.message - Loading message to display
 * @returns {JSX.Element}
 */
export function InlineLoader({ message = "Loading..." }) {
    return (
        <div className="flex items-center justify-center gap-3 py-4">
            <Loader2 className="animate-spin text-orange-600" size={18} />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest italic">{message}</span>
        </div>
    );
}
