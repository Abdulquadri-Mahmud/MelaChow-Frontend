import InstallClient from "./InstallClient";

export const metadata = {
  title: "How to Install MelaChow on iOS & Android | Fast Food Delivery App",
  description: "Get the fastest food ordering experience in Nigeria. Learn how to install the MelaChow app on your iPhone or Android device without using the App Store or Play Store.",
  keywords: ["install melachow", "pwa installation", "order food online nigeria", "ios home screen app", "android pwa guide"],
  openGraph: {
    title: "Install MelaChow - Fastest Food Delivery Experience",
    description: "Add MelaChow to your home screen for instant access to top restaurants and amazing deals.",
    images: ["/og-install.jpg"], 
    type: "website",
    siteName: "MelaChow",
  },
  twitter: {
    card: "summary_large_image",
    title: "Install MelaChow | Fast & Data-Saving",
    description: "The better way to order food. Install the MelaChow PWA today.",
  },
  alternates: {
    canonical: "https://melachow.com/install",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function Page() {
  return <InstallClient />;
}
