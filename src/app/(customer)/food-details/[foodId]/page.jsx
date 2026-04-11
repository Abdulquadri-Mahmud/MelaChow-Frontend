import FoodDetailsClient from "./FoodDetailsClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://grubdash-api.onrender.com";

async function getFoodData(foodId) {
  try {
    const res = await fetch(`${API_URL}/v1/vendors/foods/${foodId}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching food data for SEO:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { foodId } = await params;
  const data = await getFoodData(foodId);
  const food = data?.food;

  if (!food) {
    return {
      title: "Food Details | MelaChow",
      description: "Order delicious Nigerian food online with MelaChow.",
    };
  }

  const title = `${food.name} | MelaChow`;
  const description = food.description || `Order ${food.name} from MelaChow. Fast and reliable food delivery in Nigeria.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: food.image_url || "/logo.jpeg",
          width: 800,
          height: 600,
          alt: food.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [food.image_url || "/logo.jpeg"],
    },
  };
}

export default async function Page({ params }) {
  const { foodId } = await params;
  const initialData = await getFoodData(foodId);

  return <FoodDetailsClient initialData={initialData} foodId={foodId} />;
}
