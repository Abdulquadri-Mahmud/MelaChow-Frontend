"use client";

import GrubDashLogo from "@/app/GrubDashLogo/GrubDashLogo";

export default function SplashScreen() {
    return (
        <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden font-display">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E0] to-[#FFD8A8]"></div>
            <div className="absolute inset-0 bg-african-pattern opacity-40"></div>

            <div className="relative flex flex-col items-center justify-center px-8 text-center">
                <div className="relative mb-12 animate-float">
                    <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-150"></div>
                    <div className="relative z-10 p-10 bg-white/40 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(244,133,37,0.15)] border border-white/60 transition-all">
                        <GrubDashLogo />
                    </div>
                </div>

                <div className="space-y-5">
                    <div
                        className="animate-fade-in-up flex items-center justify-center space-x-3"
                        style={{ animationDelay: "0.6s" }}
                    >
                        <div className="h-[1px] w-10 bg-primary/30"></div>
                        <p className="text-brand-dark/80 text-xl font-medium italic font-serif tracking-wide">
                            Your Culinary Journey Begins Here
                        </p>
                        <div className="h-[1px] w-10 bg-primary/30"></div>
                    </div>
                </div>
            </div>


            <div className="absolute bottom-16 w-full flex justify-center animate-pulse-subtle">
                <div className="flex space-x-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
                </div>
            </div>
        </div>
    );
}
