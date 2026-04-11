import ComboDetailsClient from "./ComboDetailsClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://grubdash-api.onrender.com";

async function getComboData(comboId) {
  try {
    const res = await fetch(`${API_URL}/v1/menu/combos/${comboId}`, {
      next: { revalidate: 3600 },
    });

    console.log(res);
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching combo data for SEO:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { comboId } = await params;
  const data = await getComboData(comboId);
  const combo = data?.combo;

  if (!combo) {
    return {
      title: "Combo Deal | MelaChow",
      description: "Great value food combos on MelaChow. Order now!",
    };
  }

  const title = `${combo.name} | MelaChow`;
  const description = combo.description || `Order the ${combo.name} combo bundle from MelaChow. Great value Nigerian meals delivered fast.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: combo.image_url || "/logo.jpeg",
          width: 800,
          height: 600,
          alt: combo.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [combo.image_url || "/logo.jpeg"],
    },
  };
}

export default async function Page({ params }) {
  const { comboId } = await params;
  const initialData = await getComboData(comboId);

  return <ComboDetailsClient initialData={initialData} comboId={comboId} />;
}
