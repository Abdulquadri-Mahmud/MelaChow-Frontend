"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

export default function SplashScreen({ user, vendorDetails }) {
    const isAuthenticated = !!user || !!vendorDetails;

    const [loadingText, setLoadingText] = useState("Initializing experience...");
    const [progress, setProgress] = useState(15);

    // Realistic product-driven status messages
    useEffect(() => {
        const statuses = [
            "Locating nearby tastes...",
            "Curating local menus...",
            "Preparing your dashboard...",
        ];

        let index = 0;
        setLoadingText(statuses[0]);

        const interval = setInterval(() => {
            index = (index + 1) % statuses.length;
            setLoadingText(statuses[index]);
        }, 1600);

        // Smooth simulated progress bar fill
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 92) return 92;
                return prev + Math.floor(Math.random() * 15 + 8);
            });
        }, 300);

        return () => {
            clearInterval(interval);
            clearInterval(progressInterval);
        };
    }, []);

    // Update text based on auth status
    useEffect(() => {
        if (isAuthenticated) {
            setLoadingText("Welcome back!");
            setProgress(100);
        }
    }, [isAuthenticated]);

    return (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-between bg-gradient-to-b from-amber-50/60 via-white to-orange-50/40 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 overflow-hidden px-6 py-12 selection:bg-orange-500 selection:text-white">
            
            {/* Background Layer: Soft Ambient Radial Glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.35, 0.6, 0.35],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-gradient-to-tr from-amber-400/20 via-orange-500/25 to-red-500/15 rounded-full blur-[100px]"
                />
                <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.05] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
            </div>

            {/* Spacer Top */}
            <div className="h-4" />

            {/* Center Section: Official MelaChow Branding */}
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex flex-col items-center my-auto"
            >
                {/* Brand Logo Container with Glowing Glass Backdrop */}
                <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-48 h-32 sm:w-60 sm:h-40 flex items-center justify-center mb-4"
                >
                    <Image
                        src="/logo.png"
                        alt="MelaChow"
                        fill
                        sizes="(max-width: 640px) 192px, 240px"
                        className="object-contain drop-shadow-xl"
                        priority
                    />
                </motion.div>

                {/* Subtitle Badge */}
                <div className="flex items-center gap-2 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    <p className="text-[11px] font-black uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
                        Hot & Fresh • Delivered Fast
                    </p>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                </div>
            </motion.div>

            {/* Bottom Section: Progress & Signature Badge */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative z-10 w-full max-w-[300px] flex flex-col items-center space-y-5 mb-4"
            >
                {/* Progress Bar Container */}
                <div className="w-full space-y-2">
                    <div className="w-full h-1.5 bg-zinc-200/80 dark:bg-zinc-800 rounded-full overflow-hidden relative shadow-inner">
                        <motion.div
                            initial={{ width: "10%" }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full relative"
                        >
                            {/* Glowing trailing line pulse */}
                            <span className="absolute right-0 top-0 bottom-0 w-3 bg-white/80 blur-[2px] rounded-full animate-pulse" />
                        </motion.div>
                    </div>

                    {/* Dynamic Status Text */}
                    <div className="h-5 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={loadingText}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.25 }}
                                className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-600 dark:text-zinc-300 text-center"
                            >
                                {loadingText}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Signature Brand Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-zinc-900/90 border border-orange-200 dark:border-orange-500/30 rounded-full shadow-lg shadow-orange-500/10 backdrop-blur-md">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                    </span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">
                        ⚡ Speeding Hot & Fresh To You
                    </p>
                </div>
            </motion.div>

        </div>
    );
}
