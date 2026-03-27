"use client";

import { useState } from "react";
import { Edit2, Trash2, ChevronRight, ImageIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function CategoryTable({ categories, onEdit, onDelete, onToggleActive, currentPage, setCurrentPage }) {
    // const [currentPage, setCurrentPage] = useState(1); // Lifted to parent
    const itemsPerPage = 10;

    const [togglingIds, setTogglingIds] = useState(new Set());

    const handleToggle = async (category) => {
        if (togglingIds.has(category._id)) return;
        setTogglingIds(prev => new Set(prev).add(category._id));
        try {
            await onToggleActive(category._id, !category.isActive);
        } finally {
            setTogglingIds(prev => {
                const next = new Set(prev);
                next.delete(category._id);
                return next;
            });
        }
    };

    // Reset page when categories change (e.g. search filter)
    // You might want to do this in a useEffect or useMemo if props change frequently
    // For now, let's keep it simple.

    const totalPages = Math.ceil(categories.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const displayedCategories = categories.slice(startIndex, startIndex + itemsPerPage);

    const handlePrevious = () => {
        if (currentPage > 1) setCurrentPage(curr => curr - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(curr => curr + 1);
    };

    if (!categories || categories.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                    <ImageIcon className="text-slate-400" size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Categories Found</h3>
                <p className="text-sm text-slate-500 mt-1">Get started by creating your first category.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Parent</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {displayedCategories.map((category) => (
                            <tr key={category._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                                            {category.image ? (
                                                <img
                                                    src={category.image}
                                                    alt={category.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <ImageIcon size={18} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-slate-900">{category.name}</h4>
                                            {category.description && (
                                                <p className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">
                                                    {category.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    {category.parent ? (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md w-fit">
                                            <span className="font-medium">{category.parent.name}</span>
                                            <ChevronRight size={12} className="text-slate-400" />
                                            <span className="font-semibold">{category.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">Root</span>
                                    )}
                                </td>
                                <td className="py-3 px-4">
                                    <button
                                        onClick={() => handleToggle(category)}
                                        disabled={togglingIds.has(category._id)}
                                        title={category.isActive ? "Click to deactivate" : "Click to activate"}
                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer disabled:cursor-wait ${
                                            category.isActive
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                                        }`}
                                    >
                                        {togglingIds.has(category._id) ? (
                                            <Loader2 size={10} className="animate-spin" />
                                        ) : (
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                category.isActive ? "bg-emerald-500" : "bg-slate-400"
                                            }`} />
                                        )}
                                        {category.isActive ? "Active" : "Inactive"}
                                    </button>
                                </td>
                                <td className="py-3 px-4">
                                    <span className="text-sm text-slate-500 font-medium">
                                        {new Date(category.createdAt).toLocaleDateString(undefined, {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => onEdit(category)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                            title="Edit Category"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(category)}
                                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                            title="Delete Category"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
                    <span className="text-xs text-slate-500 font-medium">
                        Page <span className="font-semibold text-slate-900">{currentPage}</span> of <span className="font-semibold text-slate-900">{totalPages}</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
