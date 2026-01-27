"use client";

import { useState } from "react";
import { Edit2, Trash2, ChevronRight, ImageIcon } from "lucide-react";
import { format } from "date-fns";

export default function CategoryTable({ categories, onEdit, onDelete, currentPage, setCurrentPage }) {
    // const [currentPage, setCurrentPage] = useState(1); // Lifted to parent
    const itemsPerPage = 10;

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
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="text-gray-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No Categories Found</h3>
                <p className="text-gray-500">Get started by creating your first category.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Parent</th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {displayedCategories.map((category) => (
                            <tr key={category._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                            {category.image ? (
                                                <img
                                                    src={category.image}
                                                    alt={category.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <ImageIcon size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{category.name}</h4>
                                            {category.description && (
                                                <p className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">
                                                    {category.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    {category.parent ? (
                                        <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100/80 px-3 py-1 rounded-full w-fit">
                                            <span className="font-medium text-xs">{category.parent.name}</span>
                                            <ChevronRight size={14} className="text-gray-400" />
                                            <span className="font-bold text-xs">{category.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">Root</span>
                                    )}
                                </td>
                                <td className="py-4 px-6">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${category.isActive
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600"
                                        }`}>
                                        {category.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="py-4 px-6">
                                    <span className="text-sm text-gray-500 font-medium">
                                        {new Date(category.createdAt).toLocaleDateString(undefined, {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </span>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(category)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Category"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(category)}
                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Delete Category"
                                        >
                                            <Trash2 size={18} />
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
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <span className="text-sm text-gray-500 font-medium">
                        Page <span className="font-bold text-gray-900">{currentPage}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
