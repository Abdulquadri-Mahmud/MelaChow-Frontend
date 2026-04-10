const baseUrl = 'https://www.melachow.com'

export default async function sitemap() {
  const now = new Date()

  // Static pages
  const staticRoutes = [
    { url: baseUrl,                           lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${baseUrl}/home`,                 lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${baseUrl}/all-restaurants`,      lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${baseUrl}/all-foods`,            lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${baseUrl}/search`,               lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${baseUrl}/trending-foods`,       lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${baseUrl}/trending-restaurants`, lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${baseUrl}/faqs`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://grubdash-api.onrender.com'

  // Dynamic: vendor/restaurant pages
  let vendorRoutes = []
  try {
    const res = await fetch(`${apiUrl}/v1/vendors/get-all`, {
      next: { revalidate: 3600 } 
    })
    if (res.ok) {
        const data = await res.json()
        vendorRoutes = (data?.vendors || []).map((v) => ({
          url: `${baseUrl}/restaurants/${v._id}`,
          lastModified: new Date(v.updatedAt || now),
          changeFrequency: 'weekly',
          priority: 0.8,
        }))
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch vendors', e)
  }

  // Dynamic: food detail pages
  let foodRoutes = []
  try {
    const res = await fetch(`${apiUrl}/v1/vendors/foods/get-foods`, {
      next: { revalidate: 3600 }
    })
    if (res.ok) {
        const data = await res.json()
        foodRoutes = (data?.data || []).map((f) => ({
          url: `${baseUrl}/food-details/${f._id}`,
          lastModified: new Date(f.updatedAt || now),
          changeFrequency: 'weekly',
          priority: 0.7,
        }))
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch foods', e)
  }

  // Dynamic: combo detail pages
  let comboRoutes = []
  try {
    const res = await fetch(`${apiUrl}/v1/menu/combos/all`, {
      next: { revalidate: 3600 }
    })
    if (res.ok) {
        const data = await res.json()
        comboRoutes = (data?.combos || []).map((c) => ({
          url: `${baseUrl}/combo-details/${c._id}?vendorId=${c.vendorId || c.vendor}`,
          lastModified: new Date(c.updatedAt || now),
          changeFrequency: 'weekly',
          priority: 0.7,
        }))
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch combos', e)
  }

  return [...staticRoutes, ...vendorRoutes, ...foodRoutes, ...comboRoutes]
}
