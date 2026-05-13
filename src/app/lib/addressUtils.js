export const normalizeAddress = (address) => {
  if (!address) return address;

  const city = address.city || address.cityName || "";
  const state = address.state || address.stateName || "";

  return {
    ...address,
    city,
    state,
    cityName: address.cityName || city,
    stateName: address.stateName || state,
  };
};

export const normalizeUserAddresses = (user) => {
  if (!user || !Array.isArray(user.addresses)) return user;

  return {
    ...user,
    addresses: user.addresses.map(normalizeAddress),
  };
};
