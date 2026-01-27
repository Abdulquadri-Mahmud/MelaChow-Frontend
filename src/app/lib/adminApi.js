/**
 * Admin API Service
 * All admin API calls with proper authentication using HTTP-only cookies
 */

import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://grub-dash-api.vercel.app";

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

class AdminAPI {
    /**
     * Helper method to handle API responses
     */
    async handleResponse(request) {
        try {
            const response = await request;
            return response.data;
        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                if (error.response.status === 401) {
                    // Unauthorized - dispatch global event for logout handler
                    if (typeof window !== "undefined") {
                        window.dispatchEvent(new Event("admin:unauthorized"));
                    }
                    throw new Error("Unauthorized - Please login");
                }
                const message = error.response.data?.message || "Request failed";
                throw new Error(message);
            } else if (error.request) {
                // The request was made but no response was received
                throw new Error("Network error - No response received");
            } else {
                // Something happened in setting up the request
                throw new Error(error.message);
            }
        }
    }

    // ==================== AUTHENTICATION ====================

    async login(email, password) {
        return this.handleResponse(
            api.post("/api/admin/login", { email, password })
        );
    }

    async register(name, email, password, role = "admin") {
        return this.handleResponse(
            api.post("/api/admin/register", { name, email, password, role })
        );
    }

    async logout() {
        return this.handleResponse(api.post("/api/admin/logout"));
    }

    async forgotPassword(email) {
        return this.handleResponse(
            api.post("/api/admin/forgot-password", { email })
        );
    }

    async resetPassword(email, otp, newPassword) {
        return this.handleResponse(
            api.post("/api/admin/reset-password", { email, otp, newPassword })
        );
    }

    // ==================== VENDOR MANAGEMENT ====================

    async getAllVendors(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.handleResponse(
            api.get(`/api/admin/vendors/get-all?${params}`)
        );
    }

    async getVendorById(vendorId) {
        return this.handleResponse(
            api.get(`/api/admin/vendors/single?vendorId=${vendorId}`)
        );
    }

    async approveVendor(vendorId) {
        return this.handleResponse(
            api.patch(`/api/admin/vendors/approve?vendorId=${vendorId}`)
        );
    }

    async rejectVendor(vendorId, reason) {
        return this.handleResponse(
            api.patch(
                `/api/admin/vendors/reject?vendorId=${vendorId}&reason=${encodeURIComponent(
                    reason
                )}`
            )
        );
    }

    async suspendVendor(vendorId, reason) {
        return this.handleResponse(
            api.patch(
                `/api/admin/vendors/suspend?vendorId=${vendorId}&reason=${encodeURIComponent(
                    reason
                )}`
            )
        );
    }

    async reactivateVendor(vendorId) {
        return this.handleResponse(
            api.patch(`/api/admin/vendors/reactivate?vendorId=${vendorId}`)
        );
    }

    async updateVendorStatus(vendorId, suspended) {
        return this.handleResponse(
            api.patch(
                `/api/admin/vendors/status?vendorId=${vendorId}&suspended=${suspended}`
            )
        );
    }

    async updateCommission(commissionRate) {
        return this.handleResponse(
            api.patch("/api/admin/vendors/commission", { commissionRate })
        );
    }

    async getVendorPerformance(vendorId) {
        return this.handleResponse(
            api.get(`/api/admin/vendors/performance?vendorId=${vendorId}`)
        );
    }

    async getVendorFoods(vendorId) {
        return this.handleResponse(
            api.get(`/api/admin/vendors/foods?vendorId=${vendorId}`)
        );
    }

    // ==================== USER MANAGEMENT ====================

    async getAllUsers(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.handleResponse(
            api.get(`/api/admin/user/all?${params}`)
        );
    }

    async getUserById(userId) {
        return this.handleResponse(
            api.get(`/api/admin/user/single?userId=${userId}`)
        );
    }

    async getUserStats() {
        return this.handleResponse(api.get("/api/admin/user/stats"));
    }

    async suspendUser(userId, reason) {
        return this.handleResponse(
            api.patch(
                `/api/admin/user/suspend?userId=${userId}&reason=${encodeURIComponent(
                    reason
                )}`
            )
        );
    }

    async banUser(userId, reason) {
        return this.handleResponse(
            api.patch(
                `/api/admin/user/ban?userId=${userId}&reason=${encodeURIComponent(
                    reason
                )}`
            )
        );
    }

    async reactivateUser(userId) {
        return this.handleResponse(
            api.patch(`/api/admin/user/reactivate?userId=${userId}`)
        );
    }

    // ==================== ADMIN MANAGEMENT ====================

    async getAllAdmins() {
        return this.handleResponse(api.get("/api/admin/get-all"));
    }

    async deleteAdmin(adminId) {
        return this.handleResponse(
            api.delete(`/api/admin/delete/${adminId}`)
        );
    }

    // ==================== CATEGORY MANAGEMENT ====================

    async getAllCategories() {
        return this.handleResponse(
            api.get("/api/categories/admin/all")
        );
    }

    async createCategory(categoryData) {
        return this.handleResponse(
            api.post("/api/categories", categoryData)
        );
    }

    async updateCategory(categoryId, categoryData) {
        return this.handleResponse(
            api.put(`/api/categories/${categoryId}`, categoryData)
        );
    }

    async deleteCategory(categoryId) {
        return this.handleResponse(
            api.delete(`/api/categories/${categoryId}`)
        );
    }
}

export default new AdminAPI();
