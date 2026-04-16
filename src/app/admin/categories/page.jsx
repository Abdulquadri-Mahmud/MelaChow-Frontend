"use client";

import { useState, useEffect, useMemo } from "react";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import CategoryTable from "@/app/components/admin/CategoryTable";
import CategoryModal from "@/app/components/admin/CategoryModal";
import adminAPI from "@/app/lib/adminApi";
import { Plus, Search, Filter, RefreshCw, Loader2, LayoutGrid, ChevronDown, Activity, X, PieChart } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import DeleteConfirmationModal from "@/app/components/admin/DeleteConfirmationModal";

const StatTile = ({ label, value, bg, text, icon: Icon }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:border-orange-200 transition-all group">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg} ${text} bg-opacity-30 group-hover:bg-opacity-40 transition-colors`}>
            <Icon size={18} />
        </div>
        <div className="min-w-0">
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1 truncate">{label}</p>
            <p className="text-lg font-extrabold text-slate-900 leading-none">{value}</p>
        </div>
    </div>
);

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);

    // Fetch categories and metrics
    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [categoriesData, metricsData] = await Promise.all([
                adminAPI.getAllCategories(),
                adminAPI.getCategoryMetrics()
            ]);
            setCategories(categoriesData.data || []);
            setMetrics(metricsData.distribution || []);
        } catch (error) {
            console.error("Failed to fetch categories data:", error);
            toast.error("Handshake with registry failed");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter categories based on search and status
    const filteredCategories = useMemo(() => {
        return categories.filter(category => {
            const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus =
                filterStatus === 'all' ? true :
                    filterStatus === 'active' ? category.isActive :
                        !category.isActive;

            return matchesSearch && matchesStatus;
        });
    }, [categories, searchQuery, filterStatus]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus]);

    const handleCreate = () => {
        setSelectedCategory(null);
        setModalOpen(true);
    };

    const handleEdit = (category) => {
        setSelectedCategory(category);
        setModalOpen(true);
    };

    const handleSubmit = async (payload) => {
        try {
            if (selectedCategory) {
                await adminAPI.updateCategory(selectedCategory._id, payload);
                toast.success("Classification Updated");
            } else {
                await adminAPI.createCategory(payload);
                toast.success("New Category Registry Success");
            }
            fetchData();
        } catch (error) {
            console.error("Operation failed:", error);
            throw error;
        }
    };

    const handleToggleActive = async (categoryId, newStatus) => {
        setCategories(prev =>
            prev.map(c => c._id === categoryId ? { ...c, isActive: newStatus } : c)
        );
        try {
            await adminAPI.updateCategory(categoryId, { isActive: newStatus });
            toast.success(newStatus ? "Online Status Set" : "Category Paused");
        } catch (error) {
            setCategories(prev =>
                prev.map(c => c._id === categoryId ? { ...c, isActive: !newStatus } : c)
            );
            toast.error("Status Sync Failure");
        }
    };

    const handleDeleteClick = (category) => {
        setCategoryToDelete(category);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!categoryToDelete) return;
        try {
            await adminAPI.deleteCategory(categoryToDelete._id);
            toast.success("Entry Purged");
            fetchData();
        } catch (error) {
            toast.error("Operation Failed");
        }
    };

    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="space-y-6">
                    {/* ── HEADER ────────────────────────────────────────────── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100 shrink-0">
                                    <LayoutGrid size={20} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Menu Classifications</h1>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="h-0.5 w-6 bg-orange-500 rounded-full" />
                                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Platform Directory Management</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={fetchData}
                                disabled={isLoading}
                                className="p-2.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all border border-transparent hover:border-orange-100 shadow-sm"
                            >
                                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                            </button>
                            <button
                                onClick={handleCreate}
                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-[0.15em] rounded-xl hover:bg-orange-600 transition-all shadow-xl shadow-slate-200 hover:shadow-orange-200 active:scale-95"
                            >
                                <Plus size={16} />
                                <span>Add New Category</span>
                            </button>
                        </div>
                    </div>

                    {/* ── ANALYTICS DISTRIBUTION ───────────────────────────── */}
                    <AnimatePresence>
                        {metrics?.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col lg:flex-row"
                            >
                                <div className="p-5 border-r border-slate-100 lg:w-1/3 bg-slate-50/50">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-[10px] font-extrabold text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Activity size={14} className="text-orange-500" /> Inventory Spread
                                        </h3>
                                        <span className="text-[10px] font-extrabold text-orange-600 bg-orange-100 px-2 py-0.5 rounded uppercase tracking-tighter">Live Dataset</span>
                                    </div>
                                    <div className="space-y-3">
                                        <StatTile label="Total Nodes" value={categories.length} icon={LayoutGrid} bg="bg-blue-100" text="text-blue-600" />
                                        <StatTile label="Visibility Rank" value={categories.filter(c => c.isActive).length} icon={Activity} bg="bg-emerald-100" text="text-emerald-600" />
                                        <StatTile label="Deepest Segment" value={metrics[0]?.name || "N/A"} icon={PieChart} bg="bg-orange-100" text="text-orange-600" />
                                    </div>
                                </div>
                                <div className="p-5 flex-1 h-[240px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={metrics.slice(0, 8)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800, textTransform: 'uppercase' }} width={80} />
                                            <Tooltip 
                                                cursor={{ fill: '#fff7ed' }}
                                                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                                                itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#f48525' }}
                                                labelStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}
                                            />
                                            <Bar dataKey="count" name="Items" radius={[0, 4, 4, 0]} barSize={20}>
                                                {metrics.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#f48525' : '#fbbf24'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── TOOLBAR ───────────────────────────────────────────── */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col lg:flex-row gap-4 items-center shadow-sm">
                        <div className="relative w-full lg:flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Locate classification record…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full lg:w-auto">
                            <div className="flex bg-slate-50 border border-slate-200 p-1.5 rounded-xl flex-1 lg:flex-none">
                                {['all', 'active', 'inactive'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`flex-1 px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all ${filterStatus === status
                                            ? "bg-white text-orange-600 shadow-sm border border-orange-100"
                                            : "text-slate-400 hover:text-slate-600"
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                            <AnimatePresence>
                                {(searchQuery || filterStatus !== 'all') && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onClick={() => { setSearchQuery(""); setFilterStatus("all"); }}
                                        className="h-11 px-4 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors border border-rose-100 group"
                                    >
                                        <X size={16} className="group-hover:rotate-90 transition-transform" />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* ── MAIN CONTENT ─────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-200 border-dashed">
                                <Loader2 size={32} className="text-orange-500 animate-spin mb-4" />
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Synchronizing Registry Dataset…</p>
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

                    {/* Category Modal Overlay */}
                    <CategoryModal
                        isOpen={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onSubmit={handleSubmit}
                        category={selectedCategory}
                        allCategories={categories}
                    />

                    {/* Delete Confirmation Modal Overlay */}
                    <DeleteConfirmationModal
                        isOpen={deleteModalOpen}
                        onClose={() => setDeleteModalOpen(false)}
                        onConfirm={confirmDelete}
                        title="Purge Classification?"
                        message={`Action is irreversible. Purging "${categoryToDelete?.name}" may affect associated inventory nodes.`}
                    />
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
