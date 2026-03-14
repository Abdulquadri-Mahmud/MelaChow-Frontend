import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const isVendorOpen = (openingHours) => {
  if (!openingHours) return false;
  const now      = new Date();
  const dayName  = now.toLocaleDateString("en-US",
    { weekday: "long" }).toLowerCase();
  const hours    = openingHours[dayName];
  if (!hours?.open || !hours?.close) return false;
  const [oH, oM]  = hours.open.split(":").map(Number);
  const [cH, cM]  = hours.close.split(":").map(Number);
  const nowMins   = now.getHours() * 60 + now.getMinutes();
  const openMins  = oH * 60 + oM;
  const closeMins = cH * 60 + cM;
  return nowMins >= openMins && nowMins < closeMins;
};
