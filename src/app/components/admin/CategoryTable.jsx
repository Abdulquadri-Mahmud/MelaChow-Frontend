"use client";

import { useState } from "react";
import { Edit2, Trash2, ChevronRight, ImageIcon, Loader2, Eye } from "lucide-react";

const Th = ({ children, right, center }) => (
    <th className={`px-4 py-3 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.15em] bg-slate-50 border-b border-slate-100 ${right ? "text-right" : ""} ${center ? "text-center" : ""}`}>
        {children}
    </th>
);

export default function CategoryTable({ categories, onEdit, onDelete, onToggleActive, currentPage, setCurrentPage }) {
    const itemsPerPage = 8;
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
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100" />
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <ImageIcon className="text-slate-300" size={24} />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">No Categories Records</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium italic">Initialize your platform menu by adding a first category.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="h-0.5 bg-gradient-to-r from-orange-500 to-amber-400 w-full" />
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr>
                            <Th>Classification</Th>
                            <Th>Hierarchy</Th>
                            <Th center>Visibility</Th>
                            <Th center>Registry Date</Th>
                            <Th right>Actions</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {displayedCategories.map((category) => (
                            <tr key={category._id} className="hover:bg-orange-50/40 transition-all group">
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200 group-hover:border-orange-300 transition-colors shadow-sm relative">
                                            {category.image ? (
                                                <img
                                                    src={category.image}
                                                    alt={category.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300 group-hover:text-orange-400 transition-colors">
                                                    <ImageIcon size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-orange-600 transition-colors uppercase tracking-tight leading-none">{category.name}</h4>
                                            {category.description && (
                                                <p className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px] mt-1.5 font-medium leading-tight">
                                                    {category.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    {category.parent ? (
                                        <div className="flex items-center gap-2 text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full w-fit uppercase font-bold tracking-wider group-hover:bg-white transition-colors">
                                            <span className="opacity-60">{category.parent.name}</span>
                                            <ChevronRight size={10} className="text-orange-500" />
                                            <span className="text-slate-900">{category.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-extrabold text-white bg-slate-900 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">Master Root</span>
                                    )}
                                </td>
                                <td className="py-4 px-4 text-center">
                                    <button
                                        onClick={() => handleToggle(category)}
                                        disabled={togglingIds.has(category._id)}
                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-extrabold border uppercase tracking-widest transition-all shadow-sm ${
                                            category.isActive
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                                                : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                                        }`}
                                    >
                                        {togglingIds.has(category._id) ? (
                                            <Loader2 size={12} className="animate-spin text-orange-500" />
                                        ) : (
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                category.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300"
                                            }`} />
                                        )}
                                        {category.isActive ? "Online" : "Paused"}
                                    </button>
                                </td>
                                <td className="py-4 px-4 text-center">
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">
                                        {new Date(category.createdAt).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric"
                                        })}
                                    </span>
                                </td>
                                <td className="py-4 px-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(category)}
                                            className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all border border-transparent hover:border-orange-100"
                                            title="Edit Classification"
                                        >
                                            <Edit2 size={15} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(category)}
                                            className="p-2 text-slate-400 hover:text-black hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
                                            title="Remove Record"
                                        >
                                            <Trash2 size={15} />
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
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 bg-slate-50/50">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                        Index Entry <span className="text-slate-900">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, categories.length)}</span> of <span className="text-slate-900">{categories.length}</span>
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            className="h-9 px-4 bg-white border border-slate-200 rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-slate-600 hover:border-orange-400 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className="h-9 px-4 bg-white border border-slate-200 rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-slate-600 hover:border-orange-400 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
