import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

const readBrowserPosition = (options) => new Promise((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(resolve, reject, options);
});

const positionOptions = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 5000,
};

export async function getDeliveryPosition() {
  try {
    if (Capacitor.isNativePlatform()) {
      const current = await Geolocation.checkPermissions();
      if (current.location !== "granted" && current.coarseLocation !== "granted") {
        const requested = await Geolocation.requestPermissions({ permissions: ["location", "coarseLocation"] });
        if (requested.location !== "granted" && requested.coarseLocation !== "granted") {
          throw Object.assign(new Error("Location permission was blocked. Allow location for MelaChow in your phone settings, then try again."), { code: 1 });
        }
      }
      return await Geolocation.getCurrentPosition(positionOptions);
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      throw new Error("Location is not supported by this browser or device.");
    }
    return await readBrowserPosition(positionOptions);
  } catch (error) {
    if (error?.code === 1 || String(error?.message || "").toLowerCase().includes("permission")) {
      throw new Error("Location permission was blocked. Allow location for MelaChow in your device settings, then try again.");
    }
    if (error?.code === 2) {
      throw new Error("Your phone could not determine its location. Turn on Device Location, then try again.");
    }
    if (error?.code === 3) {
      throw new Error("Location is taking too long. Check that Device Location is on, then try again.");
    }
    throw new Error(error?.message || "We could not capture your location. Check your device location settings and try again.");
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
