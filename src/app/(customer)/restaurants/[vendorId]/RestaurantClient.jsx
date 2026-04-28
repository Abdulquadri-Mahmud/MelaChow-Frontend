"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getVendorStorefront, getMenuItemDetail } from "@/app/lib/menuApi";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { AnimatePresence, motion } from "framer-motion";

import FoodCustomizationModal from "@/app/components/Cart/FoodCustomizationModal";
import { MapPin, Clock, Star, Search, X, Plus, Share2, Flame, MessageSquare, ChevronLeft, Loader2, Store } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import toast from "react-hot-toast";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";
import ViewVendorSkeleton from "@/app/skeleton/ViewVendorSkeleton";
import { useFoodModalStore } from "@/app/store/foodModalStore";

const FoodItemRow = ({ item, onSelect }) => {
    const isUnavailable = !item.is_available || !item.is_in_stock;
    const price = item.portions?.min_price_naira || item.portions?.default_price_naira || item.price || 0;
    const oldPrice = item.old_price || (price * 1.2); 

    return (
        <div 
            onClick={() => !isUnavailable && onSelect(item)}
            className={`group flex items-center gap-4 py-4 border-b border-zinc-100 dark:border-zinc-800/70 last:border-0 cursor-pointer active:scale-[0.99] transition-all duration-200 ${isUnavailable ? 'opacity-50 grayscale pointer-events-none' : ''}`}
        >
            {/* Text Content */}
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-extrabold text-zinc-900 dark:text-white tracking-tight truncate group-hover:text-orange-600 transition-colors duration-200">
                        {item.name}
                    </h3>
                    {item.is_popular && <Flame size={13} className="text-orange-500 shrink-0 animate-pulse" />}
                </div>

                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed font-medium">
                    {item.description || "Freshly prepared with premium ingredients."}
                </p>

                <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[14px] font-black text-orange-600">₦{price.toLocaleString()}</span>
                    {oldPrice > price && (
                        <span className="text-[12px] text-zinc-400 line-through font-medium">₦{Math.round(oldPrice).toLocaleString()}</span>
                    )}
                </div>
            </div>

            {/* Image + Add Button */}
            <div className="relative w-[80px] h-[80px] rounded-2xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 shadow-md group-hover:shadow-orange-200 dark:group-hover:shadow-orange-900/30 transition-shadow duration-300">
                <img 
                    src={item.image_url || item.image || "/placeholder.jpg"} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = '/placeholder.jpg'; e.target.onerror = null; }}
                />

                {/* Add Button */}
                {!isUnavailable && (
                    <div className="absolute bottom-1.5 right-1.5">
                        <div className="w-7 h-7 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/40 group-active:scale-90 transition-transform">
                            <Plus size={15} strokeWidth={3} />
                        </div>
                    </div>
                )}

                {isUnavailable && (
                    <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-white/95 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest text-zinc-800">
                            Sold Out
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

const ComboCard = ({ combo, vendor, onSelect }) => {
    const isUnavailable = !combo.is_available;
    const price = combo.price_naira || 0;
    
    return (
        <div
            onClick={() => !isUnavailable && onSelect(combo)}
            className={`flex-shrink-0 w-[240px] bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-black/[0.03] cursor-pointer active:scale-95 transition-all duration-300 group ${isUnavailable ? 'opacity-50 grayscale' : ''}`}
        >
            <div className="relative h-40 w-full overflow-hidden">
                <img src={combo.image_url || "/placeholder.jpg"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={combo.name} />
                <div className="absolute top-3 left-3 bg-zinc-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-xl border border-white/10">
                    Combo Deal
                </div>
                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
            </div>
            <div className="p-4 space-y-2">
                <h4 className="text-[14px] font-black text-zinc-900 dark:text-white truncate uppercase italic tracking-tight">{combo.name}</h4>
                <div className="flex items-center justify-between">
                    <span className="text-[16px] font-black text-orange-500">₦{price.toLocaleString()}</span>
                    <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                        <Plus size={16} strokeWidth={3} />
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
    const openFoodModal = useFoodModalStore(state => state.openFoodModal);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSectionId, setActiveSectionId] = useState("all");
    const [activeTab, setActiveTab] = useState("menu");
    const [mainSwiper, setMainSwiper] = useState(null);
    const [menuSwiper, setMenuSwiper] = useState(null);
    const [reviewsData, setReviewsData] = useState(null);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [ratingFilter, setRatingFilter] = useState(null);
    const [isSearchActive, setIsSearchActive] = useState(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["vendor-storefront", vendorId],
        queryFn: () => getVendorStorefront(vendorId),
        enabled: !!vendorId,
        staleTime: 0,
        initialData: initialData,
    });

    const vendor      = data?.vendor;
    const sections    = data?.sections || [];
    const unsectioned = data?.unsectioned || [];
    const combos      = data?.combos || [];

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

    const scrollToSection = (id) => {
        const index = allSections.findIndex(s => s._id === id);
        if (index !== -1) menuSwiper?.slideTo(index);
    };

    const handleComboTap = (combo) => {
        if (!combo.is_available) return;
        router.push(`/combo-details/${combo._id}?vendorId=${vendorId}`);
    };

    const handleItemTap = (item) => {
        if (!item.is_available || !item.is_in_stock) return;
        openFoodModal(item._id, { food: item });
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${vendor.storeName} on MelaChow`,
                    text: `Check out ${vendor.storeName} in ${vendor.address?.city} on MelaChow!`,
                    url: window.location.href,
                });
            } catch (err) {
                console.error("Error sharing:", err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard!");
        }
    };

    const onAddSuccess = () => {
        toast.success("Added to Order!");
    };

    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const allSections = useMemo(() => {
        const comboSection = combos.length > 0
            ? [{ _id: "combos", name: "Deals & Combos", items: combos, type: "combo" }]
            : [];

        const allItems = [...sections.flatMap(s => s.items || []), ...unsectioned];
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

        const combinedCategories = [...comboSection, ...foodSections];
        const allItemsList = combinedCategories.flatMap(s => s.items);

        const finalSections = [
            { _id: "all", name: "All", items: allItemsList },
            ...combinedCategories
        ];

        if (!searchQuery.trim()) return finalSections;

        const lowerQuery = searchQuery.toLowerCase();
        return finalSections.map(section => ({
            ...section,
            items: section.items.filter(item =>
                (item.name || "").toLowerCase().includes(lowerQuery) ||
                (item.description && item.description.toLowerCase().includes(lowerQuery))
            )
        })).filter(section => section.items.length > 0);
    }, [sections, unsectioned, combos, searchQuery]);

    if (isLoading) return <ViewVendorSkeleton />;

    if (isError || !vendor) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 px-6">
                <div className="text-center p-8 bg-zinc-50 dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 max-w-sm w-full">
                    <Store size={48} className="mx-auto text-zinc-300 mb-4" />
                    <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">Menu Unavailable</h2>
                    <p className="text-zinc-500 text-sm mb-6">We couldn't load the menu for this restaurant right now.</p>
                    <button onClick={() => router.back()} className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 h-12 rounded-2xl font-black uppercase tracking-widest text-xs">Go Back</button>
                </div>
            </div>
        );
    }

    const isScrolled = scrollY > 120;

    return (
        <div className="min-h-screen scroll bg-white dark:bg-zinc-950 pb-20">
            <div className="relative h-[180px] w-full overflow-hidden">
                <motion.div 
                    style={{ scale: 1 + scrollY * 0.001, y: scrollY * 0.4 }}
                    className="absolute inset-0 w-full h-full"
                >
                    <img src={vendor.logo || "/placeholder.jpg"} alt={vendor.storeName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </motion.div>
                {!isScrolled && (
                    <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-white">
                            <ChevronLeft size={24} />
                        </button>
                    </div>
                )}
            </div>

            {/* 🏰 Sticky Glass Header */}
            <AnimatePresence>
                {isScrolled && (
                    <motion.div 
                        initial={{ y: -72, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -72, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 inset-x-0 z-[60] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-100 dark:border-zinc-800 px-4 h-14 flex items-center justify-between"
                    >
                        <AnimatePresence mode="wait">
                            {!isSearchActive ? (
                                <motion.div 
                                    key="info"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="flex items-center justify-between w-full"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-800 shrink-0">
                                            <img src={vendor.logo || "/placeholder.jpg"} className="w-full h-full object-cover" alt={vendor.storeName} />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-[12px] font-black text-zinc-900 dark:text-white truncate uppercase italic tracking-tight">{vendor.storeName}</h2>
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                                <Star size={8} className="text-amber-400 fill-amber-400" />
                                                <span>{vendor.rating ? Number(vendor.rating).toFixed(1) : "NEW"}</span>
                                                <span className="w-0.5 h-0.5 bg-zinc-300 rounded-full" />
                                                <span>{vendor.estimatedDeliveryTime || "25"} MIN</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button onClick={() => setIsSearchActive(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 transition-colors">
                                            <Search size={14} className="text-zinc-600 dark:text-zinc-400" />
                                        </button>
                                        <button onClick={handleShare} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 transition-colors">
                                            <Share2 size={14} className="text-zinc-600 dark:text-zinc-400" />
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="search"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex items-center gap-3 w-full"
                                >
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                                        <input 
                                            autoFocus
                                            type="text"
                                            placeholder="Search menu..."
                                            className="w-full h-9 bg-zinc-100 dark:bg-zinc-900 rounded-lg pl-9 pr-3 text-[12px] font-black text-zinc-900 dark:text-white outline-none ring-offset-2 focus:ring-2 ring-orange-500/20"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <button onClick={() => { setIsSearchActive(false); setSearchQuery(""); }} className="text-[11px] font-black uppercase text-orange-600 tracking-widest px-1">Cancel</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🏛️ Store Identity Card */}
            <div className="relative max-w-2xl mx-auto px-4 -mt-12 z-20">
                <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-5 shadow-2xl shadow-black/5 dark:shadow-none border border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-[22px] bg-white dark:bg-zinc-950 p-1.5 shadow-xl -mt-12 mb-3 border border-zinc-100 dark:border-zinc-800">
                            <img 
                                src={vendor.logo || "/placeholder.jpg"} 
                                alt={vendor.storeName} 
                                className="w-full h-full object-cover rounded-[18px]"
                            />
                        </div>
                        
                        <div className="space-y-0.5 mb-4">
                            <h1 className="text-[22px] font-black text-zinc-900 dark:text-white tracking-tight">
                                {vendor.storeName}
                            </h1>
                            <p className="text-[12px] font-medium text-zinc-500 flex items-center justify-center gap-1.5">
                                <MapPin size={11} className="text-orange-500" />
                                {vendor.address?.city || "Restaurant"}
                            </p>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-5 w-full justify-center">
                            <div className="text-center space-y-0.5">
                                <div className="flex items-center gap-1 justify-center">
                                    <Star size={13} className="text-amber-400 fill-amber-400" />
                                    <span className="text-[15px] font-black text-zinc-900 dark:text-white">{vendor.rating ? Number(vendor.rating).toFixed(1) : "NEW"}</span>
                                </div>
                                <p className="text-[10px] font-semibold text-zinc-400">({vendor.ratingCount || 0}) Reviews</p>
                            </div>
                            <div className="w-px h-8 bg-zinc-100 dark:bg-zinc-800" />
                            <div className="text-center space-y-0.5">
                                <div className="flex items-center gap-1 justify-center">
                                    <Clock size={13} className="text-orange-500" />
                                    <span className="text-[15px] font-black text-zinc-900 dark:text-white">{vendor.estimatedDeliveryTime || "25"}</span>
                                </div>
                                <p className="text-[10px] font-semibold text-zinc-400">Min Delivery</p>
                            </div>
                            <div className="w-px h-8 bg-zinc-100 dark:bg-zinc-800" />
                            <div className="text-center space-y-0.5">
                                <div className="flex items-center gap-1 justify-center text-orange-500 font-black text-[15px]">
                                    ₦{vendor.deliveryFee?.toLocaleString() || "FREE"}
                                </div>
                                <p className="text-[10px] font-semibold text-zinc-400">Delivery Fee</p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                            <span className="text-[12px] font-bold text-orange-600">
                                {getVendorOpenAndCloseStatus(vendor.openingHours)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 mt-5 space-y-4">
                <div className="flex bg-zinc-100/50 dark:bg-zinc-900/50 backdrop-blur-md p-1 rounded-[22px] w-full border border-zinc-100 dark:border-zinc-800">
                    <button 
                        onClick={() => { setActiveTab("menu"); mainSwiper?.slideTo(0); }}
                        className={`flex-1 py-2.5 rounded-[18px] text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === 'menu' ? 'bg-white dark:bg-zinc-800 text-orange-600 shadow-lg shadow-black/5 dark:shadow-none' : 'text-zinc-400'}`}
                    >
                        Menu Items
                    </button>
                    <button 
                        onClick={() => { setActiveTab("reviews"); mainSwiper?.slideTo(1); }}
                        className={`flex-1 py-2.5 rounded-[18px] text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === 'reviews' ? 'bg-white dark:bg-zinc-800 text-orange-600 shadow-lg shadow-black/5 dark:shadow-none' : 'text-zinc-400'}`}
                    >
                        Reviews ({vendor.ratingCount || 0})
                    </button>
                </div>

                {activeTab === 'menu' && (
                    <div className="flex gap-5 overflow-x-auto pb-0 scrollbar-none sticky top-14 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl z-40 -mx-4 px-5 border-b border-zinc-100 dark:border-zinc-800 shadow-sm transition-all duration-300">
                        {allSections.map((section) => (
                            <button
                                key={section._id}
                                onClick={() => scrollToSection(section._id)}
                                className={`py-3.5 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${activeSectionId === section._id ? 'border-orange-500 text-orange-600' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
                            >
                                {section.name}
                            </button>
                        ))}
                    </div>
                )}

                <Swiper
                    onSwiper={setMainSwiper}
                    onSlideChange={(swiper) => setActiveTab(swiper.activeIndex === 0 ? 'menu' : 'reviews')}
                    initialSlide={0}
                    speed={500}
                    autoHeight={true}
                    className="w-full"
                >
                    <SwiperSlide>
                        <Swiper
                            onSwiper={setMenuSwiper}
                            onSlideChange={(swiper) => setActiveSectionId(allSections[swiper.activeIndex]?._id)}
                            speed={300}
                            autoHeight={true}
                            className="w-full"
                        >
                            {allSections.length > 0 ? (
                                allSections.map((section) => (
                                    <SwiperSlide key={section._id}>
                                        <div className="pb-6 pt-2 min-h-[50vh]">
                                            {section.type === 'combo' ? (
                                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x px-1">
                                                    {section.items.map(combo => (
                                                        <ComboCard key={combo._id} combo={combo} vendor={vendor} onSelect={handleComboTap} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="space-y-0 px-2">
                                                    {section.items.map(item => (
                                                        <FoodItemRow key={item._id} item={item} onSelect={handleItemTap} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </SwiperSlide>
                                ))
                            ) : (
                                <SwiperSlide>
                                    <div className="flex flex-col items-center justify-center py-20 px-10 text-center space-y-4">
                                        <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-900 rounded-[32px] flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                                            <Search size={32} className="text-zinc-300" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[16px] font-black text-zinc-900 dark:text-white uppercase italic tracking-tight">No Items Found</p>
                                            <p className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                                                We couldn't find anything matching "{searchQuery}". <br/> Try searching for something else.
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => { setSearchQuery(""); setIsSearchActive(false); }}
                                            className="text-orange-500 text-[11px] font-black uppercase tracking-[0.2em] pt-2"
                                        >
                                            Clear Search
                                        </button>
                                    </div>
                                </SwiperSlide>
                            )}
                        </Swiper>
                    </SwiperSlide>

                    <SwiperSlide>
                        <div className="pb-20 bg-gray-50/10 dark:bg-zinc-900/10 space-y-4 pt-6">
                            {reviewsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 size={32} className="animate-spin text-orange-500" />
                                    <p className="text-[12px] font-black uppercase tracking-widest text-zinc-400">Loading Reviews...</p>
                                </div>
                            ) : reviewsData ? (
                                <>
                                    <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-8 border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-black/[0.02]">
                                        <div className="flex flex-col sm:flex-row items-center gap-8">
                                            <div className="text-center shrink-0">
                                                <p className="text-7xl font-black text-zinc-900 dark:text-white leading-none mb-3 italic">
                                                    {reviewsData.restaurant.averageRating || '—'}
                                                </p>
                                                <div className="flex justify-center gap-1">
                                                    {[1,2,3,4,5].map(s => (
                                                        <Star key={s} size={16} className={s <= Math.round(reviewsData.restaurant.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-100 dark:text-zinc-800'} />
                                                    ))}
                                                </div>
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-3">Overall Rating</p>
                                            </div>
                                            <div className="flex-1 w-full space-y-3">
                                                {[5,4,3,2,1].map(star => {
                                                    const pct = reviewsData.ratingPercentages?.[star] || 0;
                                                    return (
                                                        <div key={star} className="flex items-center gap-4">
                                                            <span className="text-[10px] font-black text-zinc-400 w-2">{star}</span>
                                                            <div className="flex-1 h-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-full overflow-hidden">
                                                                <motion.div 
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${pct}%` }}
                                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                                    className="h-full bg-orange-500 rounded-full" 
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-black text-zinc-900 dark:text-white w-8 text-right">{pct}%</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4">
                                        {reviewsData.reviews.map((review, idx) => (
                                            <div key={idx} className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 border border-zinc-100/80 dark:border-zinc-800/80 space-y-4 shadow-sm group hover:border-orange-500/20 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-orange-500/20">
                                                            {review.userId?.firstname?.[0]}{review.userId?.lastname?.[0]}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[15px] font-black text-zinc-900 dark:text-white leading-tight uppercase italic">
                                                                {review.userId?.firstname} {review.userId?.lastname}
                                                            </p>
                                                            <div className="flex gap-0.5">
                                                                {[1,2,3,4,5].map(s => (
                                                                    <Star key={s} size={10} className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-100 dark:text-zinc-800'} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                            {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <p className="text-[14px] text-zinc-600 dark:text-zinc-400 leading-relaxed italic pr-6 font-medium">
                                                        "{review.comment}"
                                                    </p>
                                                    <MessageSquare size={16} className="absolute top-0 right-0 text-zinc-100 dark:text-zinc-800" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </SwiperSlide>
                </Swiper>
            </div>

        </div>
    );
}