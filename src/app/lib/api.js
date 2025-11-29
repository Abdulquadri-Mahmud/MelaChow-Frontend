export const fetchUser = async (token) => {
  if (!token) throw new Error("No token provided!");

  const res = await fetch("https://grub-dash-api.vercel.app/api/user/auth/profile", {
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

  const res = await fetch(
    "https://grub-dash-api.vercel.app/api/order/create",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create order");
  }

  const data = await res.json();
  return data; // expected order confirmation payload
};