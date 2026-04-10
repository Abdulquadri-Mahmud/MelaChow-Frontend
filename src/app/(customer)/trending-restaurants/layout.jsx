export const metadata = {
  title: "Trending Restaurants — Most Popular Eateries Near You",
  description:
    "Discover the most popular restaurants on MelaChow right now. Trusted Nigerian eateries with great reviews, fast delivery, and delicious menus.",
  alternates: {
    canonical: "https://www.melachow.com/trending-restaurants",
  },
  openGraph: {
    title: "Trending Restaurants — MelaChow",
    description: "The most popular Nigerian restaurants being ordered from right now on MelaChow.",
    url: "https://www.melachow.com/trending-restaurants",
    images: [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "MelaChow Trending Restaurants" }],
  },
};

export default function TrendingRestaurantsLayout({ children }) {
  return children;
}
