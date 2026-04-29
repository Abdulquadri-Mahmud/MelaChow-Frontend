"use client";

import { motion } from "framer-motion";
import { 
  Smartphone, 
  Apple, 
  Chrome, 
  Share, 
  PlusSquare, 
  MoreVertical, 
  Download, 
  Zap, 
  ShieldCheck, 
  Wifi,
  ChevronRight,
  ArrowRight,
  Monitor
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function InstallPage() {
    const [activeTab, setActiveTab] = useState("ios");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Detect OS and set default tab
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if (/android/i.test(userAgent)) {
            setActiveTab("android");
        } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            setActiveTab("ios");
        }
    }, []);

    if (!isMounted) return null;

    const iosSteps = [
        {
            title: "Open Safari",
            description: "Launch Safari and visit melachow.com",
            icon: <Monitor className="text-blue-500" size={24} />
        },
        {
            title: "Tap Share",
            description: "Tap the share icon (square with arrow) at the bottom",
            icon: <Share className="text-blue-500" size={24} />
        },
        {
            title: "Add to Home Screen",
            description: "Scroll down and tap 'Add to Home Screen'",
            icon: <PlusSquare className="text-zinc-600 dark:text-zinc-400" size={24} />
        },
        {
            title: "Confirm 'Add'",
            description: "Tap 'Add' in the top right corner to finish",
            icon: <ChevronRight className="text-emerald-500" size={24} />
        }
    ];

    const androidSteps = [
        {
            title: "Open Chrome",
            description: "Visit melachow.com in your Chrome browser",
            icon: <Chrome className="text-orange-500" size={24} />
        },
        {
            title: "Tap Menu",
            description: "Tap the three dots (⋮) in the top right corner",
            icon: <MoreVertical className="text-zinc-600 dark:text-zinc-400" size={24} />
        },
        {
            title: "Install App",
            description: "Select 'Install App' or 'Add to Home Screen'",
            icon: <Download className="text-orange-500" size={24} />
        },
        {
            title: "Confirm Install",
            description: "Follow the prompt to add the icon to your launcher",
            icon: <ShieldCheck className="text-emerald-500" size={24} />
        }
    ];

    const benefits = [
        {
            title: "Lightning Fast",
            description: "Instant loading and smooth navigation",
            icon: <Zap className="text-amber-500" size={20} strokeWidth={3} />,
            color: "bg-amber-50 dark:bg-amber-500/10"
        },
        {
            title: "Data Saving",
            description: "Uses 90% less data than native apps",
            icon: <Wifi className="text-emerald-500" size={20} strokeWidth={3} />,
            color: "bg-emerald-50 dark:bg-emerald-500/10"
        },
        {
            title: "Secure & Safe",
            description: "Encrypted and verified transactions",
            icon: <ShieldCheck className="text-blue-500" size={20} strokeWidth={3} />,
            color: "bg-blue-50 dark:bg-blue-500/10"
        }
    ];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 selection:bg-orange-500/30">
            {/* -- SEO Metadata handled in metadata.js or as a component if needed -- */}
            
            {/* 🎭 Premium Animated Header */}
            <header className="relative h-[40vh] min-h-[350px] flex items-center justify-center overflow-hidden bg-zinc-900">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#f97316_0%,transparent_70%)] blur-3xl transform -translate-y-1/2" />
                    <div className="grid grid-cols-6 h-full gap-4 p-4 opacity-10">
                        {[...Array(24)].map((_, i) => (
                            <div key={i} className="border border-white/10 rounded-2xl" />
                        ))}
                    </div>
                </div>

                <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6 backdrop-blur-md italic"
                    >
                        <Smartphone size={14} strokeWidth={3} />
                        Progressive Web App
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-6"
                    >
                        Get The <span className="text-orange-500">MelaChow</span> <br /> App Experience
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-zinc-400 text-sm md:text-base font-medium max-w-lg mx-auto leading-relaxed"
                    >
                        Order your favorite meals in seconds. No App Store needed. 
                        Install directly from your browser and start craving.
                    </motion.p>
                </div>

                {/* Floating Phone Graphic */}
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="absolute -bottom-1/2 left-1/2 -translate-x-1/2 w-64 h-64 bg-orange-500 rounded-full blur-[120px] opacity-20 pointer-events-none"
                />
            </header>

            {/* 🏗️ Main Content */}
            <main className="max-w-4xl mx-auto px-4 -mt-16 relative z-20">
                {/* 💳 Benefits Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    {benefits.map((benefit, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 group hover:border-orange-500/30 transition-all"
                        >
                            <div className={`${benefit.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                                {benefit.icon}
                            </div>
                            <div>
                                <h3 className="font-black text-zinc-900 dark:text-white text-sm uppercase italic leading-none mb-1">{benefit.title}</h3>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium leading-tight">{benefit.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* 📱 Installation Steps */}
                <div className="bg-white dark:bg-zinc-900 rounded-[48px] shadow-2xl shadow-zinc-200/50 dark:shadow-none border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                    {/* Tab Switcher */}
                    <div className="flex p-2 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                        <button
                            onClick={() => setActiveTab("ios")}
                            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[32px] transition-all duration-300 relative ${
                                activeTab === "ios" ? "text-zinc-900 dark:text-white" : "text-zinc-400"
                            }`}
                        >
                            {activeTab === "ios" && (
                                <motion.div layoutId="activeTab" className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-[32px] shadow-sm border border-zinc-100 dark:border-zinc-700" />
                            )}
                            <Apple size={20} className="relative z-10" />
                            <span className="relative z-10 font-black uppercase italic text-sm tracking-tight">iOS Guide</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("android")}
                            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[32px] transition-all duration-300 relative ${
                                activeTab === "android" ? "text-zinc-900 dark:text-white" : "text-zinc-400"
                            }`}
                        >
                            {activeTab === "android" && (
                                <motion.div layoutId="activeTab" className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-[32px] shadow-sm border border-zinc-100 dark:border-zinc-700" />
                            )}
                            <Smartphone size={20} className="relative z-10" />
                            <span className="relative z-10 font-black uppercase italic text-sm tracking-tight">Android Guide</span>
                        </button>
                    </div>

                    <div className="p-8 md:p-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            {/* Steps List */}
                            <div className="space-y-8">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tighter leading-none mb-2">
                                        Step-by-Step
                                    </h2>
                                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
                                        Installation is free and instant
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {(activeTab === "ios" ? iosSteps : androidSteps).map((step, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="flex gap-4 group"
                                        >
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-orange-500/10 group-hover:text-orange-500 transition-colors">
                                                    {step.icon}
                                                </div>
                                                {idx !== 3 && (
                                                    <div className="w-0.5 h-full bg-zinc-100 dark:bg-zinc-800 my-2" />
                                                )}
                                            </div>
                                            <div className="pt-1 pb-4">
                                                <h4 className="font-black text-zinc-900 dark:text-white text-sm uppercase italic mb-1">{step.title}</h4>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{step.description}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Visual Preview */}
                            <div className="relative">
                                <div className="absolute -inset-4 bg-orange-500/10 blur-[100px] rounded-full opacity-50" />
                                <motion.div
                                    key={activeTab}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative bg-zinc-100 dark:bg-zinc-800 aspect-[9/16] rounded-[48px] border-[8px] border-zinc-900 dark:border-zinc-700 shadow-2xl overflow-hidden group"
                                >
                                    {/* Mock Screen */}
                                    <div className="absolute inset-0 p-4 flex flex-col items-center justify-center bg-white dark:bg-zinc-950">
                                        <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-orange-500/20">
                                            <Smartphone size={32} className="text-white" />
                                        </div>
                                        <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-2" />
                                        <div className="h-2 w-32 bg-zinc-50 dark:bg-zinc-900 rounded-full" />
                                        
                                        {/* Dynamic UI Overlay based on step */}
                                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full px-6">
                                            <div className="bg-orange-500 h-10 rounded-xl flex items-center justify-center">
                                                <span className="text-[10px] font-black text-white uppercase italic">Add to Home Screen</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Device Notch */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 dark:bg-zinc-700 rounded-b-2xl" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🏁 Final CTA */}
                <div className="mt-20 text-center">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block"
                    >
                        <Link 
                            href="/home" 
                            className="flex items-center gap-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-10 py-5 rounded-[24px] font-black uppercase italic tracking-tighter shadow-2xl shadow-zinc-900/20 dark:shadow-white/10 group transition-all"
                        >
                            <span className="text-lg">Launch MelaChow Now</span>
                            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                                <ArrowRight size={20} className="text-white" />
                            </div>
                        </Link>
                    </motion.div>
                    <p className="mt-6 text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] italic">
                        No credit card required • Instant access
                    </p>
                </div>
            </main>

            {/* Footer Decorative Line */}
            <div className="mt-32 h-1 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
        </div>
    );
}
