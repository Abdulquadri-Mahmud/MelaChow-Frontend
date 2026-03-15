"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getVendorStorefront, getMenuItemDetail } from "@/app/lib/menuApi";
import { useState, useRef, useMemo } from "react";
import Header2 from "@/app/components/App_Header/Header2";
import FoodCustomizationModal from "@/app/components/Cart/FoodCustomizationModal";
import ComboCustomizationModal from "@/app/components/Cart/ComboCustomizationModal";
import { MapPin, Clock, Star, ChevronRight, ShoppingCart, Check, Search, Info, Package, Sparkles, Store, X, Plus, Heart, Globe, Bike, Flame } from "lucide-react";

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

const FoodCard = ({ item, vendor, onSelect }) => {
    const isUnavailable = !item.is_available || !item.is_in_stock;
    const [liked, setLiked] = useState(false);
    const isOpen = isVendorOpen(vendor?.openingHours);

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
                {/* Row 1: Name + Heart */}
                <div className="flex justify-between items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[calc(100%-28px)]">
                        {item.name}
                    </h3>
                    <button
                        onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                        className="transition-colors"
                    >
                        <Heart
                            size={18}
                            className={liked ? "fill-red-500 text-red-500" : "text-gray-400"}
                            strokeWidth={liked ? 0 : 1.5}
                        />
                    </button>
                </div>

                {/* Row 2: Vendor Name • Location */}
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                    {vendor?.storeName} • {vendor?.address?.city || vendor?.city || "Nearby"}
                </p>

                {/* Row 3: Metadata Line: Globe | Delivery | Status | Rating */}
                <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden">
                    <Globe size={14} className="text-gray-400 dark:text-zinc-500" />

                    <span className="text-zinc-200 dark:text-zinc-700 text-xs">|</span>

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
                    <span className={`text-xs font-bold whitespace-nowrap ${isOpen ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isOpen ? "Open" : "Closed"}
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
    const isOpen = isVendorOpen(vendor?.openingHours);
    
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
                {/* Row 1: Name + Heart */}
                <div className="flex justify-between items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[calc(100%-28px)]">
                        {combo.name}
                    </h3>
                    <button
                        onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                        className="transition-colors"
                    >
                        <Heart
                            size={18}
                            className={liked ? "fill-red-500 text-red-500" : "text-gray-400"}
                            strokeWidth={liked ? 0 : 1.5}
                        />
                    </button>
                </div>

                {/* Row 2: Metadata Line: Delivery Fee | Status | Rating */}
                <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden">
                    <Globe size={14} className="text-gray-400 dark:text-zinc-500" />
                    
                    <span className="text-zinc-200 dark:text-zinc-700 text-xs">|</span>

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
                    <span className={`text-xs font-bold whitespace-nowrap ${isOpen ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isOpen ? "Open" : "Closed"}
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


export default function StorefrontPage() {
    const { vendorId } = useParams();
    const router = useRouter();
    const { addToCart, addComboToCart } = useCart();
    const sectionRefs = useRef({});

    const [selectedItemId, setSelectedItemId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCombo, setSelectedCombo] = useState(null);
    const [comboModalOpen, setComboModalOpen] = useState(false);
    const [fullItem, setFullItem] = useState(null);
    const [loadingItem, setLoadingItem] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSectionId, setActiveSectionId] = useState(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["vendor-storefront", vendorId],
        queryFn: () => getVendorStorefront(vendorId),
        enabled: !!vendorId,
        staleTime: 1000 * 60 * 5, // 5 min
    });

    const vendor      = data?.vendor;
    const sections    = data?.sections || [];
    const unsectioned = data?.unsectioned || [];
    const combos      = data?.combos || [];

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

        // Group by platform parent category
        const grouped = {};
        for (const item of allItems) {
            const categoryName = item.platform_category?.parent?.name
                || item.platform_category?.name
                || "Other Options";
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
                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
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
        setSelectedCombo(combo);
        setComboModalOpen(true);
    };

    const handleItemTap = async (item) => {
        if (!item.is_available || !item.is_in_stock) return;
        setLoadingItem(true);
        try {
            const res = await getMenuItemDetail(vendorId, item._id);
            const rawItem = res.item;
            // Normalize: API returns choice_groups (snake_case), modal expects choiceGroups (camelCase)
            const normalizedItem = {
                ...rawItem,
                choiceGroups: rawItem.choiceGroups || rawItem.choice_groups || [],
                vendor: data.vendor,
            };
            setFullItem(normalizedItem);
            setModalOpen(true);
        } catch {
            toast.error("Could not load item details");
        } finally {
            setLoadingItem(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Menu...</p>
                </div>
            </div>
        );
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

            {/* Premium Hero Section */}
            <div className="relative">
                {/* Cover Image Background */}
                <div className="absolute inset-0 h-[300px] lg:h-[400px] w-full isolate">
                    <img 
                        src={vendor.logo || "/placeholder-cover.jpg"} 
                        className="w-full h-full object-cover" 
                        alt={`${vendor.storeName} cover`} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 via-zinc-900/60 to-zinc-900/30 dark:via-zinc-950/80 dark:to-zinc-950/60 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 via-transparent to-transparent" />
                </div>
                
                {/* Content Container */}
                <div className="relative z-10 pt-24 lg:pt-36 px-4 max-w-7xl mx-auto">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-2 rounded-[2.5rem] lg:rounded-[3rem] border-white/50 dark:border-slate-800 md:flex items-start gap-8">
                        
                        {/* Logo */}
                        <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-3xl overflow-hidden shrink-0 border-4 border-white dark:border-slate-800 bg-white -mt-16 lg:mt-0 mb-3 lg:mb-0 mx-auto lg:mx-0">
                            <img 
                                src={vendor.logo || "/placeholder-logo.jpg"} 
                                className="w-full h-full object-cover" 
                                alt={`${vendor.storeName} logo`} 
                            />
                        </div>
                        
                        {/* Details */}
                        <div className="flex-1 text-center lg:text-left">
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-2">
                                {vendor.cuisineTypes?.map((cuisine, idx) => (
                                    <span key={idx} className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/20 px-3 py-1 rounded-full">
                                        {cuisine}
                                    </span>
                                ))}
                                {!vendor.isOpen && (
                                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-rose-600 bg-rose-100 px-3 py-1 rounded-full">
                                        Closed Currently
                                    </span>
                                )}
                            </div>
                            
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white tracking-tight mb-3">
                                {vendor.storeName}
                            </h1>
                            
                            {/* <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-6">
                                {vendor.description || "Discover delicious meals crafted with passion and fresh ingredients."}
                            </p> */}
                            
                            {/* Meta Badges */}
                            <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                        <Star size={14} className={vendor.rating ? "text-amber-500 fill-amber-500" : ""} />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rating</span>
                                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-200">{vendor.rating ? `${vendor.rating} / 5.0` : "New on GrubDash"}</span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                        <Clock size={14} />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery Info</span>
                                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-200">{vendor.estimatedDeliveryTime || 30} mins • ₦{vendor.deliveryFee?.toLocaleString() || 0} fee</span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                        <MapPin size={14} />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</span>
                                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-200 truncate max-w-[120px] sm:max-w-xs">{vendor.address?.city || "Local Area"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>

            {/* Search & Navigation Bar */}
            <div className="sticky top-[64px] z-30 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 pt-6 pb-4 transform-gpu transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
                    {/* Search Bar */}
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
                                onClick={() => setSearchQuery("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    
                    {/* Category Nav - Only show if not heavily searching */}
                    {!searchQuery && (
                        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none snap-x mask-fade-edges">
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

            {/* Main Menu Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                
                {searchQuery && totalItems === 0 ? (
                    <div className="text-center py-20 px-4">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-400">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white capitalize tracking-tight mb-2">No items found</h3>
                        <p className="text-slate-500 text-sm">We couldn't find anything matching &quot;{searchQuery}&quot;.</p>
                        <button 
                            onClick={() => setSearchQuery("")}
                            className="mt-6 text-orange-600 font-bold text-sm bg-orange-50 px-6 py-2.5 rounded-xl hover:bg-orange-100 transition-colors"
                        >
                            Clear Search
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8 lg:space-y-20">
                        {allSections.map((section, idx) => (
                            <section 
                                key={section._id} 
                                ref={el => sectionRefs.current[section._id] = el}
                                className="scroll-mt-48"
                            >
                                <div className="flex items-center gap-4 mb-6 sm:mb-8">
                                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {section.name}
                                    </h2>
                                    <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-800" />
                                    <span className="hidden sm:inline-flex text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3 py-1 rounded-full">
                                        {section.items?.length || 0} Options
                                    </span>
                                </div>
                                
                                {section.type === "combo" ? (
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
                                    <div className="flex gap-4 scroll overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar">
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
                            </section>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Quick view cart (Mobile & Desktop) */}
            <div className="fixed bottom-6 inset-x-0 mx-auto w-fit z-40 transform translate-y-0 transition-transform duration-300">
                <button 
                    onClick={() => router.push('/cart')}
                    className="flex justify-between items-center group bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-14 pl-5 pr-2 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all w-[200px] sm:w-[240px]"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <ShoppingCart size={20} />
                            {/* In a real app, bind this to cart count */}
                            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-slate-900 dark:border-white">
                                3
                            </span>
                        </div>
                        <span className="font-black text-xs uppercase tracking-widest hidden sm:block">View Order</span>
                        <span className="font-black text-xs uppercase tracking-widest sm:hidden">Cart</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-800 dark:bg-slate-100 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <ChevronRight size={18} strokeWidth={3} />
                    </div>
                </button>
            </div>

            <FoodCustomizationModal 
                food={fullItem}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onAdd={addToCart}
            />

            <ComboCustomizationModal
                combo={selectedCombo}
                vendor={vendor}
                isOpen={comboModalOpen}
                onClose={() => setComboModalOpen(false)}
                onAdd={addComboToCart}
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
