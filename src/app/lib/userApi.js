import axios from "axios";
import { getApiUrl } from "./apiConfig";

const getUserAxios = () =>
  axios.create({
    baseURL: getApiUrl(),
    withCredentials: true,
  });

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
 */
export const getNearbyVendors = async ({ city, state, cuisine }) => {
  const res = await getUserAxios().get("/user/vendors/nearby", {
    params: { city, state, cuisine },
  });
  return res.data;
};
