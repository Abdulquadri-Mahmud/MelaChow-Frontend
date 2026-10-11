"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Capacitor, SystemBarType, SystemBars, SystemBarsStyle } from "@capacitor/core";

const splashArtwork = process.env.NEXT_PUBLIC_MOBILE_BUILD === "true"
  ? "/melachow-vendor-splash-clean.png"
  : "/melachow-splash-clean.png";

export default function SplashScreen({ startupError = false, onRetry }) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    // Keep the status bar visible and stable throughout startup. LIGHT means
    // dark (black) system icons over the light status-bar surface.
    Promise.all([
      SystemBars.show({ bar: SystemBarType.StatusBar }),
      SystemBars.show({ bar: SystemBarType.NavigationBar }),
      SystemBars.setStyle({ bar: SystemBarType.StatusBar, style: SystemBarsStyle.Light }),
      SystemBars.setStyle({ bar: SystemBarType.NavigationBar, style: SystemBarsStyle.Light }),
    ]).catch((error) => console.warn("Could not prepare splash status bar:", error));
  }, []);

  return (
    <main
      className="fixed inset-0 z-[10000] overflow-hidden bg-[#fff9ea]"
      aria-label="MelaChow"
      style={{ backgroundImage: `url(${splashArtwork})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <Image
        src={splashArtwork}
        alt="MelaChow food delivery"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {startupError ? (
        <div className="absolute inset-x-5 bottom-12 mx-auto max-w-sm rounded-2xl bg-white/95 p-4 text-center shadow-xl">
          <p className="text-sm font-semibold text-zinc-900">We couldn’t connect to MelaChow.</p>
          <p className="mt-1 text-xs text-zinc-600">Check your connection and try again.</p>
          <button type="button" onClick={onRetry} className="mt-3 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white">
            Retry
          </button>
        </div>
      ) : (
        <div className="native-startup-dots" role="status" aria-label="Opening MelaChow">
          <span />
          <span />
          <span />
        </div>
      )}
    </main>
  );
}
