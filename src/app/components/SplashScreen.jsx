"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Capacitor, SystemBarType, SystemBars, SystemBarsStyle } from "@capacitor/core";
import { Animation, StatusBar, Style as StatusBarStyle } from "@capacitor/status-bar";

const splashArtwork = process.env.NEXT_PUBLIC_MOBILE_BUILD === "true"
  ? "/melachow-vendor-splash-clean.png"
  : "/melachow-splash-clean.png";

export default function SplashScreen() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    // Keep the status bar visible and stable throughout startup. LIGHT means
    // dark (black) system icons over the light status-bar surface.
    Promise.all([
      StatusBar.show({ animation: Animation.None }),
      StatusBar.setStyle({ style: StatusBarStyle.Light }),
      SystemBars.show({ bar: SystemBarType.StatusBar }),
      SystemBars.setStyle({ bar: SystemBarType.StatusBar, style: SystemBarsStyle.Light }),
    ]).catch((error) => console.warn("Could not prepare splash status bar:", error));
  }, []);

  return (
    <main
      className="fixed inset-0 z-[10000] overflow-hidden bg-[#fff9ea]"
      aria-label="MelaChow"
    >
      <Image
        src={splashArtwork}
        alt="MelaChow food delivery"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="native-startup-dots" role="status" aria-label="Opening MelaChow">
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}
