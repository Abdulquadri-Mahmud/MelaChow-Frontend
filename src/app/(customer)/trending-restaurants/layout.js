export const metadata = {
  title: "Trending Restaurants — Most Popular Restaurants Near You",
  description:
    "Discover the most popular and highest-rated restaurants on MelaChow right now. Order from the best Nigerian eateries near you.",
  alternates: {
    canonical: "https://www.melachow.com/trending-restaurants",
  },
  openGraph: {
    title: "Trending Restaurants — MelaChow",
    description:
      "The most popular restaurants on MelaChow right now. Find top-rated Nigerian eateries and order fast.",
    url: "https://www.melachow.com/trending-restaurants",
    images: [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "MelaChow Trending Restaurants" }],
  },
};

export default function TrendingRestaurantsLayout({ children }) {
  return children;
}
