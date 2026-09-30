import { Geolocation } from "@capacitor/geolocation";

export async function getDeliveryPosition() {
  try {
    const permission = await Geolocation.checkPermissions();
    if (permission.location !== "granted" && permission.coarseLocation !== "granted") {
      const requested = await Geolocation.requestPermissions({ permissions: ["location", "coarseLocation"] });
      if (requested.location !== "granted" && requested.coarseLocation !== "granted") throw new Error("Location permission was not granted.");
    }
    return await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 });
  } catch (error) {
    throw new Error(error?.message || "Enable Location and allow MelaChow location access, then try again.");
  }
}

const normalizeOsmAddress = (result) => {
  const address = result?.address || {};
  return {
    addressLine: result?.display_name || "",
    city: address.city || address.town || address.village || address.municipality || address.county || "",
    state: address.state || address.region || "",
    providerPlaceId: result?.place_id ? String(result.place_id) : "",
  };
};

const osmRequest = async (url) => {
  const response = await fetch(url, { headers: { Accept: "application/json", "Accept-Language": "en" } });
  if (!response.ok) throw new Error("OpenStreetMap could not resolve this location right now.");
  return response.json();
};

export async function reverseGeocodeWithOpenStreetMap({ lat, lng }) {
  const result = await osmRequest(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1`);
  return { ...normalizeOsmAddress(result), coordinates: { lat: Number(lat), lng: Number(lng) }, provider: "openstreetmap", locationSource: "device_gps" };
}

export async function searchOpenStreetMapAddress(query) {
  const results = await osmRequest(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=ng&addressdetails=1&q=${encodeURIComponent(query)}`);
  return (Array.isArray(results) ? results : []).map((result) => ({
    ...normalizeOsmAddress(result),
    coordinates: { lat: Number(result.lat), lng: Number(result.lon) },
    provider: "openstreetmap",
    locationSource: "manual_search",
  }));
}
