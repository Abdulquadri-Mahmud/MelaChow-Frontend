"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getVendorStorefront, getMenuItemDetail } from "@/app/lib/menuApi";
import { useState, useRef, useMemo } from "react";
import Header2 from "@/app/components/App_Header/Header2";
import FoodCustomizationModal from "@/app/components/Cart/FoodCustomizationModal";
import { MapPin, Clock, Star, ChevronRight, ShoppingCart, Check, Search, Info, Package, Sparkles, Store, X, Plus } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import toast from "react-hot-toast";

const DietaryBadge = ({ type }) => {
    const colors = {
        veg:     "bg-green-500",
        vegan:   "bg-emerald-500",
        halal:   "bg-teal-500",
        kosher:  "bg-blue-500",
        "non-veg": "bg-red-500",
        mixed:   null,
    };
    const color = colors[type];
    if (!color) return null;
    return (
        <span className={`absolute top-2 right-2 text-[9px] px-2 py-0.5
                          rounded-full font-black uppercase tracking-widest
                          text-white ${color} z-10 shadow-sm`}>
            {type}
        </span>
    );
};

const FoodCard = ({ item, vendor, onSelect }) => {
    const isUnavailable = !item.is_available || !item.is_in_stock;
    const hasMultiplePortions = item.portions?.count > 1;
    const price = item.portions?.default_price_naira || 0;

    return (
        <div 
            onClick={() => !isUnavailable && onSelect(item)}
            className={`bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-orange-200 dark:hover:border-orange-500/30 transition-all duration-300 cursor-pointer group flex flex-col h-full ${isUnavailable ? 'opacity-60 grayscale-[0.5]' : ''}`}
        >
            <div className="relative h-32 sm:h-40 w-full overflow-hidden shrink-0 bg-slate-50 dark:bg-slate-800">
                <img 
                    src={item.image_url || "/placeholder.jpg"} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    loading="lazy"
                />
                <DietaryBadge type={item.dietary_type} />
                {isUnavailable && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-white/95 text-slate-900 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg">
                            {!item.is_available ? "Unavailable" : "Sold Out"}
                        </span>
                    </div>
                )}
            </div>
            
            <div className="p-3 sm:p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-1 sm:mb-2 gap-2">
                    <h4 className="font-bold sm:font-black text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 leading-tight">
                        {item.name}
                    </h4>
                </div>
                {item.description && (
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 sm:mb-4 flex-1">
                        {item.description}
                    </p>
                )}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50 dark:border-slate-800/50">
                    <div className="flex flex-col">
                        {hasMultiplePortions && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">From</span>}
                        <p className="text-sm sm:text-base font-black text-orange-600 dark:text-orange-500">
                            ₦{price.toLocaleString()}
                        </p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-orange-500/30 transition-all duration-300">
                        <Plus size={16} className="sm:hidden" />
                        <ShoppingCart size={18} className="hidden sm:block" />
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

    const allSections = useMemo(() => {
        const combined = [
            ...sections,
            ...(unsectioned.length > 0
                ? [{ _id: "other", name: "Other Options", items: unsectioned }]
                : []),
        ];
        
        if (!searchQuery.trim()) return combined;
        
        const lowerQuery = searchQuery.toLowerCase();
        return combined.map(section => ({
            ...section,
            items: section.items.filter(item => 
                item.name.toLowerCase().includes(lowerQuery) || 
                (item.description && item.description.toLowerCase().includes(lowerQuery)) ||
                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
            )
        })).filter(section => section.items.length > 0);
        
    }, [sections, unsectioned, searchQuery]);

    const scrollToSection = (sectionId) => {
        setActiveSectionId(sectionId);
        sectionRefs.current[sectionId]?.scrollIntoView({
            behavior: "smooth", block: "start"
        });
    };

    const handleItemTap = async (item) => {
        if (!item.is_available || !item.is_in_stock) return;
        setLoadingItem(true);
        try {
            const res = await getMenuItemDetail(vendorId, item._id);
            setFullItem({ ...res.item, vendor: data.vendor });
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
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-24 lg:pb-12">
            <Header2 />

            {/* Premium Hero Section */}
            <div className="relative">
                {/* Cover Image Background */}
                <div className="absolute inset-0 h-[300px] lg:h-[400px] w-full isolate">
                    <img 
                        src={vendor.logo || "/placeholder-cover.jpg"} 
                        className="w-full h-full object-cover" 
                        alt={`${vendor.storeName} cover`} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] dark:from-slate-950 via-slate-900/60 to-slate-900/30 dark:via-slate-950/80 dark:to-slate-950/60 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] dark:from-slate-950 via-transparent to-transparent" />
                </div>
                
                {/* Content Container */}
                <div className="relative z-10 pt-24 lg:pt-36 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-800 md:flex items-start gap-8">
                        
                        {/* Logo */}
                        <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-3xl overflow-hidden shrink-0 border-4 border-white dark:border-slate-800 shadow-xl bg-white -mt-16 lg:mt-0 mb-6 lg:mb-0 mx-auto lg:mx-0">
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
                            
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-6">
                                {vendor.description || "Discover delicious meals crafted with passion and fresh ingredients."}
                            </p>
                            
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
            <div className="sticky top-[64px] z-30 bg-[#F8FAFC]/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 pt-6 pb-4 transform-gpu transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
                    {/* Search Bar */}
                    <div className="relative group max-w-md mx-auto lg:mx-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${vendor.storeName}'s menu...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
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
                                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md"
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
                    <div className="space-y-12 lg:space-y-20">
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
                                    <span className="hidden sm:inline-flex text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3 py-1 rounded-full shadow-sm">
                                        {section.items?.length || 0} Options
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                                    {section.items?.map(item => (
                                        <FoodCard 
                                            key={item._id} 
                                            item={item} 
                                            vendor={vendor} 
                                            onSelect={handleItemTap} 
                                        />
                                    ))}
                                </div>
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

            {loadingItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Preparing...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
