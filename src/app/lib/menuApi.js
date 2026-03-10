import axios from "axios";

const menuApi = axios.create({
    baseURL: "/api",
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

// Re-dispatch unauthorized events
menuApi.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401 && typeof window !== "undefined") {
            window.dispatchEvent(new Event("vendor:unauthorized"));
        }
        return Promise.reject(err);
    }
);

// ─── Platform Categories ────────────────────────────────────────────────────
export const getPlatformCategories = async () => {
    const res = await menuApi.get("/v1/menu/platform-categories");
    return res.data;
};

// ─── Vendor Sections ────────────────────────────────────────────────────────
export const getVendorSections = async (vendorId) => {
    const res = await menuApi.get(`/v1/menu/${vendorId}/sections`);
    return res.data;
};

export const createVendorSection = async (vendorId, name) => {
    const res = await menuApi.post(`/v1/menu/${vendorId}/sections`, { name });
    return res.data;
};

// ─── Menu Items ──────────────────────────────────────────────────────────────
export const createMenuItem = async (vendorId, payload) => {
    const res = await menuApi.post(`/v1/menu/${vendorId}/items`, payload);
    return res.data;
};

export const updateMenuItem = async (vendorId, itemId, payload) => {
    const res = await menuApi.put(`/v1/menu/${vendorId}/items/${itemId}`, payload);
    return res.data;
};

// ─── Portions ─────────────────────────────────────────────────────────────────
export const addPortion = async (vendorId, itemId, payload) => {
    const res = await menuApi.post(`/v1/menu/${vendorId}/items/${itemId}/portions`, payload);
    return res.data;
};

export const updatePortion = async (vendorId, itemId, portionId, payload) => {
    const res = await menuApi.put(`/v1/menu/${vendorId}/items/${itemId}/portions/${portionId}`, payload);
    return res.data;
};

// ─── Choice Groups ────────────────────────────────────────────────────────────
export const addChoiceGroup = async (vendorId, itemId, payload) => {
    const res = await menuApi.post(`/v1/menu/${vendorId}/items/${itemId}/choice-groups`, payload);
    return res.data;
};

// ─── Choice Options ───────────────────────────────────────────────────────────
export const addChoiceOption = async (groupId, payload) => {
    const res = await menuApi.post(`/v1/menu/choice-groups/${groupId}/options`, payload);
    return res.data;
};

export default menuApi;
