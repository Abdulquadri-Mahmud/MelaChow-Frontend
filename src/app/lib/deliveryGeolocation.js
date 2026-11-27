import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

const IDEAL_ACCURACY_METERS = 25;
const ACCEPTABLE_ACCURACY_METERS = 65;
const SETTLE_WINDOW_MS = 3500;
const MAX_CAPTURE_MS = 18000;

const accuracyOf = (position) => {
  const val = Number(position?.coords?.accuracy);
  return Number.isFinite(val) && val > 0 ? val : Infinity;
};

const ensureNativePreciseLocationPermission = async () => {
  const current = await Geolocation.checkPermissions();
  // Always request fine ("location") permission if only coarse or prompt is set
  if (current.location !== "granted") {
    const requested = await Geolocation.requestPermissions({ permissions: ["location", "coarseLocation"] });
    if (requested.location !== "granted" && requested.coarseLocation !== "granted") {
      throw Object.assign(
        new Error("Location permission was blocked. Allow precise location for MelaChow in your phone settings, then try again."),
        { code: 1 }
      );
    }
  }
};

const watchNativeBestPosition = () =>
  new Promise((resolve, reject) => {
    let bestPosition = null;
    let watchId = null;
    let settled = false;
    let settleTimer = null;

    const cleanup = () => {
      if (settleTimer) clearTimeout(settleTimer);
      clearTimeout(hardTimer);
      if (watchId != null) {
        const idToClear = watchId;
        watchId = null;
        Geolocation.clearWatch({ id: idToClear }).catch(() => {});
      }
    };

    const finish = (error, position) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve(position);
    };

    const hardTimer = setTimeout(async () => {
      if (bestPosition) return finish(null, bestPosition);
      try {
        const fallback = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        });
        finish(null, fallback);
      } catch (err) {
        finish(err);
      }
    }, MAX_CAPTURE_MS);

    Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: MAX_CAPTURE_MS,
        maximumAge: 0,
        minimumUpdateInterval: 1000,
      },
      (position, error) => {
        if (settled) return;
        if (error) {
          if (error?.code === 1 || String(error?.message || "").toLowerCase().includes("permission")) {
            finish(error);
          }
          return;
        }
        if (!position?.coords) return;
        const acc = accuracyOf(position);
        if (!bestPosition || acc < accuracyOf(bestPosition)) {
          bestPosition = position;
        }
        if (acc <= IDEAL_ACCURACY_METERS) {
          finish(null, bestPosition);
          return;
        }
        if (acc <= ACCEPTABLE_ACCURACY_METERS && !settleTimer) {
          settleTimer = setTimeout(() => {
            if (bestPosition) finish(null, bestPosition);
          }, SETTLE_WINDOW_MS);
        }
      }
    )
      .then((id) => {
        if (settled) Geolocation.clearWatch({ id }).catch(() => {});
        else watchId = id;
      })
      .catch((err) => finish(err));
  });

const watchBrowserBestPosition = () =>
  new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return reject(new Error("Location is not supported by this browser or device."));
    }

    let bestPosition = null;
    let watchId = null;
    let settled = false;
    let settleTimer = null;

    const cleanup = () => {
      if (settleTimer) clearTimeout(settleTimer);
      clearTimeout(hardTimer);
      if (watchId != null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    };

    const finish = (error, position) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve(position);
    };

    const hardTimer = setTimeout(() => {
      if (bestPosition) return finish(null, bestPosition);
      navigator.geolocation.getCurrentPosition(
        (pos) => finish(null, pos),
        (err) => finish(err),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }, MAX_CAPTURE_MS);

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (settled || !position?.coords) return;
        const acc = accuracyOf(position);
        if (!bestPosition || acc < accuracyOf(bestPosition)) {
          bestPosition = position;
        }
        if (acc <= IDEAL_ACCURACY_METERS) {
          finish(null, bestPosition);
          return;
        }
        if (acc <= ACCEPTABLE_ACCURACY_METERS && !settleTimer) {
          settleTimer = setTimeout(() => {
            if (bestPosition) finish(null, bestPosition);
          }, SETTLE_WINDOW_MS);
        }
      },
      (error) => {
        if (error?.code === 1) finish(error);
        else if (!bestPosition && error?.code === 2) finish(error);
      },
      { enableHighAccuracy: true, timeout: MAX_CAPTURE_MS, maximumAge: 0 }
    );
  });

export async function getDeliveryPosition() {
  try {
    if (Capacitor.isNativePlatform()) {
      await ensureNativePreciseLocationPermission();
      return await watchNativeBestPosition();
    }
    return await watchBrowserBestPosition();
  } catch (error) {
    if (error?.code === 1 || String(error?.message || "").toLowerCase().includes("permission")) {
      throw new Error("Location permission was blocked. Allow precise location for MelaChow in your device settings, then try again.");
    }
    if (error?.code === 2) {
      throw new Error("Your phone could not determine its location. Turn on Device Location (High Accuracy), then try again.");
    }
    if (error?.code === 3) {
      throw new Error("GPS is taking too long to lock. Move near a window or outdoors and try again.");
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "Accept-Language": "en" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("OpenStreetMap could not resolve this location right now.");
    return response.json();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Address lookup took too long. You can type the address manually.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export async function reverseGeocodeWithOpenStreetMap({ lat, lng }) {
  const result = await osmRequest(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`);
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
