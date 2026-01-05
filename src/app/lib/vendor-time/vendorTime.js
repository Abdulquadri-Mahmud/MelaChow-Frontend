"use client";

// utils/vendorTime.js
export function getVendorOpenStatus(openingHours) {
  if (!openingHours) return "Opening hours not available.";

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const now = new Date();
  const currentDayIndex = now.getDay();
  const currentDay = days[currentDayIndex];
  const yesterdayDay = days[(currentDayIndex + 6) % 7];
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const getNextOpeningDay = (startIndex) => {
    for (let i = 0; i <= 6; i++) {
      const nextIndex = (startIndex + i) % 7;
      const nextDay = days[nextIndex];
      const nextDayHours = openingHours[nextDay];

      if (nextDayHours && !nextDayHours.closed) {
        const openMins = parseTime(nextDayHours.open);
        // If it's today, only return if we haven't reached the opening time yet
        if (i === 0 && currentTime >= openMins) continue;

        return {
          dayName: nextDay,
          hours: nextDayHours,
          isToday: i === 0,
          isTomorrow: i === 1
        };
      }
    }
    return null;
  };

  // 1. Check if we are currently in "Yesterday's" overnight period
  const yesterday = openingHours[yesterdayDay];
  if (yesterday && !yesterday.closed) {
    const openMins = parseTime(yesterday.open);
    const closeMins = parseTime(yesterday.close);
    if (closeMins < openMins) {
      // Yesterday crossed midnight
      if (currentTime < closeMins) {
        return `Open now till ${yesterday.close}`;
      }
    }
  }

  // 2. Check "Today's" hours
  const today = openingHours[currentDay];
  if (today && !today.closed) {
    const openMins = parseTime(today.open);
    const closeMins = parseTime(today.close);

    if (closeMins > openMins) {
      // Normal hours (e.g. 09:00 - 22:00)
      if (currentTime >= openMins && currentTime < closeMins) {
        return `Open now till ${today.close}`;
      }
    } else {
      // Overnight hours (e.g. 09:00 - 04:00)
      if (currentTime >= openMins) {
        return `Open now till ${today.close}`;
      }
    }
  }

  // 3. Not open now -> Find when it next opens
  const next = getNextOpeningDay(currentDayIndex);
  if (next) {
    const dayLabel = next.isToday ? "today" : next.isTomorrow ? "tomorrow" : next.dayName.charAt(0).toUpperCase() + next.dayName.slice(1);

    // Explicitly handle the "The restaurant has closed" message requested by user
    // We show this if the current day has already passed its opening/closing period or if it's closed today
    if (today && !today.closed && currentTime >= parseTime(today.close) && parseTime(today.close) > parseTime(today.open)) {
      return `The restaurant has closed and will be open by ${next.hours.open} ${dayLabel}.`;
    }

    if (today && today.closed) {
      return `Closed today. We'll be open by ${next.hours.open} ${dayLabel}.`;
    }

    return `Closed now. We'll be open by ${next.hours.open} ${dayLabel}.`;
  }

  return "Closed until further notice.";
}
