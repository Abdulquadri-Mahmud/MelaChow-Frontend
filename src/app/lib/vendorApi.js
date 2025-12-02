import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3001/api/vendor/order",
//   baseURL: "https://grub-dash-api.vercel.app/api/vendor",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("vendorToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
