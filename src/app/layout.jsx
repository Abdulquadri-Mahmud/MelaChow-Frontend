import { Geist, Geist_Mono, Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ApiProvider } from "./context/ApiContext";
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

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
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
    default: "GrubDash",
    template: "%s | GrubDash",
  },
  description:
    "GrubDash brings local flavors to your doorstep — discover and order delicious meals from trusted restaurants near you.",
  keywords: [
    "GrubDash",
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
    title: "GrubDash",
  },
  openGraph: {
    title: "GrubDash — Local Meals Delivered Fast",
    description:
      "Discover, order, and enjoy fresh local dishes from trusted restaurants around you with GrubDash.",
    url: "https://grub-dash-ten.vercel.app",
    siteName: "GrubDash",
    images: [
      {
        url: "https://res.cloudinary.com/dypn7gna0/image/upload/v1759974189/logo2_smrufe.png",
        width: 1200,
        height: 630,
        alt: "GrubDash - Local Meals Delivered Fast",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GrubDash — Local Meals Delivered Fast",
    description:
      "Order delicious local dishes and get them delivered quickly with GrubDash.",
    images: [
      "https://res.cloudinary.com/dypn7gna0/image/upload/v1759974189/logo2_smrufe.png",
    ],
    creator: "@grubdash_app",
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
    other: [
      {
        rel: 'apple-touch-icon',
        url: '/icons/icon-192x192.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '512x512',
        url: '/icons/icon-512x512.png',
      },
    ],
  },
  metadataBase: new URL("https://grubdash.vercel.app"),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} ${playfairDisplay.variable} antialiased`}>
        {/* ✅ ONLY base providers - no auth logic here */}
        <ApiProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </ApiProvider>
        <Toaster position="top-right" reverseOrder={false} />
      </body>
    </html>
  );
}

// rmdir /s /q .next && npm run dev -- --turbopack