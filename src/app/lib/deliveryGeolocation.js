const readPosition = (options) => new Promise((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(resolve, reject, options);
});

export async function getDeliveryPosition() {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("Location is not supported by this browser or device.");
  }

  try {
    // Network/Wi-Fi positioning is quicker and substantially more reliable
    // indoors. The displayed accuracy and Maps preview let the customer verify it.
    return await readPosition({
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 60000,
    });
  } catch (error) {
    if (error?.code === 1) {
      throw new Error("Location permission was blocked. Allow location for MelaChow in your browser settings, then try again.");
    }
    if (error?.code === 2) {
      throw new Error("Your phone could not determine its location. Turn on Device Location and Wi-Fi or mobile data, then try again.");
    }
    if (error?.code === 3) {
      throw new Error("Location is taking too long. Check that Device Location is on, then tap Capture delivery pin again.");
    }
    throw new Error("We could not capture your location. Check your device location settings and try again.");
  }
}
