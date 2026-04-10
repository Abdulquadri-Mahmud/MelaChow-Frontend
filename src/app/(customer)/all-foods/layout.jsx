export const metadata = {
  title: "All Foods — Browse Nigerian Dishes & Meals",
  description:
    "Explore hundreds of Nigerian dishes on MelaChow. From jollof rice and egusi soup to suya, pounded yam, and pepper soup — order your cravings delivered.",
  alternates: {
    canonical: "https://melachow.vercel.app/all-foods",
  },
  openGraph: {
    title: "All Foods — MelaChow",
    description:
      "Hundreds of delicious Nigerian meals available for order and delivery on MelaChow.",
    url: "https://melachow.vercel.app/all-foods",
    images: [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "MelaChow All Foods" }],
  },
};

export default function AllFoodsLayout({ children }) {
  return children;
}
