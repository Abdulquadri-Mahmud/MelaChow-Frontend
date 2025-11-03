import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ApiProvider } from "./context/ApiContext";
import QueryProvider from "./providers/QueryProvider";
import { ProfileProvider } from "./context/ProfileContext";
import AutoLogout from "./auto-logout/AutoLogout";
import VendorsAutoLogout from "./auto-logout/VendorAutoLogout";
import ConditionalBottomNav from "./components/conditional_bottom_nav/ConditionalBottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    icon: "/logo.png",
  },
  metadataBase: new URL("https://grubdash.vercel.app"),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ApiProvider>
          <QueryProvider>
            <ProfileProvider>{children}</ProfileProvider>
          </QueryProvider>
        </ApiProvider>
        <AutoLogout />
        <VendorsAutoLogout />
        {/* 👇 This handles route-specific navbar visibility */}
        <ConditionalBottomNav />
      </body>
    </html>
  );
}