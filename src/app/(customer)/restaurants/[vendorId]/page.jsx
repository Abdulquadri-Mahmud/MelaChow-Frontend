"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getVendorStorefront, getMenuItemDetail } from "@/app/lib/menuApi";
import { useState, useRef, useMemo } from "react";
import Header2 from "@/app/components/App_Header/Header2";
import FoodCustomizationModal from "@/app/components/Cart/FoodCustomizationModal";
import { MapPin, Clock, Star, ChevronRight, ShoppingCart, Check, Search, Info, Package, Sparkles, Store, X, Plus, Heart, Globe, Bike, Flame, Truck } from "lucide-react";

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

    console.log(item)
    console.log(vendor)
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


export default function StorefrontPage() {
    const { vendorId } = useParams();
    const router = useRouter();
    const { addToCart } = useCart();
    const sectionRefs = useRef({});

    const [selectedItemId, setSelectedItemId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
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
                <div className="relative z-10 pt-24 lg:pt-36 px-2 max-w-7xl mx-auto">
                    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl p-2 rounded-t-[2.5rem] lg:rounded-[3rem] border-white/50 dark:border-zinc-800 md:flex items-start gap-8 shadow-2xl shadow-black/10">
                        
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
                                    <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${getVendorOpenAndCloseStatus(vendor.openingHours).startsWith("Open now") ? "text-emerald-600 bg-emerald-100" : "text-rose-600 bg-rose-100"}`}>
                                        {getVendorOpenAndCloseStatus(vendor.openingHours)}
                                    </span>
                            </div>
                            
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-950 dark:text-white tracking-tighter mb-2 italic uppercase">
                                {vendor.storeName}
                            </h1>
                            
                            {/* <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-6">
                                {vendor.description || "Discover delicious meals crafted with passion and fresh ingredients."}
                            </p> */}
                            
                            {/* Meta Info - Minimalist Design */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-4 text-[13px] md:text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                                {/* Rating Badge */}
                                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full text-zinc-900 dark:text-white font-black shadow-sm">
                                    <Star size={14} className={vendor.rating ? "fill-orange-500 text-orange-500" : "text-orange-500"} />
                                    <span>{vendor.rating ? vendor.rating : "New"}</span>
                                </div>

                                {/* Delivery Time */}
                                <div className="flex items-center gap-1.5">
                                    <Clock size={16} className="text-zinc-400" />
                                    <span>{vendor.estimatedDeliveryTime || 30} mins</span>
                                </div>

                                <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />

                                {/* Delivery Fee */}
                                <div className="flex items-center gap-1.5">
                                    <Truck size={16} className="text-zinc-400" />
                                    <span>₦{vendor.deliveryFee?.toLocaleString() || 0} delivery</span>
                                </div>

                                <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />

                                {/* Location */}
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={16} className="text-zinc-400" />
                                    <span className="truncate max-w-[150px]">{vendor.address?.city || "Ikorodu"}</span>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>

            {/* Search & Navigation Bar */}
            <div className="sticky top-[64px] z-30 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 pt-6 pb-4 transform-gpu transition-all">
                <div className="max-w-7xl mx-auto px-4 space-y-3">
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

            {/* Main Menu Content — mirrors FoodList layout */}
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
                <div className="space-y-8 pb-10">
                    {allSections.map((section) => (
                        <div
                            key={section._id}
                            ref={el => sectionRefs.current[section._id] = el}
                            className="scroll-mt-48"
                        >
                            {/* Section Header — same as FoodList */}
                            <div className="flex items-center gap-2 px-4 mb-4">
                                <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight capitalize">
                                    {section.name}
                                </h2>
                                <span className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3 py-1 rounded-full">
                                    {section.items?.length || 0}
                                </span>
                            </div>

                            {/* Horizontal scroll row — same as FoodList */}
                            {section.type === "combo" ? (
                                <div className="flex gap-4 scroll overflow-x-auto px-4 pb-4 snap-x snap-mandatory no-scrollbar">
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
