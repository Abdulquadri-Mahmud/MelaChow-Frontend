import { cache } from 'react';
import RestaurantClient from "./RestaurantClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://grubdash-api.onrender.com";

const getFullMenu = cache(async (vendorId) => {
  try {
    const res = await fetch(`${API_URL}/v1/vendors/${vendorId}/menu`, {
      next: { revalidate: 15 },
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching vendor data for SEO:", error);
    return null;
  }
});

export async function generateMetadata({ params }) {
  const { vendorId } = await params;
  const data = await getFullMenu(vendorId);
  const vendor = data?.vendor;

  if (!vendor) {
    return {
      title: "Restaurant Menu | MelaChow",
      description: "Discover local restaurants and order food delivery on MelaChow.",
    };
  }

  const title = `${vendor.storeName} Menu & Delivery | MelaChow`;
  const description = `Order from ${vendor.storeName} on MelaChow. ${vendor.cuisineTypes?.join(", ") || "Delicious meals"} delivered to your doorstep in ${vendor.address?.city || "Nigeria"}.`;

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
          url: vendor.logo || "/logo.jpeg",
          width: 800,
          height: 600,
          alt: vendor.storeName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [vendor.logo || "/logo.jpeg"],
    },
  };
}

export default async function Page({ params }) {
  const { vendorId } = await params;
  const initialData = await getFullMenu(vendorId);

  return <RestaurantClient initialData={initialData} vendorId={vendorId} />;
}
