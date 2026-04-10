const baseUrl = 'https://www.melachow.com'

export default function sitemap() {
  const now = new Date()

  return [
    { url: baseUrl,                              lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${baseUrl}/home`,                    lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${baseUrl}/all-restaurants`,         lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${baseUrl}/all-foods`,               lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${baseUrl}/search`,                  lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${baseUrl}/trending-foods`,          lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${baseUrl}/trending-restaurants`,    lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${baseUrl}/faqs`,                    lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]
}
