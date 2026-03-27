"use client";

import { useState, useEffect, useMemo } from "react";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import CategoryTable from "@/app/components/admin/CategoryTable";
import CategoryModal from "@/app/components/admin/CategoryModal";
import adminAPI from "@/app/lib/adminApi";
import { Plus, Search, Filter, RefreshCw, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import DeleteConfirmationModal from "@/app/components/admin/DeleteConfirmationModal";

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    // Fetch categories function
    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const data = await adminAPI.getAllCategories();
            setCategories(data.data || []);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            toast.error("Failed to load categories");
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchCategories();
    }, []);

    const [currentPage, setCurrentPage] = useState(1);

    // Filter categories based on search and status
    const filteredCategories = useMemo(() => {
        return categories.filter(category => {
            // Search filter
            const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase());

            // Status filter
            const matchesStatus =
                filterStatus === 'all' ? true :
                    filterStatus === 'active' ? category.isActive :
                        !category.isActive;

            return matchesSearch && matchesStatus;
        });
    }, [categories, searchQuery, filterStatus]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus]);

    // Open modal for create
    const handleCreate = () => {
        setSelectedCategory(null);
        setModalOpen(true);
    };

    // Open modal for edit
    const handleEdit = (category) => {
        setSelectedCategory(category);
        setModalOpen(true);
    };

    // Handle create/update submission
    const handleSubmit = async (payload) => {
        try {
            if (selectedCategory) {
                // Update
                await adminAPI.updateCategory(selectedCategory._id, payload);
                toast.success("Category updated successfully");
            } else {
                // Create
                await adminAPI.createCategory(payload);
                toast.success("Category created successfully");
            }

            fetchCategories(); // Refresh list
        } catch (error) {
            console.error("Operation failed:", error);
            throw error; // Re-throw to be handled by modal
        }
    };

    // Inline Toggle Active Status
    const handleToggleActive = async (categoryId, newStatus) => {
        // Optimistic update
        setCategories(prev =>
            prev.map(c => c._id === categoryId ? { ...c, isActive: newStatus } : c)
        );
        try {
            await adminAPI.updateCategory(categoryId, { isActive: newStatus });
            toast.success(newStatus ? "Category activated" : "Category deactivated");
        } catch (error) {
            // Revert on failure
            setCategories(prev =>
                prev.map(c => c._id === categoryId ? { ...c, isActive: !newStatus } : c)
            );
            toast.error(error.message || "Failed to update status");
        }
    };

    // Initiate Delete
    const handleDeleteClick = (category) => {
        setCategoryToDelete(category);
        setDeleteModalOpen(true);
    };

    // Confirm Delete
    const confirmDelete = async () => {
        if (!categoryToDelete) return;

        try {
            await adminAPI.deleteCategory(categoryToDelete._id);
            toast.success("Category deleted successfully");
            fetchCategories();
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error(error.message || "Failed to delete category");
        }
    };

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-6">
                    {/* Header Actions */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
                            <p className="text-sm text-slate-500 mt-1">Manage food categories for the platform</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchCategories}
                                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                title="Refresh"
                            >
                                <RefreshCw size={18} />
                            </button>
                            <button
                                onClick={handleCreate}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                            >
                                <Plus size={16} />
                                <span>Add Category</span>
                            </button>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                        {/* Search */}
                        <div className="relative w-full md:w-80 flex items-center">
                            <Search className="absolute left-3 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 h-9 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 transition-colors placeholder:text-slate-400"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <Filter size={16} className="text-slate-400" />
                            <div className="flex bg-slate-100 p-1 rounded-md">
                                {['all', 'active', 'inactive'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-3 py-1 rounded text-xs font-medium capitalize transition-all ${filterStatus === status
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 size={32} className="text-slate-400 animate-spin mb-3" />
                                <p className="text-slate-500 text-sm font-medium">Loading categories...</p>
                            </div>
                        ) : (
                            <CategoryTable
                                categories={filteredCategories}
                                onEdit={handleEdit}
                                onDelete={handleDeleteClick}
                                onToggleActive={handleToggleActive}
                                currentPage={currentPage}
                                setCurrentPage={setCurrentPage}
                            />
                        )}
                    </motion.div>

                    {/* Category Modal */}
                    <CategoryModal
                        isOpen={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onSubmit={handleSubmit}
                        category={selectedCategory}
                        allCategories={categories}
                    />

                    {/* Delete Confirmation Modal */}
                    <DeleteConfirmationModal
                        isOpen={deleteModalOpen}
                        onClose={() => setDeleteModalOpen(false)}
                        onConfirm={confirmDelete}
                        title="Delete Category?"
                        message={`Are you sure you want to delete "${categoryToDelete?.name}"? Items in this category may be affected.`}
                    />
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
