import axios from "axios";
import { TokenManager } from "./auth-token";

const BASE_URL = "/api";

const API = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

// Add request interceptor to attach rider token
API.interceptors.request.use(
    (config) => {
        const token = TokenManager.getToken('rider');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Auth
export const riderLogin = async (phone, password) => {
    const response = await API.post("/auth/rider/login", { phone, password });
    return response.data;
};

export const getRiderProfile = async () => {
    const response = await API.get("/auth/rider/me");
    return response.data;
};

// Status
export const toggleRiderAvailability = async (riderId, status) => {
    if (!riderId || riderId === 'undefined') {
        throw new Error('Invalid rider ID passed to toggleRiderAvailability');
    }
    // console.log("riderId:", riderId)
    const response = await API.patch(`/riders/${riderId}/status`, { status });
    return response.data;
};

// Orders
export const getActiveRiderOrder = async (riderId) => {
    const response = await API.get(`/riders/${riderId}/active-order`);
    return response.data;
};

export const riderPickedUpOrder = async (riderId, orderId) => {
    const response = await API.patch(`/riders/${riderId}/picked-up`, { orderId });
    return response.data;
};

export const riderDeliveredOrder = async (riderId, orderId) => {
    const response = await API.patch(`/riders/${riderId}/delivered`, { orderId });
    return response.data;
};

export const getRiderWallet = async (riderId) => {
    const response = await API.get(`/riders/${riderId}/wallet`);
    return response.data;
};

export default API;
