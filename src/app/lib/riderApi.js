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

// Response interceptor to handle 401 Unauthorized
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            TokenManager.clearToken('rider');
            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("rider:unauthorized"));
            }
        }
        return Promise.reject(error);
    }
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

export const requestDeliveryOTP = async (riderId, orderId) => {
    const response = await API.post(`/riders/${riderId}/request-delivery-otp`, { orderId });
    return response.data;
};

export const riderConfirmDelivery = async (riderId, orderId, otp) => {
    const response = await API.post(`/riders/${riderId}/confirm-delivery`, { orderId, otp });
    return response.data;
};

export const getRiderWallet = async (riderId) => {
    const response = await API.get(`/riders/${riderId}/wallet`);
    return response.data;
};

// Notifications
export const getRiderNotifications = async (limit = 20, unread = false) => {
    const response = await API.get(`/riders/notifications?limit=${limit}&unread=${unread}`);
    return response.data;
};

export const getRiderUnreadCount = async () => {
    const response = await API.get(`/riders/notifications/unread`);
    return response.data;
};

export const getSingleNotification = async (id) => {
    const response = await API.get(`/riders/notifications/${id}`);
    return response.data;
};

export const markNotificationAsRead = async (id) => {
    const response = await API.patch(`/riders/notifications/${id}/read`);
    return response.data;
};

// Single Order Detail
export const getRiderSpecificOrder = async (riderId, orderId) => {
    const response = await API.get(`/riders/${riderId}/orders/${orderId}`);
    return response.data;
};

export default API;
