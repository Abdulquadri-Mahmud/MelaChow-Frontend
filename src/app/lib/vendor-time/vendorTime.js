"use client";

// utils/vendorTime.js
export function getVendorOpenStatus(openingHours) {
  if (!openingHours) return "Opening hours not available.";

  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const now = new Date();
  const currentDay = days[now.getDay()];
  const currentTime =
    now.getHours() * 60 + now.getMinutes(); // minutes since midnight

  const today = openingHours[currentDay];

  if (!today || today.closed) {
    // Vendor closed today → show tomorrow’s schedule
    const tomorrowDay = days[(now.getDay() + 1) % 7];
    const tomorrow = openingHours[tomorrowDay];

    if (tomorrow && !tomorrow.closed) {
      return `Opens tomorrow from ${tomorrow.open} to ${tomorrow.close}`;
    } else {
      return "Closed today and tomorrow.";
    }
  }

  // Parse today's open & close time into minutes
  const [openH, openM] = today.open.split(":").map(Number);
  const [closeH, closeM] = today.close.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (currentTime >= openMinutes && currentTime < closeMinutes) {
    // Currently open
    return `Open now till ${today.close}`;
  } else if (currentTime < openMinutes) {
    // Not yet open today
    return `Opens today from ${today.open} to ${today.close}`;
  } else {
    // Closed for today → next open tomorrow
    const tomorrowDay = days[(now.getDay() + 1) % 7];
    const tomorrow = openingHours[tomorrowDay];
    if (tomorrow && !tomorrow.closed) {
      return `Opens tomorrow from ${tomorrow.open} to ${tomorrow.close}`;
    } else {
      return "Closed until further notice.";
    }
  }
}
