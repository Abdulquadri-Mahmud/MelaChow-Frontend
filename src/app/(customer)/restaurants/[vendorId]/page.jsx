import RestaurantClient from "./RestaurantClient";

export async function generateMetadata({ params }) {
  const { vendorId } = await params;
  const title = "Restaurant Menu & Delivery | MelaChow";
  const description = "Browse restaurant menus and order fresh meals for delivery with MelaChow.";

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.melachow.com/restaurants/${vendorId}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.melachow.com/restaurants/${vendorId}`,
      images: [
        {
          url: "/logo.jpeg",
          width: 800,
          height: 600,
          alt: "MelaChow",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/logo.jpeg"],
    },
  };
}

export default async function Page({ params }) {
  const { vendorId } = await params;
  return <RestaurantClient vendorId={vendorId} />;
}
