"use client";

// utils/vendorTime.js
export function getVendorOpenStatus(openingHours) {
  if (!openingHours) return "Opening hours not available.";

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const now = new Date();
  const currentDayIndex = now.getDay();
  const currentDay = days[currentDayIndex];
  const yesterdayDay = days[(currentDayIndex + 6) % 7];

  // Get current time in minutes from midnight
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Helper: Parse time string (14:30 or 2:30 PM) to minutes
  const parseTime = (timeStr) => {
    if (!timeStr) return 0;

    let str = timeStr.toLowerCase().trim();
    const isPM = str.includes("pm");
    const isAM = str.includes("am");

    // Remove non-digit/colon chars
    str = str.replace(/[^0-9:]/g, "");

    let [h, m] = str.split(":").map(val => parseInt(val || "0", 10));

    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;

    return h * 60 + m;
  };

  // Helper: Format minutes or time string back to 12-hour format for display
  const formatDisplayTime = (timeInput) => {
    const mins = typeof timeInput === "string" ? parseTime(timeInput) : timeInput;
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    const ampm = h >= 12 ? "PM" : "AM";

    h = h % 12;
    h = h ? h : 12; // convert 0 to 12

    return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
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

    // Handle overnight overflow logic
    if (closeMins < openMins) {
      // e.g. Open 18:00, Close 04:00 (next day)
      // If now is 02:00, we are within yesterday's shift
      if (currentTime < closeMins) {
        return `Open now till ${formatDisplayTime(yesterday.close)}`;
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
        return `Open now till ${formatDisplayTime(today.close)}`;
      }
    } else {
      // Overnight hours (e.g. 18:00 - 04:00)
      // If it's 20:00, we are in the shift
      if (currentTime >= openMins) {
        return `Open now till ${formatDisplayTime(today.close)}`;
      }
    }
  }

  // 3. Not open now -> Find when it next opens
  const next = getNextOpeningDay(currentDayIndex);
  if (next) {
    const dayLabel = next.isToday ? "today" : next.isTomorrow ? "tomorrow" : next.dayName.charAt(0).toUpperCase() + next.dayName.slice(1);
    const openTimeDisplay = formatDisplayTime(next.hours.open);

    // Explicitly handle the "The restaurant has closed" message
    if (today && !today.closed) {
      const todayCloseMins = parseTime(today.close);
      const todayOpenMins = parseTime(today.open);

      // If we crossed the closing time today (and it wasn't overnight where we are still technically 'before' close in raw numbers, 
      // though overnight logic is handled above, this catches the standard "closed just now" case)
      if (todayCloseMins > todayOpenMins && currentTime >= todayCloseMins) {
        return `The restaurant has closed and will be open by ${openTimeDisplay} ${dayLabel}.`;
      }
    }

    if (today && today.closed) {
      return `Closed today. We'll be open by ${openTimeDisplay} ${dayLabel}.`;
    }

    return `Closed now. We'll be open by ${openTimeDisplay} ${dayLabel}.`;
  }

  return "Closed until further notice.";
}
