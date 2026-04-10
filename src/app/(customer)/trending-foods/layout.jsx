export const metadata = {
  title: "Trending Foods — Most Popular Nigerian Dishes Right Now",
  description:
    "See what's trending on MelaChow. Discover the most ordered Nigerian foods in your city right now — jollof, suya, pepper soup, and more.",
  alternates: {
    canonical: "https://melachow.vercel.app/trending-foods",
  },
  openGraph: {
    title: "Trending Foods — MelaChow",
    description: "The most popular Nigerian dishes being ordered right now on MelaChow.",
    url: "https://melachow.vercel.app/trending-foods",
    images: [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "MelaChow Trending Foods" }],
  },
};

export default function TrendingFoodsLayout({ children }) {
  return children;
}
