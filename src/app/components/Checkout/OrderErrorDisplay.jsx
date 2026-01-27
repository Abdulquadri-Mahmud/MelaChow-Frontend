"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, XCircle, PackageX, Clock, ShoppingCart, RefreshCw, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Display user-friendly error messages for order creation failures
 * 
 * This component provides contextual error messages and recovery actions
 * based on the type of error encountered during order creation.
 * 
 * @param {Object} props
 * @param {string|null} props.error - Error message to display
 * @param {Function} props.onRetry - Callback function for retry action
 * @param {Function} props.onClose - Callback function to close error display
 * @returns {JSX.Element|null} Error display component or null if no error
 */
export default function OrderErrorDisplay({ error, onRetry, onClose }) {
    const router = useRouter();
    if (!error) return null;

    /**
     * Determine error type from message content
     * @param {string} message - Error message
     * @returns {string} Error type identifier
     */
    const getErrorType = (message) => {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes("out of stock")) return "stock";
        if (lowerMessage.includes("not available") || lowerMessage.includes("unavailable")) return "availability";
        if (lowerMessage.includes("delivery fee") || lowerMessage.includes("delivery")) return "delivery";
        if (lowerMessage.includes("invalid choice") || lowerMessage.includes("choice")) return "choice";
        if (lowerMessage.includes("address")) return "address";
        if (lowerMessage.includes("closed") || lowerMessage.includes("opening hours")) return "closed";
        if (lowerMessage.includes("enotfound") || lowerMessage.includes("getaddrinfo") || lowerMessage.includes("network")) return "network";

        return "general";
    };

    const errorType = getErrorType(error);

    /**
     * Get appropriate icon for error type
     */
    const getErrorIcon = () => {
        switch (errorType) {
            case "stock":
                return <PackageX className="w-16 h-16" />;
            case "network":
                return <WifiOff className="w-16 h-16" />;
            case "availability":
            case "closed":
                return <Clock className="w-16 h-16" />;
            case "choice":
                return <ShoppingCart className="w-16 h-16" />;
            default:
                return <XCircle className="w-16 h-16" />;
        }
    };

    /**
     * Get contextual hint message based on error type
     */
    const getErrorHint = () => {
        switch (errorType) {
            case "stock":
                return "Please go to your cart to remove the out-of-stock item or reduce quantity.";
            case "network":
                return "We couldn't connect to the payment provider. Please check your internet connection and try again.";
            case "availability":
                return "This item is currently unavailable. Please try again later or choose a different item.";
            case "closed":
                return "The restaurant is currently closed. Please check opening hours and try again later.";
            case "choice":
                return "Please review your item customizations and ensure all required selections are made.";
            case "address":
                return "Please verify your delivery address and ensure all required fields are filled.";
            case "delivery":
                return "There was an issue calculating delivery fees. Please refresh and try again.";
            default:
                return "Please try again or contact support if the problem persists.";
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto"
            >
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 shadow-xl">
                    {/* Close Button */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors"
                            aria-label="Close error message"
                        >
                            <XCircle size={20} />
                        </button>
                    )}

                    {/* Error Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="text-red-500">
                            {getErrorIcon()}
                        </div>
                    </div>

                    {/* Error Content */}
                    <div className="text-center space-y-3">
                        <h3 className="text-lg font-bold text-red-800">
                            Unable to Process Order
                        </h3>

                        <div className="bg-white rounded-xl p-3 border border-red-200 shadow-sm">
                            {(() => {
                                // Split multiple errors if they exist (separated by ". ")
                                const errors = error.split(". ").filter(e => e.trim());

                                if (errors.length > 1) {
                                    return (
                                        <ul className="text-left text-sm text-red-700 font-medium space-y-2">
                                            {errors.map((err, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <span className="text-red-500 mt-0.5">•</span>
                                                    <span>{err.trim()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    );
                                } else {
                                    return (
                                        <p className="text-sm text-red-700 font-medium">
                                            {error}
                                        </p>
                                    );
                                }
                            })()}
                        </div>

                        <p className="text-xs text-red-600 italic">
                            {getErrorHint()}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex gap-3">
                        {onRetry && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onRetry}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                            >
                                <RefreshCw size={18} />
                                <span>Retry</span>
                            </motion.button>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push("/orders?activeTab=cart")}
                            className="flex-1 px-4 py-3 bg-white text-red-600 border-2 border-red-200 rounded-xl font-semibold hover:bg-red-50 transition-colors"
                        >
                            View Cart
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

/**
 * Compact inline error display for forms
 * 
 * @param {Object} props
 * @param {string} props.message - Error message
 * @returns {JSX.Element|null}
 */
export function InlineError({ message }) {
    if (!message) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-red-600 text-sm mt-2 bg-red-50 px-3 py-2 rounded-lg border border-red-100"
        >
            <AlertCircle size={16} />
            <span>{message}</span>
        </motion.div>
    );
}
