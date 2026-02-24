"use client";

import { RiderProvider } from "@/app/context/RiderContext";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, LayoutDashboard, History, Settings, Bell, LogOut, Menu, X, Power } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRider } from "@/app/context/RiderContext";

function RiderHeader({ isOnline, toggleAvailability }) {
    const { rider, logout } = useRider();
    const [scrolled, setScrolled] = useState(false);

    // console.log(rider)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-lg border-b border-white/5 py-3' : 'bg-transparent py-5'
            }`}>
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
                        <Bike size={20} />
                    </div>
                    <span className="text-xl font-black text-white tracking-tight hidden sm:block">GrubDash <span className="text-orange-600">Rider</span></span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Status Toggle */}
                    <button
                        onClick={toggleAvailability}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all border ${isOnline
                                ? 'bg-green-500/10 border-green-500/20 text-green-500'
                                : 'bg-red-500/10 border-red-500/20 text-red-500'
                            }`}
                    >
                        <Power size={14} />
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </button>

                    {/* Profile */}
                    <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border-2 border-orange-500/20">
                            {rider?.avatar ? <img src={rider.avatar} alt="Rider" className="w-full h-full object-cover" /> : <Bike size={18} className="text-orange-600" />}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

function RiderLayoutInner({ children }) {
    const { isOnline, toggleAvailability, loading, rider } = useRider();
    const pathname = usePathname();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!rider && !pathname.includes('/auth')) {
        // Redirect logic handled in Context or Page usually, but for safety:
        return null;
    }

    return (
        <div className="min-h-screen bg-[#0F1115] text-white">
            <RiderHeader isOnline={isOnline} toggleAvailability={toggleAvailability} />
            <main className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
                {children}
            </main>

            {/* Bottom Navigation for Mobile */}
            <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/5 py-3 px-6 z-50 flex items-center justify-between sm:hidden">
                <Link href="/rider/dashboard" className={`flex flex-col items-center gap-1 ${pathname === '/rider/dashboard' ? 'text-orange-500' : 'text-gray-500'}`}>
                    <LayoutDashboard size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
                </Link>
                <Link href="/rider/orders" className={`flex flex-col items-center gap-1 ${pathname === '/rider/orders' ? 'text-orange-500' : 'text-gray-500'}`}>
                    <History size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Orders</span>
                </Link>
                <Link href="/rider/earnings" className={`flex flex-col items-center gap-1 ${pathname === '/rider/earnings' ? 'text-orange-500' : 'text-gray-500'}`}>
                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center -mt-8 shadow-lg shadow-orange-600/30 border-4 border-[#0F1115] text-white">
                        <Power size={20} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleAvailability(); }} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Toggle</span>
                </Link>
                <Link href="/rider/notifications" className={`flex flex-col items-center gap-1 ${pathname === '/rider/notifications' ? 'text-orange-500' : 'text-gray-500'}`}>
                    <Bell size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Alerts</span>
                </Link>
                <Link href="/rider/settings" className={`flex flex-col items-center gap-1 ${pathname === '/rider/settings' ? 'text-orange-500' : 'text-gray-500'}`}>
                    <Settings size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Me</span>
                </Link>
            </nav>
        </div>
    );
}

export default function RiderLayout({ children }) {
    return (
        <RiderProvider>
            <RiderLayoutInner>
                {children}
            </RiderLayoutInner>
        </RiderProvider>
    );
}
