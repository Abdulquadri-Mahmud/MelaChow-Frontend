import axios from "axios";
// Helper to dispatch unauthorized event
const dispatchUserUnauthorized = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("user:unauthorized"));
  }
};

export const fetchUser = async () => {
  // No token arg needed; cookies are sent automatically

  const res = await fetch(" http://localhost:3001/api/user/auth/profile", {
    credentials: "include", // ✅ vital for cookies
    cache: "no-store",
  });

  // console.log(res)

  if (res.status === 401) {
    // If 401, just return null (Guest). 
    // Do not force logout/redirect via event, as this might be the initial check.
    return null;
  }

  if (!res.ok) {
    throw new Error("Unauthorized or fetch failed!");
  }

  const data = await res.json();
  return data; // expected { user: ... }
};

/**
 * Create a new order
 * @param {Object} orderData - payload containing cart, address, etc.
 * @returns {Object} - created order response
 */

export const createOrder = async (orderData) => {
  // console.log('orderData: ', orderData)
  try {
    const res = await axios.post(
      " http://localhost:3001/api/orders/create",
      orderData,
      {
        withCredentials: true, // ✅ Send cookies
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return res.data; // order confirmation
  } catch (error) {
    console.error("Create Order Error:", error);

    // Only dispatch if it's a genuine 401 response (not a network/CORS error)
    if (error.response && error.response.status === 401) {
      dispatchUserUnauthorized();
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to create order";

    throw new Error(message);
  }
};


// ✅ Frontend helper to verify payment and create order
export const verifyPayment = async (reference, body = {}) => {

  try {
    const res = await axios.post(
      ` http://localhost:3001/api/orders/verify/${reference}`,
      body, // send items, deliveryFee, deliveryAddress, phone here
      {
        withCredentials: true, // ✅ Send cookies
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return res.data; // contains order confirmation & Paystack data
  } catch (error) {
    console.error("Verify Payment Error:", error);

    if (error.response && error.response.status === 401) {
      dispatchUserUnauthorized();
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to verify payment";

    throw new Error(message);
  }
};

/**
 * Fetch the authenticated user's reviews
 * Uses secure cookie-based authentication
 * @returns {Object} - user's reviews data
 */
export const getUserReviews = async () => {
  try {
    const res = await axios.get(
      " http://localhost:3001/api/user/auth/reviews",
      {
        withCredentials: true, // ✅ Send cookies
      }
    );
    return res.data;
  } catch (error) {
    console.error("Get User Reviews Error:", error);

    if (error.response && error.response.status === 401) {
      dispatchUserUnauthorized();
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch reviews";

    throw new Error(message);
  }
};


