"use client";

import { motion } from "framer-motion";

export default function SplashScreen() {
  return (
    <div className="relative h-screen w-full flex flex-col items-center overflow-hidden font-display bg-white dark:bg-zinc-950">
      
      {/* Upper Hero Section - Mobile App Onboarding Style */}
      <div className="relative w-full h-[60vh] overflow-hidden">
        <motion.div
           initial={{ scale: 1.1 }}
           animate={{ scale: 1 }}
           transition={{ duration: 1.5, ease: "easeOut" }}
           className="w-full h-full"
        >
          <img 
            src="/splashscreen.jpg" 
            alt="Delicious Food" 
            className="w-full h-full object-cover"
          />
          {/* subtle gradient at the bottom to blend into content */}
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-950 via-transparent to-transparent h-full w-full" />
        </motion.div>
        
        {/* Abstract Floating Element */}
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-10 w-24 h-24 bg-orange-500/20 blur-3xl rounded-full" 
        />
      </div>

      {/* Content Section - The "Onboarding" feel */}
      <div className="relative flex flex-col items-center justify-between flex-1 w-full px-8 pb-16 -mt-20 z-10">
        
        {/* Brand & Message */}
        <div className="flex flex-col items-center text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white italic uppercase tracking-tighter">
              Grub<span className="text-orange-600">Dash</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 leading-tight">
              Fastest Delivery <br /> to your <span className="text-orange-600">Doorstep</span>
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium max-w-[280px] leading-relaxed">
              Order from the best local restaurants with ease and enjoy premium flavors at home.
            </p>
          </motion.div>
        </div>

        {/* Bottom Navigation / Loading indicator */}
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Onboarding Dot Indicators (Replaced Bouncing with Step style) */}
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ width: i === 1 ? 24 : 8 }}
                animate={{ 
                  width: i === 1 ? 24 : 8,
                  backgroundColor: i === 1 ? "#ea580c" : "#e4e4e7" // orange-600 or zinc-200
                }}
                className={`h-2 rounded-full transition-all duration-300`}
              />
            ))}
          </div>

          {/* Secondary subtle bouncing dots for actual activity signal */}
          <div className="flex gap-1.5 items-center bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-100 dark:border-zinc-800">
             <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mr-2">Preparing Experience</span>
             <motion.div 
               animate={{ scale: [1, 1.2, 1] }} 
               transition={{ duration: 1, repeat: Infinity }} 
               className="w-1.5 h-1.5 rounded-full bg-orange-600" 
             />
             <motion.div 
               animate={{ scale: [1, 1.2, 1] }} 
               transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} 
               className="w-1.5 h-1.5 rounded-full bg-orange-600" 
             />
             <motion.div 
               animate={{ scale: [1, 1.2, 1] }} 
               transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} 
               className="w-1.5 h-1.5 rounded-full bg-orange-600" 
             />
          </div>
        </div>
      </div>

      {/* Modern App Bottom Shade */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}
