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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900">Categories</h1>
                            <p className="text-gray-500">Manage food categories for the platform</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchCategories}
                                className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw size={20} />
                            </button>
                            <button
                                onClick={handleCreate}
                                className="flex items-center gap-2 px-5 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
                            >
                                <Plus size={20} />
                                <span>Add Category</span>
                            </button>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 transition-colors"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <Filter size={18} className="text-gray-400" />
                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                {['all', 'active', 'inactive'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${filterStatus === status
                                            ? "bg-white text-gray-900"
                                            : "text-gray-500 hover:text-gray-700"
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
                                <Loader2 size={40} className="text-orange-500 animate-spin mb-4" />
                                <p className="text-gray-500 font-medium">Loading categories...</p>
                            </div>
                        ) : (
                            <CategoryTable
                                categories={filteredCategories}
                                onEdit={handleEdit}
                                onDelete={handleDeleteClick}
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
