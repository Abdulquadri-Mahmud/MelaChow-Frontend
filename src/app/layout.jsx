import { Geist, Geist_Mono, Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ApiProvider } from "./context/ApiContext";
import { SocketProvider } from "./context/SocketContext";
import QueryProvider from "./providers/QueryProvider";
import { Toaster } from "react-hot-toast";
import "@/app/lib/api"; // Register axios interceptors

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "arial"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  fallback: ["monospace"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  display: "swap",
  fallback: ["serif"],
});

export const viewport = {
  themeColor: "#ea580c",
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export const metadata = {
  title: {
    default: "MelaChow",
    template: "%s | MelaChow",
  },
  description:
    "MelaChow brings local flavors to your doorstep â€” discover and order delicious meals from trusted restaurants near you.",
  keywords: [
    "MelaChow",
    "food delivery",
    "restaurants",
    "local meals",
    "Nigeria food app",
    "order food online",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MelaChow",
  },
  openGraph: {
    title: "MelaChow — Local Meals Delivered Fast",
    description:
      "Discover, order, and enjoy fresh local dishes from trusted restaurants around you with MelaChow.",
    url: "https://melachow.vercel.app",
    siteName: "MelaChow",
    images: [
      {
        url: "/logo.jpeg",
        width: 1200,
        height: 630,
        alt: "MelaChow - Local Meals Delivered Fast",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MelaChow — Local Meals Delivered Fast",
    description:
      "Order delicious local dishes and get them delivered quickly with MelaChow.",
    images: ["/logo.jpeg"],
    creator: "@melachow_app",
  },
  metadataBase: new URL("https://melachow.vercel.app"),
};

import { ThemeProvider } from "./context/ThemeContext";
import InstallPWA from "./components/InstallPWA";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} ${playfairDisplay.variable} antialiased transition-colors duration-300`}>
        {/* ✅ ONLY base providers - no auth logic here */}
        <ThemeProvider>
          <ApiProvider>
            <QueryProvider>
              <SocketProvider>
                {children}
                <InstallPWA />
              </SocketProvider>
            </QueryProvider>
          </ApiProvider>
        </ThemeProvider>
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            // Define default options
            className: 'dark:bg-slate-800 dark:text-white',
            style: {
              borderRadius: '16px',
              fontFamily: 'var(--font-outfit)',
              fontSize: '14px',
              fontWeight: '600',
            },
          }}
        />
      </body>
    </html>
  );
}

// rmdir /s /q .next && npm run dev -- --turbopack

