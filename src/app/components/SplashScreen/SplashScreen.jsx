"use client";

import GrubDashLogo from "@/app/GrubDashLogo/GrubDashLogo";

export default function SplashScreen() {
  return (
    <div className=" fixed inset-0 bg-gray-50 flex items-center justify-center overflow-auto flex w-full flex-col items-center justify-center">
      {/* Background Overlay */}
      

      {/* Center Content */}
      <div className="relative flex flex-col items-center justify-center space-y-4">
        {/* Logo Animation */}

        <GrubDashLogo />

        {/* Title */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "0.5s" }}
        >
          <h1 className="text-background-dark dark:text-background-light tracking-light text-[32px] font-bold leading-tight px-4 text-center">
            GrubDash
          </h1>
        </div>

        {/* Subtitle */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "1s" }}
        >
          <p className="text-background-dark/70 font-semibold dark:text-background-light/70 text-base text-gray-600 leading-normal px-4 text-center">
            Your Culinary Journey Begins Here
          </p>
        </div>
      </div>
    </div>
  );
}
