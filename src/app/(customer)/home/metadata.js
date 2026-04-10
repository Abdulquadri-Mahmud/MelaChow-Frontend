// Per-page metadata for the home feed
// Note: page.jsx is "use client" so metadata is exported from this file
export const metadata = {
  title: "Home — Order Food Near You",
  description:
    "Browse restaurants and dishes near you on MelaChow. Order jollof rice, suya, amala, soups, and more from trusted local Nigerian restaurants.",
  alternates: {
    canonical: "https://melachow.vercel.app/home",
  },
  openGraph: {
    title: "MelaChow — Order Food Near You",
    description:
      "Discover local Nigerian restaurants and order your favourite meals for fast delivery to your doorstep.",
    url: "https://melachow.vercel.app/home",
    images: [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "MelaChow Home" }],
  },
};
