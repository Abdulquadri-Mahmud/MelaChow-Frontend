import RestaurantClient from "./RestaurantClient";

const API_URL = "https://grubdash-api.onrender.com";

async function getVendorData(vendorId) {
  try {
    const res = await fetch(`${API_URL}/v1/vendors/${vendorId}/menu`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.vendor || null;
  } catch (error) {
    console.error("Error fetching vendor data for SEO:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { vendorId } = params;
  const vendor = await getVendorData(vendorId);

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
    openGraph: {
      title,
      description,
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
  const { vendorId } = params;
  const initialData = await fetch(`${API_URL}/v1/vendors/${vendorId}/menu`, {
    next: { revalidate: 3600 },
  }).then(res => res.ok ? res.json() : null).catch(() => null);

  return <RestaurantClient initialData={initialData} vendorId={vendorId} />;
}
