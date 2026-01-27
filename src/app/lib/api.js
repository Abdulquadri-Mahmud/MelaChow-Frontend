import axios from "axios";
// Helper to dispatch unauthorized event
const dispatchUserUnauthorized = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("user:unauthorized"));
  }
};

export const fetchUser = async () => {
  // No token arg needed; cookies are sent automatically

  const res = await fetch("https://grub-dash-api.vercel.app/api/user/auth/profile", {
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
      "https://grub-dash-api.vercel.app/api/orders/create",
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
      `https://grub-dash-api.vercel.app/api/orders/verify/${reference}`,
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
      "https://grub-dash-api.vercel.app/api/user/my-reviews",
      {
        withCredentials: true, // ✅ Send cookies
      }
    );
    console.log(res.data)
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

/**
 * Get User Wallet
 * @returns {Object} - wallet data { balance, transactions }
 */
export const getWallet = async () => {
  try {
    const res = await axios.get("https://grub-dash-api.vercel.app/api/wallet", {
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    console.error("Get Wallet Error:", error);
    if (error.response && error.response.status === 401) {
      dispatchUserUnauthorized();
    }
    throw error;
  }
};

/**
 * Fund User Wallet
 * @param {Object} data - { amount, email }
 * @returns {Object} - { success, authorization_url, reference }
 */
export const fundWallet = async (data) => {
  try {
    const res = await axios.post("https://grub-dash-api.vercel.app/api/wallet/fund", data, {
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    console.error("Fund Wallet Error:", error);
    if (error.response && error.response.status === 401) {
      dispatchUserUnauthorized();
    }
    throw error;
  }
};

/**
 * Verify Wallet Transaction
 * @param {string} reference 
 * @returns {Object} - result
 */
export const verifyWalletTransaction = async (reference) => {
  try {
    const res = await axios.get(`https://grub-dash-api.vercel.app/api/wallet/verify/${reference}`, {
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    console.error("Verify Wallet Error:", error);
    if (error.response && error.response.status === 401) {
      dispatchUserUnauthorized();
    }
    throw error;
  }
};

/**
 * Create a Review for Vendor/Food
 * @param {Object} data - { vendorId, foodId (optional), rating, comment }
 * @returns {Object}
 */
export const createReview = async (data) => {
  try {
    const res = await axios.post("https://grub-dash-api.vercel.app/api/admin/user/reviews/create-reviews", data, {
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    // console.error("Create Review Error:", error);
    if (error.response && error.response.status === 401) {
      dispatchUserUnauthorized();
    }
    throw error;
  }
};

/**
 * Get Vendor Reviews
 * @param {string} vendorId 
 * @returns {Object}
 */
export const getVendorReviews = async (vendorId) => {
  try {
    const res = await axios.get(`https://grub-dash-api.vercel.app/api/admin/user/reviews/vendor-reviews?vendorId=${vendorId}`, {
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    console.error("Get Vendor Reviews Error:", error);
    // If 403/401, we might handle it gracefully in the UI or let it fail
    throw error;
  }
};


