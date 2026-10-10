const toCoordinate = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const getCoordinates = (source) => {
  if (!source) return null;

  const nested = source.coordinates || source.location?.coordinates;
  const lat = toCoordinate(
    source.latitude ?? source.lat ?? nested?.lat ?? (Array.isArray(nested) ? nested[1] : null)
  );
  const lng = toCoordinate(
    source.longitude ?? source.lng ?? nested?.lng ?? (Array.isArray(nested) ? nested[0] : null)
  );

  if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
};

const formatMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours && remainder) return `${hours}h ${remainder}m`;
  if (hours) return `${hours}h`;
  return `${minutes} min`;
};

export const getDeliveryEtaLabel = (customerLocation, restaurantLocation, fallbackMinutes = 30) => {
  const customer = getCoordinates(customerLocation);
  const restaurant = getCoordinates(restaurantLocation?.address || restaurantLocation);

  let minMinutes;
  let maxMinutes;

  if (customer && restaurant) {
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const latDelta = toRadians(restaurant.lat - customer.lat);
    const lngDelta = toRadians(restaurant.lng - customer.lng);
    const a = Math.sin(latDelta / 2) ** 2
      + Math.cos(toRadians(customer.lat))
      * Math.cos(toRadians(restaurant.lat))
      * Math.sin(lngDelta / 2) ** 2;
    const normalizedA = Math.min(1, Math.max(0, a));
    const straightLineKm = 6371 * 2 * Math.atan2(Math.sqrt(normalizedA), Math.sqrt(1 - normalizedA));
    const estimatedRoadKm = straightLineKm * 1.35;

    // Urban travel speed range plus kitchen preparation and dispatch time.
    minMinutes = Math.max(15, Math.ceil((estimatedRoadKm / 25) * 60 + 10));
    maxMinutes = Math.max(minMinutes + 5, Math.ceil((estimatedRoadKm / 18) * 60 + 15));
  } else {
    const baseline = Math.max(15, Number(fallbackMinutes) || 30);
    minMinutes = Math.max(10, baseline - 5);
    maxMinutes = baseline;
  }

  return `${formatMinutes(minMinutes)}–${formatMinutes(maxMinutes)}`;
};
