import axios from "axios";

export const fetchUser = async (token) => {
  if (!token) throw new Error("No token provided!");

  const res = await fetch("http://localhost:3001/api/user/auth/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  // console.log(res)

  if (!res.ok){
    throw new Error("Unauthorized or fetch failed!");
  } 

  const data = await res.json();
  return data; // expected { user: ... }
};

/**
 * Create a new order
 * @param {string} token - user JWT token
 * @param {Object} orderData - payload containing cart, address, etc.
 * @returns {Object} - created order response
 */

export const createOrder = async (token, orderData) => {
  if (!token) throw new Error("No token provided!");
  // console.log('token:', token)
  // console.log('orderData: ', orderData)
  try {
    const res = await axios.post(
      "http://localhost:3001/api/orders/create",
      orderData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data; // order confirmation
  } catch (error) {
    console.error("Create Order Error:", error);

    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to create order";

    throw new Error(message);
  }
};


// ✅ Frontend helper to verify payment and create order
export const verifyPayment = async (token, reference, body = {}) => {

  try {
    const res = await axios.post(
      `http://localhost:3001/api/orders/verify/${reference}`,
      body, // send items, deliveryFee, deliveryAddress, phone here
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data; // contains order confirmation & Paystack data
  } catch (error) {
    console.error("Verify Payment Error:", error);

    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to verify payment";

    throw new Error(message);
  }
};

