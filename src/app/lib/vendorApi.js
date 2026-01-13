import axios from "axios";

const BASE_URL = "http://localhost:3001/api";
// const BASE_URL = "https://grub-dash-api.vercel.app/api";

const API = axios.create({
  baseURL: BASE_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("vendorToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getVendorDetails = async (vendorId) => {
  const response = await API.get(`/vendors/get-vendor?id=${vendorId}`);
  return response.data;
};

export const getVendorWallet = async (vendorId) => {
  const response = await API.get(`/vendors/get-wallet?id=${vendorId}`);
  return response.data;
};

export const getVendorOrders = async (vendorId) => {
  const response = await API.get(`/vendors/orders?id=${vendorId}`);
  return response.data;
};

export const getVendorOrderById = async (orderId) => {
  const response = await API.get(`/vendors/orders/${orderId}`);
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await API.patch(`/vendors/orders/${orderId}/update`, { status });
  return response.data;
};

export default API;
