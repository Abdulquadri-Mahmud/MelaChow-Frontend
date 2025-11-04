import axios from "axios";

// ✅ Base URL for all food-related endpoints
// const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const BASE_URL = "https://grub-dash-api.vercel.app/api/vendors/foods";

// ✅ Safe token retrieval (client-side only)
const getToken = () => {
  try {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vendorToken");
    }
  } catch (err) {
    console.error("Token read error:", err);
  }
  return null;
};


// ✅ Create reusable axios instance
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Automatically attach Authorization header via interceptor
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// -----------------------------------------------------------
// 🍛 FOOD CRUD OPERATIONS
// -----------------------------------------------------------

// ✅ Fetch all foods for vendor
export const getFoods = async () => {
  const res = await api.get("/get-foods");
  return res.data;
};

// ✅ Fetch Vendor foods by ID
export const getVendorFoods = async (vendorId) => {
  const res = await api.get(`/get-foods?vendorId=${vendorId}`);
  return res.data;
};

// ✅ Fetch single food by ID
export const getFoodById = async (id) => {
  const res = await api.get(`/get-food?id=${id}`);
  return res.data;
};

// ✅ Create a new food item
export const createFood = async (vendorId, data) => {
  const res = await api.post(`/create?vendorId=${vendorId}`, data);
  return res.data;
};

// ✅ Update existing food
export const updateFood = async (id, data) => {
  const res = await api.patch(`/update-food?id=${id}`, data);
  return res.data;
};

// -----------------------------------------------------------
// ❌ FLEXIBLE DELETE OPERATIONS
// -----------------------------------------------------------

/**
 * Delete a food item or nested element
 * 
 * @param {string} id - The food ID
 * @param {object} options - Specify what to delete
 * @param {boolean} [options.deleteAll] - Delete the entire food
 * @param {string} [options.variantId] - Delete a specific variant
 * @param {string} [options.imageId] - Delete a specific image
 * @param {string} [options.tagKey] - Delete a specific tag
 * @param {string} [options.metaKey] - Delete a specific metadata key
 */
export const deleteFood = async (id, options = { deleteAll: true }) => {
  const res = await api.delete(`/delete-food?id=${id}`, {
    data: options,
  });
  return res.data;
};

// -----------------------------------------------------------
// ✅ Example usage:
// -----------------------------------------------------------
//
// // Delete entire food
// await deleteFood(foodId, { deleteAll: true });
//
// // Delete variant
// await deleteFood(foodId, { variantId: "671b3a1f..." });
//
// // Delete image
// await deleteFood(foodId, { imageId: "671b3f90..." });
//
// // Delete tag
// await deleteFood(foodId, { tagKey: "spicy" });
//
// // Delete metadata key
// await deleteFood(foodId, { metaKey: "chefSpecial" });
//
