import axios from "axios";

const BASE_URL = "http://localhost:3001/api";
// const BASE_URL = "https://grub-dash-api.vercel.app/api";

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ✅ Important: Send cookies with every request
});

// Interceptor to handle 401 Unauthorized globally
// Interceptor to handle 401 Unauthorized globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Dispatch event for client-side handling (logout, redirect)
      if (!error.config.suppressUnauthorized && typeof window !== "undefined") {
        window.dispatchEvent(new Event("vendor:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);

export const getVendorDetails = async () => {
  try {
    const response = await API.get(`/vendors/get-vendor`, {
      suppressUnauthorized: true,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) return null;
    throw error;
  }
};

export const getVendorWallet = async () => {
  const response = await API.get(`/vendors/get-wallet`);
  return response.data;
};

export const getVendorOrders = async () => {
  const response = await API.get(`/orders/orders`);
  return response.data;
};

export const getVendorOrderById = async (orderId) => {
  const response = await API.get(`/orders/orders/${orderId}`);
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  if (status === 'completed') {
    const response = await API.put(`/orders/orders/${orderId}/complete`);
    return response.data;
  }
  const response = await API.put(`/orders/orders/${orderId}`, { status });
  return response.data;
};

export default API;
