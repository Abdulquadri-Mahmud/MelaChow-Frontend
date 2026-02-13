import axios from "axios";

const BASE_URL = "/api";

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
  const response = await API.get(`/vendors/orders/${orderId}`);
  return response.data;
};

export const updateOrderStatus = async (vendorOrderId, status) => {
  // ✅ Validate vendorOrderId format (MongoDB ObjectId = 24 hex characters)
  if (!vendorOrderId || !vendorOrderId.match(/^[0-9a-fA-F]{24}$/)) {
    console.error('❌ Invalid vendorOrderId format:', vendorOrderId);
    throw new Error('Invalid order ID format. Please refresh the page and try again.');
  }

  console.log(`🔄 API: Updating order status`, {
    vendorOrderId,
    status,
    url: `/vendors/orders/${vendorOrderId}/update`
  });

  try {
    const response = await API.patch(`/vendors/orders/${vendorOrderId}/update`, { status });
    console.log(`✅ API: Status update successful`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ API: Status update failed`, {
      vendorOrderId,
      status,
      error: error.response?.data || error.message
    });
    throw error;
  }
};

export const completeOrder = async (vendorOrderId) => {
  // ✅ Validate vendorOrderId format
  if (!vendorOrderId || !vendorOrderId.match(/^[0-9a-fA-F]{24}$/)) {
    console.error('❌ Invalid vendorOrderId format for completion:', vendorOrderId);
    throw new Error('Invalid order ID format.');
  }

  console.log(`🔄 API: Completing order`, {
    vendorOrderId,
    url: `/vendors/orders/${vendorOrderId}/complete`
  });

  try {
    const response = await API.patch(`/vendors/orders/${vendorOrderId}/complete`);
    console.log(`✅ API: Order completion successful`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ API: Order completion failed`, {
      vendorOrderId,
      error: error.response?.data || error.message
    });
    throw error;
  }
};

export const getVendorReviews = async () => {
  const response = await API.get('/vendors/reviews');
  return response.data;
};

export default API;
