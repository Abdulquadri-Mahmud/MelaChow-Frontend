"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { useVendorStorage } from "@/app/hooks/vendorStorage";

export default function SplashScreen({ onComplete }) {
    const { user, isLoading: isUserLoading } = useUserStorage();
    const { vendorDetails, isLoading: isVendorLoading } = useVendorStorage();
    const [loadingText, setLoadingText] = useState("Initializing experience...");
    const [showNextStep, setShowNextStep] = useState(false);

    // Determine if user is authenticated
    const isAuthenticated = !!user || !!vendorDetails;
    const isLoading = isUserLoading || isVendorLoading;

    // Cycle through realistic product-driven statuses
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
        }, 1800);

        // Show "Next Step" cue after a delay for engagement
        const nextStepTimer = setTimeout(() => {
            setShowNextStep(true);
        }, 2500);

        return () => {
            clearInterval(interval);
            clearTimeout(nextStepTimer);
        };
    }, []);

    // Effect to handle splash dismissal logic based on auth state
    // Note: The parent ClientLayout controls the hard unmount, but we can influence animations here or visual cues.
    // Ideally, ClientLayout should pass down 'onComplete' or we rely on the timer there.
    // Given the constraints to preserve existing logic, we assume ClientLayout handles the unmount timer.
    // However, we can adapt the visual message based on state immediately.

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                setLoadingText("Welcome back!");
            } else {
                setLoadingText("Discover food around you");
            }
        }
    }, [isAuthenticated, isLoading]);

    const dotVariants = {
        initial: { y: 0, opacity: 0.4 },
        animate: {
            y: [0, -12, 0],
            opacity: [0.4, 1, 0.4],
            transition: {
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
            },
        },
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.4 // Slightly faster start
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 120, damping: 14 }
        },
    };

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-zinc-950 overflow-hidden">
            {/* Top Half - Stylized Hero Image */}
            <motion.div
                initial={{ height: "100%" }}
                animate={{ height: "55%" }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full overflow-hidden rounded-b-[60px] shadow-2xl z-20"
            >
                <motion.img
                    initial={{ scale: 1.2, filter: "blur(10px)" }}
                    animate={{ scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    src="/splashscreen.jpg"
                    alt="GrubDash Experience"
                    className="w-full h-full object-cover"
                />
                {/* Advanced Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-orange-600/10 mix-blend-overlay" />
            </motion.div>

            {/* Bottom Half - Premium Content */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex-1 flex flex-col items-center justify-center px-10 relative z-10 -mt-10"
            >
                {/* Visual Accent */}
                <motion.div variants={itemVariants} className="w-12 h-1 bg-orange-600 rounded-full mb-8" />

                {/* Main Branding */}
                <motion.div variants={itemVariants} className="text-center space-y-2">
                    <h1 className="text-5xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white leading-none">
                        Grub<span className="text-orange-600">Dash</span>
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-600/80 pl-1">
                        Local Food Discovery
                    </p>
                </motion.div>

                {/* Catchy Description */}
                <motion.div variants={itemVariants} className="mt-8 text-center max-w-[280px]">
                    <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 leading-tight">
                        Authentic Local <span className="italic text-orange-600">Flavors.</span>
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                        Connecting you with the best nearby vendors and hidden gems in your city.
                    </p>
                </motion.div>

                {/* High-Fidelity 3-Dot Loader */}
                <motion.div variants={itemVariants} className="mt-12 flex flex-col items-center gap-6 w-full">
                    <div className="flex gap-3">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                variants={dotVariants}
                                initial="initial"
                                animate="animate"
                                transition={{
                                    animate: {
                                        delay: i * 0.15,
                                    },
                                }}
                                className="w-2.5 h-2.5 bg-orange-600 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                            />
                        ))}
                    </div>

                    {/* Progress Indicator Metadata */}
                    <div className="flex flex-col items-center gap-2 min-h-[30px]">
                        <motion.div
                            key={loadingText} // Animate text change
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-2"
                        >
                            <div className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                {loadingText}
                            </span>
                            <div className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                        </motion.div>

                        {/* Optional Next Step Indicator */}
                        {showNextStep && !isAuthenticated && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[8px] text-orange-500 font-bold uppercase tracking-widest mt-1"
                            >
                                Get Ready to Explore
                            </motion.span>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* Subtle Decorative Elements */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-100 dark:via-zinc-800 to-transparent pointer-events-none" />
        </div>
    );
}
