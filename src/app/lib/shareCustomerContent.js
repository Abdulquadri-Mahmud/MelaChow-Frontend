import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";

const PUBLIC_SITE_ORIGIN = "https://www.melachow.com";

export async function shareCustomerContent({ title, text, path, dialogTitle = "Share MelaChow" }) {
  const url = new URL(path, PUBLIC_SITE_ORIGIN).toString();

  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title, text, url, dialogTitle });
      return "shared";
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title, text, url });
      return "shared";
    }
  } catch (error) {
    if (error?.name === "AbortError" || /cancel/i.test(String(error?.message || ""))) {
      return "cancelled";
    }
    throw error;
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return "copied";
  }

  throw new Error("Sharing is unavailable on this device.");
}
