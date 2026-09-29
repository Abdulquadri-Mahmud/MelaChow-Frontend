import { Geolocation } from "@capacitor/geolocation";
export async function getDeliveryPosition() {
  try {
    return await Geolocation.getCurrentPosition({
      enableHighAccuracy: true, timeout: 20000, maximumAge: 60000,
    });
  } catch (error) {
    throw new Error(error?.message || "Enable Location and allow MelaChow location access, then try again.");
  }
}
