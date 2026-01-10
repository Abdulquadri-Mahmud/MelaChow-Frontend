"use client";

import React from "react";

export default function SplashScreen() {
    return (
        <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden font-display">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E0] to-[#FFD8A8]"></div>
            <div className="absolute inset-0 bg-african-pattern opacity-40"></div>

            <div className="relative flex flex-col items-center justify-center px-8 text-center">
                <div className="relative mb-8 animate-float">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150"></div>
                    <div className="relative z-10 p-6 bg-white/40 backdrop-blur-sm rounded-full shadow-[0_20px_50px_rgba(244,133,37,0.25)] border border-white/60">
                        <svg
                            className="h-28 w-28 text-primary drop-shadow-2xl"
                            fill="none"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 12 20 12C20 16.41 16.41 20 12 20Z"
                                fill="currentColor"
                                fillOpacity="0.15"
                            ></path>
                            <path
                                d="M12 5.5C8.96 5.5 6.5 7.96 6.5 11C6.5 12.44 7.07 13.75 8 14.71L14.71 8C13.75 7.07 12.44 6.5 11 6.5L12 5.5Z"
                                fill="#f48525"
                                stroke="#f48525"
                                strokeWidth="0.5"
                            ></path>
                            <path
                                d="M17.5 11C17.5 14.04 15.04 16.5 12 16.5C10.56 16.5 9.25 15.93 8.29 15L15 8.29C15.93 9.25 16.5 10.56 16.5 12L17.5 11Z"
                                fill="#f48525"
                            ></path>
                            <path d="M11 16.5V21L13 19.5L11 16.5Z" fill="#4CAF50"></path>
                        </svg>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                        <h1 className="text-brand-dark tracking-tight text-[48px] font-extrabold leading-none text-shadow-premium">
                            Grub<span className="text-primary">Dash</span>
                        </h1>
                    </div>
                    <div
                        className="animate-fade-in-up flex items-center justify-center space-x-3"
                        style={{ animationDelay: "0.6s" }}
                    >
                        <div className="h-[1px] w-8 bg-primary/30"></div>
                        <p className="text-brand-dark/80 text-lg font-medium italic font-serif">
                            Your Culinary Journey Begins Here
                        </p>
                        <div className="h-[1px] w-8 bg-primary/30"></div>
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
