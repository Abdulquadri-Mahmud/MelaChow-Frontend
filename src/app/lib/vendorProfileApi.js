import axios from "axios";

const BASE_URL = "https://grub-dash-api.vercel.app/api/vendors";

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
});

// Get token from localStorage
const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("vendorToken") : null;
// Get token from localStorage

const getVendorData = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("vendorPayload");
    try {
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error parsing vendor data:", error);
      return null;
    }
  }
  return null;
};

const vendorData = getVendorData();

const getVendorId = vendorData?.vendor?.id;

// console.log(getVendorId);

// ✅ CRUD Functions
export const getVendors = async () => {
  const token = getToken();
  const res = await api.get(`/get-vendor?id=${getVendorId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const getVendorById = async (id) => {
  const token = getToken();
  const res = await api.get(`/get-vendor?id=${id}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

// ✅ API call (pure function)
export const fetchVendorForUserDisplay = async (id) => {
  const token = getToken();
  const res = await api.get(`/vendor?id=${id}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data; // returns { success, data: { vendor, foods } }
};

export const createVendor = async (data) => {
  const token = getToken();
  const res = await api.post("/create", data, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const updateVendor = async ({ id, data }) => {
  const token = getToken();
  console.log(data);
  const res = await api.patch(`/update-vendor?id=${id}`, data, {
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${token}`,
    },
  });
  console.log(res.data);
  return res.data;
};

export const deleteVendor = async (id) => {
  const token = getToken();
  const res = await api.delete(`/delete-vendor?id=${id}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

