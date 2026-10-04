"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Capacitor, SystemBarType, SystemBars, SystemBarsStyle } from "@capacitor/core";
import { StatusBar } from "@capacitor/status-bar";

export default function SplashScreen() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    Promise.all([
      SystemBars.hide(),
      StatusBar.hide(),
    ]).catch(() => {});
    return () => {
      Promise.all([
        SystemBars.show(),
        SystemBars.setStyle({ bar: SystemBarType.StatusBar, style: SystemBarsStyle.Light }),
        SystemBars.setStyle({ bar: SystemBarType.NavigationBar, style: SystemBarsStyle.Light }),
        StatusBar.show(),
        StatusBar.setBackgroundColor({ color: "#ffffff" }),
      ]).catch(() => {});
    };
  }, []);

  return (
    <main
      className="fixed inset-0 z-[10000] overflow-hidden bg-[#fff9ea]"
      aria-label="MelaChow"
    >
      <Image
        src="/melachow-splash-clean.png"
        alt="MelaChow food delivery"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
    </main>
  );
}
