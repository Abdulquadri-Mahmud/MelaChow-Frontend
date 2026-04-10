export const metadata = {
  title: "All Restaurants — Find Local Nigerian Restaurants Near You",
  description:
    "Browse all local restaurants on MelaChow. Find trusted Nigerian eateries near you offering jollof rice, suya, soups, and more with fast delivery.",
  alternates: {
    canonical: "https://melachow.vercel.app/all-restaurants",
  },
  openGraph: {
    title: "All Restaurants — MelaChow",
    description:
      "Explore every restaurant available on MelaChow and order your favourite Nigerian meals delivered fast.",
    url: "https://melachow.vercel.app/all-restaurants",
    images: [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "MelaChow Restaurants" }],
  },
};

export default function AllRestaurantsLayout({ children }) {
  return children;
}
