export const metadata = {
  title: "Search Foods & Restaurants",
  description:
    "Search for your favourite Nigerian meals, dishes, or restaurants on MelaChow. Fast, accurate results with instant delivery options.",
  alternates: {
    canonical: "https://www.melachow.com/search",
  },
  robots: {
    index: false, // Search result pages should not be indexed — not canonical
    follow: true,
  },
};

export default function SearchLayout({ children }) {
  return children;
}
