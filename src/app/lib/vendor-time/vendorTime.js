const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function getZonedNow(timeZone = "Africa/Lagos", nowDate = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(nowDate)
      .reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {});
    const day = String(parts.weekday || "").toLowerCase();
    const dayIndex = DAYS.indexOf(day);
    return {
      day: dayIndex >= 0 ? day : DAYS[nowDate.getDay()],
      dayIndex: dayIndex >= 0 ? dayIndex : nowDate.getDay(),
      minutes: Number(parts.hour || 0) * 60 + Number(parts.minute || 0),
    };
  } catch {
    return {
      day: DAYS[nowDate.getDay()],
      dayIndex: nowDate.getDay(),
      minutes: nowDate.getHours() * 60 + nowDate.getMinutes(),
    };
  }
}

function getDayHours(openingHours, dayName) {
  if (!openingHours) return null;
  const key = Object.keys(openingHours).find((k) => k.toLowerCase() === dayName.toLowerCase());
  return key ? openingHours[key] : null;
}

function parseTime(timeStr, isClosing = false) {
  if (!timeStr) return null;
  let str = String(timeStr).toLowerCase().trim();
  const isPM = str.includes("pm");
  const isAM = str.includes("am");
  str = str.replace(/[^0-9:]/g, "");
  if (!str) return null;
  if (!str.includes(":")) str += ":00";
  let [h, m] = str.split(":").map((val) => parseInt(val || "0", 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;

  if (isPM) {
    if (h < 12) h += 12;
  } else if (isAM) {
    if (h === 12) h = 0;
  } else if (isClosing && h > 0 && h < 12) {
    h += 12;
  }
  return h * 60 + m;
}

function formatDisplayTime(timeInput, isClosing = false) {
  const mins = typeof timeInput === "string" ? parseTime(timeInput, isClosing) : timeInput;
  if (mins == null) return "the scheduled time";
  let h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatTimeInLagos(isoValue) {
  if (!isoValue) return null;
  const d = new Date(isoValue);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const timeStr = d.toLocaleTimeString("en-NG", {
    timeZone: "Africa/Lagos",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  if (sameDay) return timeStr;
  const dateStr = d.toLocaleDateString("en-NG", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${dateStr} at ${timeStr}`;
}

function isRuleActive(rule, nowDate) {
  if (!rule || !rule.active) return false;
  if (!rule.until) return true;
  const until = new Date(rule.until);
  if (Number.isNaN(until.getTime())) return true;
  return nowDate.getTime() < until.getTime();
}

export function evaluateVendorAvailability(openingHours, nowDate = new Date()) {
  const availability =
    openingHours?.availability && typeof openingHours.availability === "object"
      ? openingHours.availability
      : {};
  const autoScheduleEnabled = availability.autoScheduleEnabled !== false;
  const basePrepTimeMinutes = Math.min(180, Math.max(5, Number(availability.basePrepTimeMinutes) || 25));
  const isBusy = isRuleActive(availability.busyMode, nowDate);
  const extraPrepMinutes = isBusy ? Math.min(120, Math.max(0, Number(availability.busyMode?.extraPrepMinutes) || 15)) : 0;
  const estimatedPrepMinutes = basePrepTimeMinutes + extraPrepMinutes;

  const base = {
    isBusy,
    busyUntil: isBusy ? availability.busyMode?.until || null : null,
    basePrepTimeMinutes,
    extraPrepMinutes,
    estimatedPrepMinutes,
    autoScheduleEnabled,
  };

  if (openingHours?.adminOverride?.status === "open") {
    return {
      isOpen: true,
      state: isBusy ? "busy" : "open",
      message: isBusy
        ? `Open now · Busy (~${estimatedPrepMinutes} min prep)`
        : "Open now by administrator override.",
      ...base,
    };
  }
  if (openingHours?.adminOverride?.status === "closed") {
    return {
      isOpen: false,
      state: "admin_closed",
      message: "Temporarily closed by administrator.",
      ...base,
    };
  }

  if (isRuleActive(availability.temporaryClosure, nowDate)) {
    const reopenLabel = formatTimeInLagos(availability.temporaryClosure?.until);
    return {
      isOpen: false,
      state: "temporarily_closed",
      message: reopenLabel
        ? `Temporarily closed. Reopens ${reopenLabel}.`
        : "Temporarily closed until further notice.",
      ...base,
    };
  }

  if (isRuleActive(availability.orderPause, nowDate)) {
    const resumeLabel = formatTimeInLagos(availability.orderPause?.until);
    return {
      isOpen: false,
      state: "orders_paused",
      message: resumeLabel
        ? `Incoming orders paused. Resumes at ${resumeLabel}.`
        : "Not accepting new orders right now. Please check back shortly.",
      ...base,
    };
  }

  if (!autoScheduleEnabled) {
    return {
      isOpen: true,
      state: isBusy ? "busy" : "open",
      message: isBusy
        ? `Open now · Busy (~${estimatedPrepMinutes} min prep)`
        : "Open now",
      ...base,
    };
  }

  if (!openingHours) {
    return {
      isOpen: false,
      state: "closed",
      message: "Opening hours not available.",
      ...base,
    };
  }

  const now = getZonedNow("Africa/Lagos", nowDate);
  const currentDay = DAYS[now.dayIndex];
  const yesterdayDay = DAYS[(now.dayIndex + 6) % 7];

  const yesterday = getDayHours(openingHours, yesterdayDay);
  if (yesterday && !yesterday.closed) {
    const openMins = parseTime(yesterday.open, false);
    const closeMins = parseTime(yesterday.close, true);
    if (openMins != null && closeMins != null && closeMins < openMins && now.minutes < closeMins) {
      const untilLabel = formatDisplayTime(yesterday.close, true);
      return {
        isOpen: true,
        state: isBusy ? "busy" : "open",
        message: isBusy
          ? `Open now · Busy (~${estimatedPrepMinutes} min prep) until ${untilLabel}`
          : `Open now until ${untilLabel}`,
        ...base,
      };
    }
  }

  const today = getDayHours(openingHours, currentDay);
  if (today && !today.closed) {
    const openMins = parseTime(today.open, false);
    const closeMins = parseTime(today.close, true);
    if (openMins != null && closeMins != null) {
      const isOpenNow =
        openMins === closeMins ||
        (closeMins > openMins ? now.minutes >= openMins && now.minutes < closeMins : now.minutes >= openMins);
      if (isOpenNow) {
        const untilLabel = formatDisplayTime(today.close, true);
        return {
          isOpen: true,
          state: isBusy ? "busy" : "open",
          message: isBusy
            ? `Open now · Busy (~${estimatedPrepMinutes} min prep) until ${untilLabel}`
            : `Open now until ${untilLabel}`,
          ...base,
        };
      }
    }
  }

  for (let offset = 0; offset <= 6; offset += 1) {
    const nextIdx = (now.dayIndex + offset) % 7;
    const dayName = DAYS[nextIdx];
    const hrs = getDayHours(openingHours, dayName);
    if (!hrs || hrs.closed) continue;
    const openMins = parseTime(hrs.open, false);
    if (openMins == null) continue;
    if (offset === 0 && now.minutes >= openMins) continue;
    const dayLabel =
      offset === 0
        ? "today"
        : offset === 1
          ? "tomorrow"
          : `on ${dayName.charAt(0).toUpperCase()}${dayName.slice(1)}`;
    return {
      isOpen: false,
      state: "closed_schedule",
      message: `Closed now. We will open at ${formatDisplayTime(hrs.open, false)} ${dayLabel}.`,
      ...base,
    };
  }

  return {
    isOpen: false,
    state: "closed_schedule",
    message: "Closed until further notice.",
    ...base,
  };
}

export function getVendorOpenStatus(openingHours) {
  return evaluateVendorAvailability(openingHours).message;
}
