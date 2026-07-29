import axios from "axios";
import { TokenManager } from "./auth-token";

const customerApi = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise = null;

export const refreshCustomerAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = axios.post("/api/user/auth/refresh", {}, {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    }).then((response) => {
      const accessToken = response.data?.accessToken;
      if (!accessToken) throw new Error("Refresh response did not include an access token");
      TokenManager.setToken(accessToken, "user");
      return accessToken;
    }).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

customerApi.interceptors.request.use((config) => {
  const token = TokenManager.getToken("user");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

customerApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const isUnauthorized = error.response?.status === 401;
    const isRefreshRequest = request?.url?.includes("/user/auth/refresh");

    if (!isUnauthorized || !request || request._customerAuthRetried || isRefreshRequest) {
      return Promise.reject(error);
    }

    request._customerAuthRetried = true;
    try {
      const accessToken = await refreshCustomerAccessToken();
      request.headers = request.headers || {};
      request.headers.Authorization = `Bearer ${accessToken}`;
      return customerApi(request);
    } catch (refreshError) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("user:unauthorized"));
      }
      return Promise.reject(refreshError);
    }
  },
);

export default customerApi;