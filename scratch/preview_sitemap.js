const API_URL = "https://grubdash-api.onrender.com";
const baseUrl = "https://www.melachow.com";

async function generateSitemapXML() {
  const now = new Date().toISOString();

  // 1. Static Routes
  const staticRoutes = [
    "",
    "/home",
    "/all-restaurants",
    "/all-foods",
    "/search",
    "/trending-foods",
    "/trending-restaurants",
    "/faqs"
  ].map(path => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    priority: path === "" || path === "/home" ? "1.0" : "0.8"
  }));

  // 2. Dynamic Vendors
  let vendorRoutes = [];
  try {
    const res = await fetch(`${API_URL}/v1/vendors/get-all`);
    if (res.ok) {
      const data = await res.json();
      vendorRoutes = (data?.vendors || []).map(v => ({
        url: `${baseUrl}/restaurants/${v._id}`,
        lastModified: v.updatedAt || now,
        priority: "0.8"
      }));
    }
  } catch (e) { console.error("Error fetching vendors", e); }

  // 3. Dynamic Foods
  let foodRoutes = [];
  try {
    const res = await fetch(`${API_URL}/v1/vendors/foods/get-foods`);
    if (res.ok) {
      const data = await res.json();
      foodRoutes = (data?.data || []).map(f => ({
        url: `${baseUrl}/food-details/${f._id}`,
        lastModified: f.updatedAt || now,
        priority: "0.7"
      }));
    }
  } catch (e) { console.error("Error fetching foods", e); }

  const allRoutes = [...staticRoutes, ...vendorRoutes, ...foodRoutes];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  allRoutes.forEach(route => {
    xml += `  <url>\n`;
    xml += `    <loc>${route.url}</loc>\n`;
    xml += `    <lastmod>${route.lastModified}</lastmod>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;
  return xml;
}

generateSitemapXML().then(xml => {
  console.log(xml);
});
