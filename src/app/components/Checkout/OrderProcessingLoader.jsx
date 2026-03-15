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
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
                {/* Spinner */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-orange-200 rounded-full"></div>
                        <div className="w-20 h-20 border-4 border-orange-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <CreditCard className="text-orange-600" size={32} />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                    Processing Your Order
                </h3>
                <p className="text-sm text-gray-500 text-center mb-8">
                    Please wait while we prepare your order
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
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${status === "completed"
                                        ? "bg-green-50 text-green-700"
                                        : status === "loading"
                                            ? "bg-orange-50 text-orange-700"
                                            : "bg-gray-50 text-gray-400"
                                    }`}
                            >
                                <div className={`flex-shrink-0 ${status === "loading" ? "animate-spin" : ""
                                    }`}>
                                    {status === "completed" ? (
                                        <CheckCircle size={20} className="text-green-600" />
                                    ) : status === "loading" ? (
                                        <Loader2 size={20} className="text-orange-600" />
                                    ) : (
                                        <Clock size={20} className="text-gray-400" />
                                    )}
                                </div>

                                <span className="text-sm font-semibold">
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
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                    <p className="text-xs text-orange-700 text-center font-medium">
                        ⚠️ Please don't close this window or press the back button
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
            <Loader2 className="animate-spin text-orange-600" size={20} />
            <span className="text-sm text-gray-600 font-medium">{message}</span>
        </div>
    );
}
