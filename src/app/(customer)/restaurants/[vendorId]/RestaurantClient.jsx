"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getVendorStorefront } from "@/app/lib/menuApi";
import { useState, useRef, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { MapPin, Clock, Star, Search, X, Share2, Flame, ChevronLeft, Store, Gift, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { getVendorOpenAndCloseStatus } from "@/app/lib/vendor-time/OpenOrClose";
import ViewVendorSkeleton from "@/app/skeleton/ViewVendorSkeleton";
import { useFoodModalStore } from "@/app/store/foodModalStore";
import { useComboModalStore } from "@/app/store/comboModalStore";
import { useActivePromos } from "@/app/hooks/useActivePromos";

const getItemId = (item) => item?._id || item?.id;
const isComboItem = (item) => item?.type === "combo" || item?.item_type === "combo";


const FoodItemRow = ({ item, onSelect }) => {
    const isUnavailable = item.is_available === false || item.is_in_stock === false;
    const price = item.portions?.min_price_naira || item.portions?.default_price_naira || item.price_naira || item.price || 0;
    return <div onClick={() => !isUnavailable && onSelect(item)} className={`group flex items-center gap-4 py-2 border-b border-zinc-100 dark:border-zinc-800/70 last:border-0 cursor-pointer ${isUnavailable ? "opacity-50 grayscale pointer-events-none" : ""}`}>
        <div className="flex-1 min-w-0 space-y-1">
            <h3 className="text-[16px] font-normal capitalize text-zinc-900 dark:text-white tracking-tight truncate">{item.name}</h3>
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 line-clamp-2">{item.description || "Freshly prepared with premium ingredients."}</p>
            <span className="text-[13px] font-normal text-zinc-950 dark:text-zinc-50">From ₦{price.toLocaleString()}</span>
        </div>
        <div className="relative w-[100px] h-[100px] rounded-xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800">
            <img src={item.image_url || item.image || "/placeholder.jpg"} alt={item.name} className="w-full h-full object-cover" onError={(event) => { event.currentTarget.src = "/placeholder.jpg"; event.currentTarget.onerror = null; }} />
            {!isUnavailable && <div className="absolute bottom-0 inset-x-0 bg-orange-100/95 py-2 text-center text-[12px] font-bold text-orange-700">Add +</div>}</div>
        </div>;
};

export default function StorefrontPage({ vendorId: propVendorId }) {
    const params = useParams();
    const vendorId = propVendorId || params.vendorId;
    const router = useRouter();    const openFoodModal = useFoodModalStore(state => state.openFoodModal);
    const openComboModal = useComboModalStore(state => state.openComboModal);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSectionId, setActiveSectionId] = useState("all");

    const [isSearchActive, setIsSearchActive] = useState(false);    const { platformPromo } = useActivePromos();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["vendor-storefront", vendorId],
        queryFn: () => getVendorStorefront(vendorId),
        enabled: !!vendorId,
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    const vendor      = data?.vendor;
    const sections    = data?.sections || [];
    const unsectioned = data?.unsectioned || [];
    const combos      = data?.combos || [];

    const selectMenuTab = (id) => {
        setActiveSectionId(id);
    };
    const handleComboTap = (combo) => {
        if (combo.is_available === false) return;
        const selectedComboId = getItemId(combo);
        if (!selectedComboId) return;
        openComboModal(selectedComboId, { combo, vendor });
    };

    const handleItemTap = (item) => {
        if (isComboItem(item)) return handleComboTap(item);
        if (item.is_available === false || item.is_in_stock === false) return;
        const selectedFoodId = getItemId(item);
        if (!selectedFoodId) return;
        openFoodModal(selectedFoodId, { food: item });
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
            ? [{ _id: "combos", name: "Deals & Combos", items: combos.map(c => ({ ...c, type: 'combo' })), type: "combo" }]
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

        // Deduplicate items for the "All" tab and preserve their type
        const allItemsListMap = new Map();

        // 1. Process food items
        [...sections.flatMap(s => s.items || []), ...unsectioned].forEach(item => {
            if (item && item._id) {
                allItemsListMap.set(item._id, { ...item, type: 'food' });
            }
        });

        // 2. Process combo items (override if same ID exists, though unlikely)
        combos.forEach(item => {
            if (item && item._id) {
                allItemsListMap.set(item._id, { ...item, type: 'combo' });
            }
        });

        const allItemsList = Array.from(allItemsListMap.values());

        // Deduplicate items inside each category
        const deduplicatedCategories = combinedCategories.map(cat => {
            const catMap = new Map();
            cat.items.forEach(item => {
                if (item && item._id) {
                    catMap.set(item._id, item);
                }
            });
            return { ...cat, items: Array.from(catMap.values()) };
        });

        const finalSections = [
            { _id: "all", name: "All", items: allItemsList },
            ...deduplicatedCategories
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

    const selectedSection = allSections.find((section) => section._id === activeSectionId) || allSections[0];

    if (isLoading) {
        return <ViewVendorSkeleton />;
    }

    if (isError || !vendor) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 px-6">
                <div className="text-center p-8 bg-zinc-50 dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 max-w-sm w-full">
                    <Store size={48} className="mx-auto text-zinc-300 mb-4" />
                    <h2 className="text-xl font-medium text-zinc-900 dark:text-white tracking-tight mb-2">Menu Unavailable</h2>
                    <p className="text-zinc-500 text-sm mb-6">We couldn't load the menu for this restaurant right now.</p>
                    <button onClick={() => router.back()} className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 h-12 rounded-2xl font-medium uppercase tracking-widest text-xs">Go Back</button>
                </div>
            </div>
        );
    }

    const isScrolled = scrollY > 120;

    return (
        <div className="min-h-screen scroll bg-white dark:bg-zinc-950 pb-10">
        <div className="relative h-[155px] w-full">
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        style={{ scale: 1 + scrollY * 0.001, y: scrollY * 0.4 }}
                        className="absolute inset-0 w-full h-full"
                    >
                        <img src={vendor.logo || "/placeholder.jpg"} alt={vendor.storeName} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-medium/60 via-medium/20 to-transparent" />
                    </motion.div>
                </div>
                {!isScrolled && (
                    <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
                        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-medium/20 backdrop-blur-md border border-white/20 text-white">
                            <ChevronLeft size={24} />
                        </button>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsSearchActive(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-medium/20 backdrop-blur-md border border-white/20 text-white transition-all active:scale-90">
                                <Search size={20} />
                            </button>
                            <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center rounded-full bg-medium/20 backdrop-blur-md border border-white/20 text-white transition-all active:scale-90">
                                <Share2 size={20} />
                            </button>
                        </div>
                    </div>
                )}
                {/* Logo straddling the hero/card boundary — sits here so overflow-hidden never clips it */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-40">
                    <div className="w-18 h-18 rounded-[16px] bg-white dark:bg-zinc-950 p-1 shadow-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                        <img
                            src={vendor.logo || "/placeholder.jpg"}
                            alt={vendor.storeName}
                            className="w-full h-full object-cover rounded-[12px]"
                        />
                    </div>
                </div>
            </div>

            {/* 🏰 Sticky Glass Header */}
            <AnimatePresence>
                {(isScrolled || isSearchActive) && (
                    <motion.div
                        initial={{ y: -72, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -72, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 inset-x-0 z-[60] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-100 dark:border-zinc-800 px-4 h-11 flex items-center justify-between"
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
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md overflow-hidden border border-zinc-100 dark:border-zinc-800 shrink-0">
                                            <img src={vendor.logo || "/placeholder.jpg"} className="w-full h-full object-cover" alt={vendor.storeName} />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-[11px] font-medium text-zinc-900 dark:text-white truncate uppercase italic tracking-tight">{vendor.storeName}</h2>
                                            <div className="flex items-center gap-1.5 text-[9px] font-medium text-zinc-400 uppercase tracking-widest">
                                                <Star size={8} className="text-amber-400 fill-amber-400" />
                                                <span>{vendor.rating ? Number(vendor.rating).toFixed(1) : "NEW"}</span>
                                                <span className="w-0.5 h-0.5 bg-zinc-300 rounded-full" />
                                                <span>Delivery {vendor.estimatedDeliveryTime || "25"} min</span>
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
                                            className="w-full h-9 bg-zinc-100 dark:bg-zinc-900 rounded-lg pl-9 pr-3 text-[12px] font-medium text-zinc-900 dark:text-white outline-none ring-offset-2 focus:ring-2 ring-orange-500/20"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <button onClick={() => { setIsSearchActive(false); setSearchQuery(""); }} className="text-[11px] font-medium uppercase text-orange-600 tracking-widest px-1">Cancel</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🏛️ Store Identity Card */}
            <div className="relative max-w-2xl mx-auto">
                <div className="bg-white dark:bg-zinc-900 pt-10 px-2 pb-2 shadow-medium/5 dark:shadow-none border border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col items-center text-center">

                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-[18px] font-medium text-zinc-900 dark:text-white tracking-tight">
                                {vendor.storeName}
                            </h1>
                            <span className="">-</span>
                            <p className="text-[18px] font-medium text-zinc-900 dark:text-white flex items-center justify-center gap-1.5">
                                {/* <MapPin size={11} className="text-orange-900" /> */}
                                {vendor.address?.city || "Restaurant"}
                            </p>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center ">
                            <span className="text-[12px] font-medium text-zinc-500">
                                {getVendorOpenAndCloseStatus(vendor.openingHours)}
                            </span>
                            <ChevronRight className="text-zinc-500 h-5 w-4" />
                        </div>

                        {/* Stats Row */}
                        <div className="mt-3 flex items-center gap-5 w-full justify-center border border-zinc-100 dark:border-zinc-800 rounded-sm py-1">
                            <div className="text-center space-y-0.5">
                                <div className="flex items-center gap-1 justify-center">
                                    <Star size={12} className="text-amber-400 fill-amber-400" />
                                    <span className="text-[13px] font-medium text-zinc-900 dark:text-white">{vendor.rating ? Number(vendor.rating).toFixed(1) : "NEW"}</span>
                                </div>
                                <p className="text-[9px] font-semibold text-zinc-400">({vendor.ratingCount || 0}) Reviews</p>
                            </div>
                            <div className="w-px h-6 bg-zinc-100 dark:bg-zinc-800" />
                            <div className="text-center space-y-0.5">
                                <div className="flex items-center gap-1 justify-center">
                                    <Clock size={12} className="text-orange-500" />
                                    <span className="text-[13px] font-medium text-zinc-900 dark:text-white">{Math.max(0, Number(vendor.estimatedDeliveryTime || 25) - 5)}–{Number(vendor.estimatedDeliveryTime || 25)} min</span>
                                </div>
                                <p className="text-[9px] font-semibold text-zinc-400">Est. delivery</p>
                            </div>
                            <div className="w-px h-6 bg-zinc-100 dark:bg-zinc-800" />
                            <div className="text-center space-y-0.5">
                                <div className="flex items-center gap-1 justify-center text-orange-500 font-medium text-[13px]">
                                    {!vendor.deliveryFee || vendor.deliveryFee === 0 ? (
                                        <span className="text-green-500">Free</span>
                                    ) : (
                                        `₦${vendor.deliveryFee.toLocaleString()}`
                                    )}
                                </div>
                                <p className="text-[9px] font-semibold text-zinc-400">Delivery</p>
                                {vendor.hasActiveDeliveryPromo && (
                                    <p className="text-[8px] font-medium text-orange-500 uppercase tracking-widest">
                                        Sponsored
                                    </p>
                                )}
                            </div>
                        </div>

                        {vendor.hasActiveDeliveryPromo && (
                            <div className="mt-3 flex items-center gap-2 px-2 py-2 bg-green-50 dark:bg-green-500/10 rounded-sm border border-green-100 dark:border-green-500/20">
                                <span className="text-base">🏪</span>
                                <span className="text-[11px] font-medium text-green-700 dark:text-green-400 uppercase tracking-widest">
                                    Free delivery — sponsored by this restaurant
                                </span>
                            </div>
                        )}

                        {platformPromo && (
                            <div className="mt-3 flex items-start gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                                <Gift size={16} className="mt-0.5 shrink-0 text-orange-500" />
                                <span className="text-[11px] font-medium text-orange-700 dark:text-orange-400 uppercase tracking-widest leading-snug">
                                    Free delivery for the first {platformPromo.totalSlots?.toLocaleString()} eligible first orders. {platformPromo.slotsRemaining?.toLocaleString()} spots left.
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto mt-3">
                <div className="sticky top-0 z-[70] border-y border-zinc-100 bg-white/95 px-4 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95">
                    <div className="flex gap-4 overflow-x-auto scrollbar-none">
                        {allSections.map((section) => (
                            <button key={section._id} onClick={() => selectMenuTab(section._id)} className={`shrink-0 border-b-2 py-3 text-[14px] font-medium capitalize transition-all ${activeSectionId === section._id ? 'border-orange-500 text-orange-600' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>
                                {section.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-4 pt-3">{selectedSection?.items?.length ? <section key={selectedSection._id} className="pb-8"><div className="space-y-0">{selectedSection.items.map((item, index) => <FoodItemRow key={`${selectedSection._id}-${item._id}-${index}`} item={item} onSelect={handleItemTap} />)}</div></section> : <div className="flex flex-col items-center justify-center px-10 py-20 text-center"><Search size={32} className="text-zinc-300" /><p className="mt-3 text-sm font-medium text-zinc-500">No menu items found.</p></div>}</div>
            </div>
        </div>
    );
}