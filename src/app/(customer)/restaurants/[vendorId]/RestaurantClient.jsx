"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getVendorStorefront, getMenuItemDetail } from "@/app/lib/menuApi";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

import Header2 from "@/app/components/App_Header/Header2";
import FoodCustomizationModal from "@/app/components/Cart/FoodCustomizationModal";
import { MapPin, Clock, Star, ChevronRight, ShoppingCart, Check, Search, Info, Package, Sparkles, Store, X, Plus, Heart, Globe, Bike, Flame, Truck, MessageSquare, ThumbsUp, ChevronLeft, ChevronRight as ChevronRightIcon, Loader2 } from "lucide-react";


const DIETARY_COLORS = {
    veg: "bg-green-100 text-green-700",
    vegan: "bg-emerald-100 text-emerald-700",
    halal: "bg-teal-100 text-teal-700",
    kosher: "bg-blue-100 text-blue-700",
    "non-veg": "bg-red-100 text-red-700",
};
import { useCart } from "@/app/context/CartContext";
import toast from "react-hot-toast";
import { isVendorOpen } from "@/app/lib/utils";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";
import ViewVendorSkeleton from "@/app/skeleton/ViewVendorSkeleton";

const FoodCard = ({ item, vendor, onSelect }) => {
    const isUnavailable = !item.is_available || !item.is_in_stock;
    const [liked, setLiked] = useState(false);
    const status = getVendorOpenAndCloseStatus(vendor?.openingHours);
    const isOpen = status.startsWith("Open now");

    // console.log(item)
    // console.log(vendor)
    return (
        <div
            onClick={() => !isUnavailable && onSelect(item)}
            className={`group flex-shrink-0 bg-white dark:bg-zinc-900 rounded-[16px] overflow-hidden cursor-pointer transition-all duration-300 border border-zinc-100 dark:border-zinc-800 hover:shadow-xl snap-start ${isUnavailable ? 'opacity-60 grayscale-[0.5]' : ''}`}
            style={{ width: "72vw", maxWidth: "280px" }}
        >
            {/* Image Container */}
            <div className="relative h-[130px] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                    src={item.image_url || item.image || "/placeholder.jpg"}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* HOT Badge - Top Right */}
                <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-0.5 rounded-lg z-10">
                    <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Flame size={8} fill="currentColor" /> HOT
                    </span>
                </div>

                {/* Dietary Badge - Bottom Left */}
                {item.dietary_type && item.dietary_type !== "mixed" && (
                    <div className="absolute bottom-2 left-2 z-10">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${DIETARY_COLORS[item.dietary_type] || "bg-zinc-100 text-zinc-500"}`}>
                            {item.dietary_type}
                        </span>
                    </div>
                )}

                {/* Unavailability Overlay */}
                {isUnavailable && (
                    <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px] flex items-center justify-center z-20">
                        <span className="bg-white/95 text-zinc-900 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                            {!item.is_available ? "Unavailable" : "Sold Out"}
                        </span>
                    </div>
                )}
            </div>

            {/* Info Block */}
            <div className="px-3 pt-2.5 pb-3">
                {/* Row 1: Name + Price + Heart */}
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {item.name}
                        </h3>
                        <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                            ₦{(item.portions?.min_price_naira || item.portions?.default_price_naira || 0).toLocaleString()}
                        </p>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                        className="transition-colors shrink-0 pt-0.5"
                    >
                        <Heart
                            size={16}
                            className={liked ? "fill-red-500 text-red-500" : "text-gray-400"}
                            strokeWidth={liked ? 0 : 1.5}
                        />
                    </button>
                </div>

                {/* Row 2: Category Name */}
                <p className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-500 truncate mt-1">
                    {item.platform_category?.name || "Member Special"}
                </p>

                {/* Row 3: Metadata Line: Delivery | Status | Rating */}
                <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden">

                    {/* Delivery */}
                    <div className="flex items-center gap-1 whitespace-nowrap">
                        <Bike size={14} className="text-gray-400 dark:text-zinc-500" />
                        {(!vendor?.deliveryFee || vendor?.deliveryFee === 0) ? (
                            <span className="text-xs font-bold text-gray-900 dark:text-white">Free</span>
                        ) : (
                            <span className="text-xs text-gray-500 dark:text-zinc-400">₦{vendor.deliveryFee.toLocaleString()}</span>
                        )}
                    </div>

                    <span className="text-zinc-200 dark:text-zinc-700 text-xs">|</span>

                    {/* Status */}
                    <span className={`text-[10px] font-black uppercase italic whitespace-nowrap ${isOpen ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {status}
                    </span>

                    <span className="text-zinc-200 dark:text-zinc-700 text-xs">|</span>

                    {/* Rating */}
                    <div className="flex items-center gap-0.5 whitespace-nowrap">
                        <Star size={10} className="fill-orange-500 text-orange-500" />
                        <span className="text-[11px] font-bold text-gray-900 dark:text-white">
                            {Number(vendor?.rating || 0).toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ComboCard = ({ combo, vendor, onSelect }) => {
    const isUnavailable = !combo.is_available;
    const [liked, setLiked] = useState(false);
    const status = getVendorOpenAndCloseStatus(vendor?.openingHours);
    const isOpen = status.startsWith("Open now");
    
    return (
        <div
            onClick={() => !isUnavailable && onSelect(combo)}
            className={`group flex-shrink-0 bg-white dark:bg-zinc-900 rounded-[16px] overflow-hidden cursor-pointer transition-all duration-300 border border-zinc-100 dark:border-zinc-800 hover:shadow-xl snap-start ${isUnavailable ? 'opacity-60 grayscale-[0.5]' : ''}`}
            style={{ width: "72vw", maxWidth: "280px" }}
        >
            {/* Image Block */}
            <div className="relative h-[130px] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                    src={combo.image_url || "/placeholder.jpg"}
                    alt={combo.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <span className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full z-10">
                    Deal
                </span>
                {isUnavailable && (
                    <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-white/95 text-zinc-900 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                            Unavailable
                        </span>
                    </div>
                )}
            </div>

            {/* Info Block */}
            <div className="px-3 pt-2.5 pb-3">
                {/* Row 1: Name + Price + Heart */}
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {combo.name}
                        </h3>
                        <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                            ₦{(combo.price_naira || 0).toLocaleString()}
                        </p>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                        className="transition-colors shrink-0 pt-0.5"
                    >
                        <Heart
                            size={16}
                            className={liked ? "fill-red-500 text-red-500" : "text-gray-400"}
                            strokeWidth={liked ? 0 : 1.5}
                        />
                    </button>
                </div>

                {/* Row 2: Category Name */}
                <p className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-500 truncate mt-1">
                    {combo.platform_category?.name || "Combo Bundle"}
                </p>

                {/* Row 3: Metadata Line: Delivery | Status | Rating */}
                <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden">

                    {/* Delivery */}
                    <div className="flex items-center gap-1 whitespace-nowrap">
                        <Bike size={14} className="text-gray-400 dark:text-zinc-500" />
                        {(!vendor?.deliveryFee || vendor?.deliveryFee === 0) ? (
                            <span className="text-xs font-bold text-gray-900 dark:text-white">Free</span>
                        ) : (
                            <span className="text-xs text-gray-500 dark:text-zinc-400">₦{vendor.deliveryFee.toLocaleString()}</span>
                        )}
                    </div>

                    <span className="text-zinc-200 dark:text-zinc-700 text-xs">|</span>

                    {/* Status */}
                    <span className={`text-[10px] font-black uppercase italic whitespace-nowrap ${isOpen ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {status}
                    </span>

                    <span className="text-zinc-200 dark:text-zinc-700 text-xs">|</span>

                    {/* Rating */}
                    <div className="flex items-center gap-0.5 whitespace-nowrap">
                        <Star size={10} className="fill-orange-500 text-orange-500" />
                        <span className="text-[11px] font-bold text-gray-900 dark:text-white">{Number(vendor?.rating || 0).toFixed(1)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function StorefrontPage({ initialData, vendorId: propVendorId }) {
    const params = useParams();
    const vendorId = propVendorId || params.vendorId;
    const router = useRouter();
    const { addToCart } = useCart();
    const sectionRefs = useRef({});

    const [selectedItemId, setSelectedItemId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [fullItem, setFullItem] = useState(null);
    const [loadingItem, setLoadingItem] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [activeTab, setActiveTab] = useState("menu"); // "menu" | "reviews"
    const [swiperInstance, setSwiperInstance] = useState(null);
    const [reviewsData, setReviewsData] = useState(null);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [ratingFilter, setRatingFilter] = useState(null); // null = all

    const { data, isLoading, isError } = useQuery({
        queryKey: ["vendor-storefront", vendorId],
        queryFn: () => getVendorStorefront(vendorId),
        enabled: !!vendorId,
        staleTime: 1000 * 60 * 5, // 5 min
        initialData: initialData,
    });

    const vendor      = data?.vendor;
    const sections    = data?.sections || [];
    const unsectioned = data?.unsectioned || [];
    const combos      = data?.combos || [];

    // Fetch reviews when tab switches to reviews
    const fetchReviews = useCallback(async (page = 1, rating = null) => {
        if (!vendorId) return;
        setReviewsLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 8 });
            if (rating) params.append('rating', rating);
            const res = await fetch(`/api/public/reviews/vendor/${vendorId}?${params}`);
            const json = await res.json();
            if (json.success) setReviewsData(json.data);
        } catch (e) {
            console.error('Failed to fetch reviews', e);
        } finally {
            setReviewsLoading(false);
        }
    }, [vendorId]);

    useEffect(() => {
        if (activeTab === 'reviews' && !reviewsData) {
            fetchReviews(reviewsPage, ratingFilter);
        }
    }, [activeTab]);

    const handleRatingFilter = (star) => {
        const newFilter = ratingFilter === star ? null : star;
        setRatingFilter(newFilter);
        setReviewsPage(1);
        fetchReviews(1, newFilter);
    };

    const handleReviewsPage = (newPage) => {
        setReviewsPage(newPage);
        fetchReviews(newPage, ratingFilter);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // console.log('[StorefrontPage] 🍱 sections:', sections);
    // console.log('[StorefrontPage] 📦 unsectioned:', unsectioned);
    // console.log('[StorefrontPage] 🎁 combos:', combos);
    // console.log('[StorefrontPage] 🏷️ sample platform_category (first unsectioned):', unsectioned[0]?.platform_category);

    const allSections = useMemo(() => {
        // Combo section stays at top as-is
        const comboSection = combos.length > 0
            ? [{
                _id:   "combos",
                name:  "Deals & Combos",
                items: combos,
                type:  "combo",
              }]
            : [];

        // Flatten all food items from sections + unsectioned
        const allItems = [
            ...sections.flatMap(s => s.items || []),
            ...unsectioned,
        ];

        // Group by platform category — handles both string (old) and object (new) formats
        const grouped = {};
        for (const item of allItems) {
            const cat = item.platform_category;
            const categoryName = (typeof cat === 'object' && cat !== null)
                ? (cat.parent?.name || cat.name || "Recommended")
                : (typeof cat === 'string' && cat.trim() ? cat.trim() : "Recommended");
            if (!grouped[categoryName]) grouped[categoryName] = [];
            grouped[categoryName].push(item);
        }

        const foodSections = Object.entries(grouped).map(([name, items]) => ({
            _id: name.toLowerCase().replace(/\s+/g, "-"),
            name,
            items,
        }));

        const combined = [...comboSection, ...foodSections];

        if (!searchQuery.trim()) return combined;

        const lowerQuery = searchQuery.toLowerCase();
        return combined.map(section => ({
            ...section,
            items: section.items.filter(item =>
                (item.name || "").toLowerCase().includes(lowerQuery) ||
                (item.description && item.description.toLowerCase().includes(lowerQuery)) ||
                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
                (item.platform_category?.name && item.platform_category.name.toLowerCase().includes(lowerQuery)) ||
                (item.platform_category?.parent?.name && item.platform_category.parent.name.toLowerCase().includes(lowerQuery))
            )
        })).filter(section => section.items.length > 0);

    }, [sections, unsectioned, combos, searchQuery]);

    const scrollToSection = (sectionId) => {
        setActiveSectionId(sectionId);
        sectionRefs.current[sectionId]?.scrollIntoView({
            behavior: "smooth", block: "start"
        });
    };

    const handleComboTap = (combo) => {
        if (!combo.is_available) return;
        router.push(`/combo-details/${combo._id}?vendorId=${vendorId}`);
    };

    const handleItemTap = (item) => {
        if (!item.is_available || !item.is_in_stock) return;
        router.push(`/food-details/${item._id}`);
    };

    const onAddSuccess = () => {
        toast.success("Added to Order!");
        router.push('/orders?activeTab=cart');
    };

    if (isLoading) {
        return <ViewVendorSkeleton />;
    }

    if (isError || !vendor) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6">
                <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-800 max-w-sm w-full">
                    <Store size={48} className="mx-auto text-slate-300 mb-4" />
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Menu Unavailable</h2>
                    <p className="text-slate-500 text-sm mb-6">We couldn't load the menu for this restaurant right now. Please try again later.</p>
                    <button onClick={() => router.back()} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all">Go Back</button>
                </div>
            </div>
        );
    }

    const totalItems = allSections.reduce((acc, curr) => acc + (curr.items?.length || 0), 0);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-12">
            <Header2 
                title={vendor.address?.city || vendor.storeName} 
                subtitle="Food Menu" 
            />

            {/* ✨ Premium Floating Restaurant Header (Animated & Textured) */}
            <div className="relative group overflow-hidden">
                <style jsx>{`
                    @keyframes pan {
                        0% { transform: scale(1.1) translateX(0); }
                        50% { transform: scale(1.15) translateX(-2%); }
                        100% { transform: scale(1.1) translateX(0); }
                    }
                    @keyframes mesh {
                        0% { transform: translate(0, 0) rotate(0deg); }
                        50% { transform: translate(10%, 10%) rotate(180deg); }
                        100% { transform: translate(0, 0) rotate(360deg); }
                    }
                    .mesh-orb {
                        animation: mesh 25s infinite linear;
                    }
                    .float-logo {
                        animation: float 6s ease-in-out infinite;
                    }
                    @keyframes float {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                `}</style>

                {/* 🏮 Cinematic Animated Cover Image */}
                <div className="relative h-[200px] sm:h-[260px] lg:h-[320px] w-full overflow-hidden isolate">
                    <img 
                        src={vendor.logo || "/placeholder-cover.jpg"} 
                        className="w-full h-full object-cover animate-[pan_40s_ease-in-out_infinite]" 
                        alt={`${vendor.storeName} cover`} 
                    />
                    
                    {/* 🌈 Luxury Mesh Orbs (Animated) */}
                    <div className="absolute inset-0 overflow-hidden opacity-30 mix-blend-soft-light dark:opacity-20 pointer-events-none">
                        <div className="mesh-orb absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-400/40 rounded-full blur-[120px]" />
                        <div className="mesh-orb absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-300/40 rounded-full blur-[100px]" style={{ animationDirection: 'reverse', animationDuration: '35s' }} />
                    </div>

                    {/* Grain Texture for Premium Look */}
                    <div className="absolute inset-x-0 inset-y-0 opacity-[0.05] pointer-events-none mix-blend-overlay" 
                         style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />

                    {/* Gradient Shields */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 via-zinc-900/40 to-transparent dark:via-zinc-950/60" />
                    <div className="absolute inset-0 bg-black/5 dark:bg-transparent" />
                </div>
                
                {/* 🏰 Floating Info Panel */}
                <div className="max-w-7xl mx-auto px-4">
                    <div className="relative -mt-16 sm:-mt-20 lg:-mt-24 z-20">
                        {/* Status Badge - Floating Top Right */}
                        <div className="absolute -top-4 right-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest backdrop-blur-xl border shadow-xl transition-all hover:scale-105 ${
                                getVendorOpenAndCloseStatus(vendor.openingHours).startsWith("Open now") 
                                ? "bg-emerald-500/90 text-white border-emerald-400/50" 
                                : "bg-rose-500/90 text-white border-rose-400/50"
                            }`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                {getVendorOpenAndCloseStatus(vendor.openingHours)}
                            </span>
                        </div>

                        <div className="flex flex-col lg:flex-row items-end gap-5 sm:gap-6">
                            {/* Logo with Ring & Float Animation */}
                            <div className="relative shrink-0 mx-auto lg:mx-0 float-logo">
                                <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-3xl sm:rounded-[40px] overflow-hidden border-[4px] border-zinc-50 dark:border-zinc-950 bg-white dark:bg-zinc-900 shadow-2xl transition-transform hover:rotate-2">
                                    <img 
                                        src={vendor.logo || "/placeholder-logo.jpg"} 
                                        className="w-full h-full object-cover" 
                                        alt={`${vendor.storeName} logo`} 
                                    />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-xl rotate-12 border-[3px] border-zinc-50 dark:border-zinc-950">
                                    <Sparkles size={14} fill="white" />
                                </div>
                            </div>

                            {/* Name & Quick Stats */}
                            <div className="flex-1 pb-1 sm:pb-3 text-center lg:text-left">
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 mb-2">
                                    {vendor.cuisineTypes?.slice(0, 3).map((cuisine, idx) => (
                                        <span key={idx} className="text-[9px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-200/50 dark:border-orange-500/20">
                                            {cuisine}
                                        </span>
                                    ))}
                                    {vendor.is_new !== false && (
                                        <span className="text-[9px] font-black uppercase tracking-wider text-white bg-slate-900 dark:bg-zinc-100 dark:text-zinc-900 px-2.5 py-1 rounded-lg shadow-md">
                                            New
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-zinc-950 dark:text-white tracking-tighter mb-3 italic uppercase leading-[0.85] mix-blend-multiply dark:mix-blend-normal">
                                    {vendor.storeName}
                                </h1>

                                {/* Horizontal Stats Bar (Compact) */}
                                <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-y-3 gap-x-6 px-6 py-3.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-3xl border border-white dark:border-zinc-800 shadow-xl shadow-black/5">
                                    {/* Rating */}
                                    <div className="flex items-center gap-2 text-orange-600">
                                        <Star size={14} fill="currentColor" />
                                        <span className="text-sm font-black tracking-tighter">{vendor.rating ? Number(vendor.rating).toFixed(1) : "New"}</span>
                                    </div>

                                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />

                                    {/* Time */}
                                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                                        <Clock size={14} className="text-orange-500" strokeWidth={2.5} />
                                        <span className="text-sm font-black tracking-tighter">{vendor.estimatedDeliveryTime || 30}m</span>
                                    </div>

                                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />

                                    {/* Fee */}
                                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                                        <Truck size={14} className="text-orange-500" strokeWidth={2.5} />
                                        <span className="text-sm font-black tracking-tighter">₦{vendor.deliveryFee?.toLocaleString() || 0}</span>
                                    </div>

                                    <div className="hidden lg:block w-px h-4 bg-zinc-200 dark:bg-zinc-800" />

                                    {/* Location */}
                                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                        <MapPin size={14} className="text-zinc-400" />
                                        <span className="text-xs font-bold tracking-tight">{vendor.address?.city || vendor.address?.state || "Nearby"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Navigation Bar */}
            <div className="sticky top-[64px] z-30 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 pt-4 pb-4 transform-gpu transition-all">
                <div className="max-w-7xl mx-auto px-4 space-y-3">

                    {/* Menu / Reviews Tab Toggle */}
                    <div className="flex gap-2 w-full max-w-md lg:max-w-none">
                        {[
                            { id: 'menu', label: 'Menu', icon: Package },
                            { id: 'reviews', label: `Reviews${vendor?.ratingCount ? ` (${vendor.ratingCount})` : ''}`, icon: Star },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    swiperInstance?.slideTo(tab.id === 'menu' ? 0 : 1);
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 border ${
                                    activeTab === tab.id
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                }`}
                            >
                                <tab.icon size={12} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar — only in menu tab */}
                    {activeTab === 'menu' && (
                    <div className="relative group max-w-md mx-auto lg:mx-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${vendor.storeName}'s menu...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    )}
                    
                    {/* Category Nav - Only show if not heavily searching and on menu tab */}
                    {!searchQuery && activeTab === 'menu' && (
                        <div className="flex gap-2 sm:gap-3 scroll overflow-x-auto pb-2 scrollbar-none snap-x mask-fade-edges">
                            {allSections.map(section => (
                                <button
                                    key={section._id}
                                    onClick={() => scrollToSection(section._id)}
                                    className={`shrink-0 snap-start h-10 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 border ${
                                        activeSectionId === section._id 
                                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:text-slate-900"
                                    }`}
                                >
                                    {section.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Swiper
                onSwiper={setSwiperInstance}
                onSlideChange={(swiper) => {
                    setActiveTab(swiper.activeIndex === 0 ? 'menu' : 'reviews');
                }}
                initialSlide={activeTab === 'reviews' ? 1 : 0}
                speed={400}
                simulateTouch={true}
                touchRatio={1}
                autoHeight={true}
                className="w-full mt-4"
            >
                {/* SLIDE 1: MENU */}
                <SwiperSlide>
                    <div className="pb-10">
                        {searchQuery && totalItems === 0 ? (
                            <div className="text-center py-20 px-4">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-400">
                                    <Search size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white capitalize tracking-tight mb-2">No items found</h3>
                                <p className="text-slate-500 text-sm">We couldn't find anything matching &quot;{searchQuery}&quot;.</p>
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="mt-6 text-orange-600 font-bold text-sm bg-orange-50 px-6 py-2.5 rounded-xl hover:bg-orange-100 transition-colors"
                                >
                                    Clear Search
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {allSections.map((section) => (
                                    <div
                                        key={section._id}
                                        ref={el => sectionRefs.current[section._id] = el}
                                        className="scroll-mt-48"
                                    >
                                        <div className="flex items-center gap-2 px-4 mb-4">
                                            <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight capitalize">
                                                {section.name}
                                            </h2>
                                            <span className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3 py-1 rounded-full">
                                                {section.items?.length || 0}
                                            </span>
                                        </div>

                                        {section.type === 'combo' ? (
                                            <div className="flex gap-4 scroll overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar">
                                                {section.items.map(combo => (
                                                    <ComboCard
                                                        key={combo._id}
                                                        combo={combo}
                                                        vendor={vendor}
                                                        onSelect={handleComboTap}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex gap-4 scroll overflow-x-auto px-4 pb-4 snap-x snap-mandatory no-scrollbar">
                                                {section.items?.map(item => (
                                                    <FoodCard
                                                        key={item._id}
                                                        item={item}
                                                        vendor={vendor}
                                                        onSelect={handleItemTap}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </SwiperSlide>

                {/* SLIDE 2: REVIEWS */}
                <SwiperSlide>
                    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 pb-20">
                        {reviewsLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <Loader2 size={32} className="animate-spin text-orange-500" />
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Loading Reviews...</p>
                            </div>
                        ) : reviewsData ? (
                            <>
                                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        <div className="text-center shrink-0">
                                            <p className="text-7xl font-black text-zinc-900 dark:text-white leading-none">
                                                {reviewsData.restaurant.averageRating || '—'}
                                            </p>
                                            <div className="flex justify-center gap-0.5 mt-2">
                                                {[1,2,3,4,5].map(s => (
                                                    <Star key={s} size={16}
                                                        className={s <= Math.round(reviewsData.restaurant.averageRating) ? 'fill-orange-500 text-orange-500' : 'text-zinc-200 dark:text-zinc-700'}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
                                                {reviewsData.restaurant.totalReviews} review{reviewsData.restaurant.totalReviews !== 1 ? 's' : ''}
                                            </p>
                                        </div>

                                        <div className="flex-1 w-full space-y-2">
                                            {[5,4,3,2,1].map(star => {
                                                const pct = reviewsData.ratingPercentages?.[star] || 0;
                                                const count = reviewsData.ratingDistribution?.[star] || 0;
                                                return (
                                                    <button
                                                        key={star}
                                                        onClick={() => handleRatingFilter(star)}
                                                        className={`w-full flex items-center gap-3 group transition-opacity ${
                                                            ratingFilter && ratingFilter !== star ? 'opacity-40' : 'opacity-100'
                                                        }`}
                                                    >
                                                        <span className="text-[11px] font-black text-zinc-500 w-4 shrink-0">{star}</span>
                                                        <Star size={10} className="fill-orange-400 text-orange-400 shrink-0" />
                                                        <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-black text-zinc-400 w-6 text-right shrink-0">{count}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {ratingFilter && (
                                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                                                Showing {ratingFilter}-star reviews only
                                            </p>
                                            <button
                                                onClick={() => handleRatingFilter(ratingFilter)}
                                                className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-700"
                                            >
                                                Clear filter ×
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {reviewsData.reviews.length === 0 ? (
                                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[40px] border border-dashed border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden relative group">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform rotate-3 group-hover:rotate-6 transition-transform">
                                            <MessageSquare size={40} className="text-zinc-300 dark:text-zinc-600" strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-xl font-black italic uppercase tracking-tight text-zinc-900 dark:text-white mb-2">No feedback yet</h3>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-xs max-w-[200px] mx-auto font-medium leading-relaxed uppercase tracking-widest opacity-80">
                                            Be the first to share your experience with this shop!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {reviewsData.reviews.map((review, idx) => {
                                            const user = review.userId;
                                            const food = review.foodId;
                                            const initials = user ? `${user.firstname?.[0] || ''}${user.lastname?.[0] || ''}`.toUpperCase() : '?';
                                            const date = new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                                            return (
                                                <div key={review._id || idx} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                                                            {user?.avatar ? (
                                                                <img src={user.avatar} alt={initials} className="w-full h-full object-cover" />
                                                            ) : initials}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[13px] font-black text-zinc-900 dark:text-white truncate">
                                                                {user ? `${user.firstname} ${user.lastname}` : 'Anonymous'}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{date}</p>
                                                        </div>
                                                        <div className="flex items-center gap-0.5 shrink-0">
                                                            {[1,2,3,4,5].map(s => (
                                                                <Star key={s} size={12}
                                                                    className={s <= review.rating ? 'fill-orange-500 text-orange-500' : 'text-zinc-200 dark:text-zinc-700'}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {food && (
                                                        <div className="flex items-center gap-2">
                                                            {food.image_url && (
                                                                <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
                                                                    <img src={food.image_url} alt={food.name} className="w-full h-full object-cover" />
                                                                </div>
                                                            )}
                                                            <span className="text-[10px] font-black text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-lg uppercase tracking-widest">
                                                                {food.name}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                                        "{review.comment}"
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {reviewsData.pagination?.totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-4">
                                        <button
                                            onClick={() => handleReviewsPage(reviewsPage - 1)}
                                            disabled={!reviewsData.pagination.hasPrev}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] font-black uppercase tracking-widest text-zinc-600 disabled:opacity-30 hover:border-zinc-400 transition-colors"
                                        >
                                            <ChevronLeft size={14} /> Prev
                                        </button>
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                            Page {reviewsPage} of {reviewsData.pagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => handleReviewsPage(reviewsPage + 1)}
                                            disabled={!reviewsData.pagination.hasNext}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] font-black uppercase tracking-widest text-zinc-600 disabled:opacity-30 hover:border-zinc-400 transition-colors"
                                        >
                                            Next <ChevronRightIcon size={14} />
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-16">
                                <p className="text-sm text-zinc-400">Could not load reviews. Try again.</p>
                            </div>
                        )}
                    </div>
                </SwiperSlide>
            </Swiper>

            {/* Removed Floating Cart per Request */}

            <FoodCustomizationModal 
                food={fullItem}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onAdd={(payload) => {
                    addToCart(payload);
                    onAddSuccess();
                }}
            />

            {loadingItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Preparing...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
