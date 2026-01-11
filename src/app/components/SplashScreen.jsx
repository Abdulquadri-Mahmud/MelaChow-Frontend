"use client";

import { motion } from "framer-motion";

export default function SplashScreen() {
    return (
        <div className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden font-display bg-black">
            {/* Background Image with High-Fidelity Entrance */}
            <motion.div
                initial={{ scale: 1.15, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.85 }}
                transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 z-0"
            >
                <img
                    src="/splashscreen.jpg"
                    alt="Culinary Atmosphere"
                    className="w-full h-full object-cover"
                />
                {/* Softened Atmospheric Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
            </motion.div>

            {/* Glassmorphism Grain Overlay */}
            <div className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Content Center Container */}
            <div className="relative z-10 flex flex-col items-center justify-center px-10 text-center w-full max-w-lg">

                {/* Animated Brand Identity */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="mb-2"
                >
                    <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none shadow-2xl">
                        Grub<span className="text-orange-600">Dash</span>
                    </h1>
                </motion.div>

                {/* Dynamic Accents */}
                <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "80px", opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.8, ease: "circOut" }}
                    className="h-[2px] bg-orange-600 rounded-full mb-8"
                />

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1 }}
                    className="space-y-1 mb-16"
                >
                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.5em] italic">
                        Your Culinary Journey Begins Here
                    </p>
                </motion.div>

                {/* Sophisticated Bouncing Dots Loading */}
                <div className="flex items-center justify-center gap-3">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ y: 0, opacity: 0.2 }}
                            animate={{ y: [-10, 0], opacity: [1, 0.2] }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                repeatType: "reverse",
                                delay: i * 0.15,
                                ease: "easeInOut"
                            }}
                            className="w-3.5 h-3.5 rounded-full bg-orange-600 shadow-[0_0_20px_rgba(234,88,12,0.6)]"
                        />
                    ))}
                </div>
            </div>

            {/* Minimalist Footer Branding */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, delay: 1.5 }}
                className="absolute bottom-12 flex flex-col items-center gap-6"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-[1px] bg-white/10" />
                    <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.6em]">Premium Experience</p>
                    <div className="w-12 h-[1px] bg-white/10" />
                </div>
            </motion.div>

            {/* High-Impact Ambient Light FX */}
            <div className="absolute -top-1/3 -left-1/4 w-[60%] h-[60%] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse" />
            <div className="absolute -bottom-1/3 -right-1/4 w-[60%] h-[60%] bg-orange-600/5 blur-[150px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

            {/* Subtle Scanline Effect */}
            <div className="absolute inset-0 w-full h-full pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] z-[5]" />
        </div>
    );
}
