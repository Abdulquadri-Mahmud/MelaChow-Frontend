"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Trash2, Loader2 } from "lucide-react";

export default function DeleteConfirmModal({
    open,
    onClose,
    onConfirm,
    title = "Delete Item",
    message = "Are you sure you want to delete this item? This action cannot be undone.",
    itemName = "",
    isDeleting = false,
    confirmText = "Delete",
    cancelText = "Cancel"
}) {
    if (!open) return null;

    const handleConfirm = () => {
        onConfirm();
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
                    >
                        {/* Decorative Header Gradient */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-red-500 to-orange-500" />

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
                        >
                            <X size={18} />
                        </button>

                        {/* Content */}
                        <div className="p-8 pt-10">
                            {/* Icon */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                                className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center relative"
                            >
                                <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
                                <AlertTriangle size={32} className="text-rose-600 dark:text-rose-500 relative z-10" />
                            </motion.div>

                            {/* Title */}
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-3">
                                {title}
                            </h2>

                            {/* Item Name (if provided) */}
                            {itemName && (
                                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                        Item to be deleted
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                        {itemName}
                                    </p>
                                </div>
                            )}

                            {/* Message */}
                            <p className="text-slate-600 dark:text-slate-300 text-center leading-relaxed mb-8">
                                {message}
                            </p>

                            {/* Warning Box */}
                            <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                                <AlertTriangle size={20} className="text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-amber-900 dark:text-amber-200 mb-1">
                                        Warning: This action is permanent
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-300">
                                        Once deleted, this item cannot be recovered. All associated data will be permanently removed.
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={isDeleting}
                                    className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isDeleting}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl font-bold shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:from-rose-600 hover:to-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={18} />
                                            <span>{confirmText}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
