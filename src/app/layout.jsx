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
  metadataBase: new URL("https://www.melachow.com"),

  verification: {
    google: "dDaMQbK3bEMaCansUdJKYJaNmvytgcnsOMKeZ8HNQjg",
  },

  // ── Core ──────────────────────────────────────────────────────────────
  title: {
    default: "MelaChow — Nigerian Food Delivery, Order Local Meals Online",
    template: "%s | MelaChow",
  },
  description:
    "MelaChow is Nigeria's premier food delivery platform. Order jollof rice, suya, amala, pounded yam, and more from trusted local restaurants. Fast delivery, great prices.",
  keywords: [
    "MelaChow",
    "Nigerian food delivery",
    "order food online Nigeria",
    "jollof rice delivery",
    "local meals Nigeria",
    "food near me Nigeria",
    "restaurant delivery Nigeria",
    "Lagos food delivery",
    "Abuja food delivery",
    "African food delivery",
    "suya delivery",
    "amala delivery",
    "pounded yam delivery",
    "fast food delivery Nigeria",
    "online food ordering Nigeria",
    "best food app Nigeria",
    "restaurant app Nigeria",
    "local restaurant delivery",
    "MelaChow app",
    "food delivery app Nigeria",
  ],

  // ── Canonical & Alternates ─────────────────────────────────────────────
  alternates: {
    canonical: "https://www.melachow.com",
  },

  // ── Robots ────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Icons ─────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/logo.jpeg", type: "image/jpeg" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/logo.jpeg",
  },

  // ── PWA / Apple Web App ───────────────────────────────────────────────
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MelaChow",
    startupImage: [
      { url: "/logo.jpeg" },
    ],
  },

  // ── Open Graph ────────────────────────────────────────────────────────
  openGraph: {
    title: "MelaChow — Nigerian Food Delivery, Order Local Meals Online",
    description:
      "Discover and order delicious Nigerian meals from trusted local restaurants. Jollof rice, suya, amala, soups, and more — delivered fast to your door.",
    url: "https://www.melachow.com",
    siteName: "MelaChow",
    images: [
      {
        url: "/logo.jpeg",
        width: 1200,
        height: 630,
        alt: "MelaChow — Nigerian Food Delivery App",
        type: "image/jpeg",
      },
    ],
    locale: "en_NG",
    alternateLocale: ["en_US", "en_GB"],
    type: "website",
    countryName: "Nigeria",
  },

  // ── Twitter / X ───────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "MelaChow — Nigerian Food Delivery, Order Local Meals Online",
    description:
      "Order jollof rice, suya, amala, and more from trusted Nigerian restaurants. Fast delivery with MelaChow.",
    images: [
      {
        url: "/logo.jpeg",
        alt: "MelaChow — Nigerian Food Delivery App",
      },
    ],
    creator: "@melachow_app",
    site: "@melachow_app",
  },

  // ── Category & Classification ─────────────────────────────────────────
  category: "food & dining",
  classification: "Food Delivery Service",

  // ── App Links (deep linking for mobile apps) ──────────────────────────
  appLinks: {
    web: {
      url: "https://www.melachow.com",
      should_fallback: true,
    },
  },
};


import { ThemeProvider } from "./context/ThemeContext";
import InstallPWA from "./components/InstallPWA";
import JsonLd from "./components/JsonLd";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MelaChow",
  url: "https://www.melachow.com",
  logo: "https://www.melachow.com/logo.jpeg",
  description: "MelaChow is Nigeria's premier food delivery platform connecting customers with trusted local restaurants.",
  sameAs: [
    "https://twitter.com/melachow_app",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    availableLanguage: "English",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "MelaChow",
  url: "https://www.melachow.com",
  description: "Order Nigerian food online from trusted local restaurants. Fast delivery of jollof rice, suya, amala, soups and more.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://www.melachow.com/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const foodServiceSchema = {
  "@context": "https://schema.org",
  "@type": "FoodService",
  name: "MelaChow",
  description: "Nigerian food delivery platform connecting customers with local restaurants.",
  url: "https://www.melachow.com",
  logo: "https://www.melachow.com/logo.jpeg",
  image: "https://www.melachow.com/logo.jpeg",
  areaServed: {
    "@type": "Country",
    name: "Nigeria",
  },
  serviceType: "Food Delivery",
  availableChannel: {
    "@type": "ServiceChannel",
    serviceUrl: "https://www.melachow.com",
    serviceType: "Online",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Nigerian Meals & Restaurants",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} ${playfairDisplay.variable} antialiased transition-colors duration-300`}>
        {/* ── Structured Data ─────────────────────────────────────── */}
        <JsonLd data={[organizationSchema, websiteSchema, foodServiceSchema]} />
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

