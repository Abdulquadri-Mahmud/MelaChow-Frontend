"use client";

import React from "react";
import { motion } from "framer-motion";

export default function SplashScreen() {
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
                delayChildren: 0.6
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
                        Premium Delivery
                    </p>
                </motion.div>

                {/* Catchy Description */}
                <motion.div variants={itemVariants} className="mt-8 text-center max-w-[280px]">
                    <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 leading-tight">
                        Crave it. Order it. <span className="italic text-orange-600">Enjoy it.</span>
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                        Experience the gold standard of local food delivery at your fingertips.
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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="flex items-center gap-2"
                    >
                        <div className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-600">
                            Connecting to Gourmet Servers
                        </span>
                        <div className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Subtle Decorative Elements */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-100 dark:via-zinc-800 to-transparent pointer-events-none" />
        </div>
    );
}
