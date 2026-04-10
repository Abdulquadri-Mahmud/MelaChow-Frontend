"use client";

import { useFoodById } from "@/app/hooks/useVendorFoodQuery";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Edit3,
    Globe,
    Clock,
    Truck,
    Star,
    Layers,
    List,
    Tag,
    Flame,
    AlertTriangle,
    Utensils,
    CheckCircle2,
    XCircle,
    MoreHorizontal,
    ChevronRight,
    ImageIcon,
    Trash2,
    Eye
} from "lucide-react";
import Link from "next/link";
import FoodListSkeleton from "@/app/skeleton/FoodListSkeleton";
import { useState } from "react";
import { useArchiveMenuItem } from "@/app/hooks/useMenu";
import { useVendorStorage } from "@/app/hooks/vendorStorage";
import toast from "react-hot-toast";
import PreviewModal from "@/app/modals/create/PreviewModal";
import DeleteConfirmModal from "@/app/modals/DeleteConfirmModal";
import BackButton from "@/app/components/BackButton";

export default function FoodDetailsPage() {
    const router = useRouter();
    const { id } = useParams();
    const { food: foodRes, isLoading } = useFoodById(id);
    const food = foodRes?.data;

    const { vendorDetails } = useVendorStorage();
    const vendorId = vendorDetails?.vendor?.id || vendorDetails?._id || vendorDetails?.id;
    const archiveMutation = useArchiveMenuItem(vendorId);

    const [activeTab, setActiveTab] = useState("overview");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Delete Handler
    const handleDelete = async () => {
        setDeleting(true);
        setDeleteModalOpen(false);
        const toastId = toast.loading("Deleting food...");
        try {
            await archiveMutation.mutateAsync(food._id || id);
            toast.success("Food deleted successfully", { id: toastId });
            router.push("/vendors/my-foods");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete food", { id: toastId });
            setDeleting(false);
        }
    };

    if (isLoading) return <FoodListSkeleton />;
    if (!food) return <div className="p-10 text-center">Food not found</div>;

    // Tabs configuration
    const tabs = [
        { id: "overview", label: "Overview" },
        { id: "variations", label: "Variations & Add-ons" },
        { id: "media", label: "Media & Metadata" }
    ];

    const StatCard = ({ icon: Icon, label, value, subValue, colorClass }) => (
        <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                <Icon size={24} className="text-current" />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">{label}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
                {subValue && <p className="text-xs text-slate-400">{subValue}</p>}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1121] pb-20">

            {/* Visual Header Background */}
            <div className="h-64 w-full bg-slate-900 relative overflow-hidden">
                {food.images?.[0] && (
                    <>
                        <img src={food.images[0].url || food.images[0]} alt="" className="w-full h-full object-cover opacity-60 blur-xl scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] dark:from-[#0B1121] to-transparent" />
                    </>
                )}
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative -mt-40 z-10">

                {/* Navigation & Actions */}
                <div className="flex items-center justify-between mb-8">
                    <BackButton
                        label="Back to Menu"
                        className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 hover:bg-black/40 !text-white/80 hover:!text-white"
                    />
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setDeleteModalOpen(true)}
                            disabled={deleting}
                            className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 px-4 py-2 rounded-xl font-bold border border-rose-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                        <button
                            onClick={() => setPreviewOpen(true)}
                            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold transition-all active:scale-95"
                        >
                            <Eye size={16} /> Preview
                        </button>
                        <Link href={`/vendors/my-foods/${id}/edit`} className="flex items-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95">
                            <Edit3 size={18} /> Edit Details
                        </Link>
                    </div>
                </div>

                {/* Hero Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 dark:border-slate-800 mb-8 flex flex-col md:flex-row gap-8">
                    {/* Main Image */}
                    <div className="w-full md:w-1/3 aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative group">
                        {food.images?.[0] ? (
                            <img src={food.images[0].url || food.images[0]} alt={food.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={48} /></div>
                        )}
                        <div className="absolute top-4 left-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-lg border border-white/20 ${food.available ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                {food.available ? "Active" : "Hidden"}
                            </span>
                        </div>
                    </div>

                    {/* Hero Content */}
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">{food.name}</h1>
                                <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg flex items-center gap-1"><Utensils size={14} /> {food.category}</span>
                                    <span>•</span>
                                    <span>{food.description?.length} chars description</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-400 font-medium mb-1">Base Price</p>
                                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">₦{food.price?.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6">
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">{food.description}</p>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-auto">
                            <StatCard icon={Star} label="Rating" value={`${food.rating} (${food.ratingCount})`} colorClass="bg-amber-100 text-amber-600" />
                            <StatCard icon={Clock} label="Est. Time" value={`${food.estimatedDeliveryTime} min`} colorClass="bg-blue-100 text-blue-600" />
                            <StatCard icon={Truck} label="Delivery" value={`₦${food.deliveryFee}`} colorClass="bg-indigo-100 text-indigo-600" />
                            <StatCard icon={Globe} label="Visibility" value={food.available ? "Public" : "Private"} colorClass={food.available ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"} />
                        </div>
                    </div>
                </motion.div>

                {/* Content Tabs */}
                <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 px-2 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id ? "text-[#FF6B00]" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            {tab.label}
                            {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B00] rounded-full" />}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Detailed View Area (Left 2/3) */}
                    <div className="lg:col-span-2 space-y-8">

                        {activeTab === 'overview' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                {/* Tags */}
                                <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Tag size={20} className="text-slate-400" /> Discovery Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {food.tags?.map((tag, i) => (
                                            <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full font-medium text-sm">#{tag}</span>
                                        ))}
                                        {!food.tags?.length && <p className="text-slate-400 italic">No tags added.</p>}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {(activeTab === 'variations' || activeTab === 'overview') && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

                                {/* Variants */}
                                <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Layers size={20} className="text-[#FF6B00]" /> Variants</h3>
                                        <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded-md">{food.variants?.length || 0} items</span>
                                    </div>
                                    {food.variants?.length ? (
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {food.variants.map((variant, i) => (
                                                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden">
                                                            {variant.image || variant.images?.[0]?.url ? <img src={variant.image || variant.images?.[0]?.url} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="m-auto mt-3 text-slate-300" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white">{variant.name}</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-right">₦{Number(variant.price).toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-slate-400">No variants defined.</div>
                                    )}
                                </div>

                                {/* Choice Groups */}
                                <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><List size={20} className="text-blue-500" /> Add-ons (Choice Groups)</h3>
                                        <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-md">{food.choiceGroups?.length || 0} groups</span>
                                    </div>
                                    {food.choiceGroups?.length ? (
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {food.choiceGroups.map((group, i) => (
                                                <div key={i} className="p-5">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-bold text-slate-800 dark:text-white">{group.name}</h4>
                                                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                            {group.minSelect > 0 ? "Required" : "Optional"} ({group.minSelect}-{group.maxSelect})
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {group.options.map((opt, j) => (
                                                            <div key={j} className="text-sm border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50">
                                                                <span className="text-slate-700 dark:text-slate-300 font-medium">{opt.name}</span>
                                                                <span className="text-slate-400 font-normal border-l border-slate-200 pl-2">+₦{Number(opt.price).toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-slate-400">No add-ons defined.</div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'media' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                                    <h3 className="font-bold mb-4">Gallery</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {food.images?.map((img, i) => (
                                            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative group">
                                                <img src={img.url || img} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">Image {i + 1}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar Info Area (Right 1/3) */}
                    <div className="space-y-6">
                        {/* Metadata Card */}
                        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Preferences & Metadata</h3>

                            <div className="space-y-4">
                                {/* Spicy Level */}
                                <div>
                                    <p className="text-xs font-medium text-slate-500 mb-1">Spiciness</p>
                                    <div className="flex items-center gap-2">
                                        <Flame size={18} className={food.metadata?.spicyLevel !== 'mild' ? "text-orange-500" : "text-green-500"} />
                                        <span className="font-bold text-slate-800 dark:text-white capitalize">{food.metadata?.spicyLevel || "Not specified"}</span>
                                    </div>
                                </div>

                                {/* Dietary */}
                                <div>
                                    <p className="text-xs font-medium text-slate-500 mb-1">Dietary Info</p>
                                    <div className="flex items-center gap-2">
                                        {food.metadata?.dietaryInfo ? (
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-sm font-bold">{food.metadata.dietaryInfo}</span>
                                        ) : <span className="text-slate-400 italic text-sm">None</span>}
                                    </div>
                                </div>

                                {/* Allergens */}
                                <div>
                                    <p className="text-xs font-medium text-slate-500 mb-2">Allergens</p>
                                    <div className="flex flex-wrap gap-2">
                                        {food.metadata?.allergens?.length ? food.metadata.allergens.map((alg, i) => (
                                            <span key={i} className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-md">
                                                <AlertTriangle size={12} /> {typeof alg === 'string' ? alg : alg.label}
                                            </span>
                                        )) : <span className="text-slate-400 italic text-sm">No allergens listed</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Portions Mini Table */}
                        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Portion Prices</h3>
                            {food.portions?.length ? (
                                <div className="space-y-2">
                                    {food.portions.map((p, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg">
                                            <span className="text-slate-700 font-medium">{p.label}</span>
                                            <span className="font-bold text-slate-900">₦{Number(p.price).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm">Standard pricing applies.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            <PreviewModal
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                food={food}
                variants={food.variants || []}
                portions={food.portions || []}
                choiceGroups={food.choiceGroups || []}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Food Item"
                message="This will permanently remove this food item from your menu. All associated data including variants, portions, and choice groups will be deleted."
                itemName={food?.name}
                isDeleting={deleting}
                confirmText="Yes, Delete"
                cancelText="Cancel"
            />
        </div>
    );
}
