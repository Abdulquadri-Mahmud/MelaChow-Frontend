import axios from "axios";
import { getApiUrl } from "./apiConfig";
import { TokenManager } from "./auth-token";

const getUserAxios = () => {
  const token = TokenManager.getToken("user");
  return axios.create({
    baseURL: getApiUrl(),
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

/**
 * Fetch available foods in a given city/state.
 * Powering the home page FoodList component.
 *
 * @param {Object} params
 * @param {string} params.city  - e.g. "Sagamu"
 * @param {string} params.state - e.g. "Ogun State"
 */
export const getFoodsByLocation = async ({ city, state }) => {
  const res = await getUserAxios().get("/user/foods", {
    params: { city, state },
  });
  return res.data;
};

/**
 * Fetch active vendors near a given city/state.
 *
 * @param {Object} params
 * @param {string} params.city
 * @param {string} params.state
 * @param {string} [params.addressId]
 */
export const getNearbyVendors = async ({ city, state, addressId }) => {
  const res = await getUserAxios().get("/user/vendors/nearby", {
    params: { city, state, ...(addressId ? { addressId } : {}) },
  });
  return res.data;
};

/**
 * Fetch all active vendors for public marketplace discovery.
 * Used as a guest/SEO-friendly fallback when no customer address is available.
 */
export const getAllVendors = async () => {
  const res = await getUserAxios().get("/user/vendors");
  return res.data;
};

/**
 * Fetch all public food records for marketplace discovery.
 */
export const getAllFoods = async () => {
  const res = await getUserAxios().get("/vendors/foods/get-foods");
  return res.data;
};
