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
  // Shape returned:
  // {
  //   success: true,
  //   location: { city, state },
  //   count: number,
  //   foods: Food[]
  // }
};
