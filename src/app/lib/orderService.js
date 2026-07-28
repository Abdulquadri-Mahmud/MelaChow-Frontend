import axios from "axios";
import { getPromoDeviceId } from "./promoDevice";
import { TokenManager } from "./auth-token";

// Helper to dispatch unauthorized event
const dispatchUserUnauthorized = () => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("user:unauthorized"));
    }
};

/**
 * Silently attempt a token refresh using the HttpOnly refreshToken cookie.
 * On success, updates TokenManager with the new access token and returns true.
 * On any failure, returns false without throwing or showing UI feedback.
 * The caller decides whether to retry the original request or log the user out.
 */
const silentRefreshToken = async () => {
    try {
        const res = await axios.post(
            "/api/user/auth/refresh",
            {},
            {
                withCredentials: true, // ✅ Sends the HttpOnly refreshToken cookie
                headers: { "Content-Type": "application/json" },
            }
        );

        if (res.data?.accessToken) {
            // Store new access token so subsequent requests use it
            TokenManager.setToken(res.data.accessToken, "user");
            console.log("[silentRefreshToken] ✅ Token refreshed successfully");
            return true;
        }

        return false;
    } catch (err) {
        console.warn("[silentRefreshToken] ❌ Refresh failed:", err?.response?.data?.message || err.message);
        return false;
    }
};

/**
 * Create order using V2 API with enhanced validation
 * 
 * @param {Object} orderData - Order payload containing items, delivery address, and fees
 * @param {Array<Object>} orderData.items - Array of order items with food details
 * @param {Array<Object>} orderData.vendorDeliveryFees - Delivery fees per vendor
 * @param {Object} orderData.deliveryAddress - Delivery address details
 * @param {string} orderData.phone - User's phone number
 * @returns {Promise<Object>} Created order response with Paystack authorization URL
 * 
 * @example
 * const order = await createOrderV2({
 *   items: [...],
 *   vendorDeliveryFees: [...],
 *   deliveryAddress: {...},
 *   phone: "+2348012345678"
 * });
 */
export const createOrderV2 = async (orderData) => {
    const deviceId = getPromoDeviceId();
    const requestConfig = {
        withCredentials: true, // ✅ Send cookies for authentication
        headers: {
            "Content-Type": "application/json",
            ...(deviceId ? { "X-MelaChow-Device-Id": deviceId } : {}),
        },
    };

    const doRequest = () =>
        axios.post("/api/orders/v2/create", { ...orderData, deviceId }, requestConfig);

    try {
        const response = await doRequest();
        return response.data;
    } catch (error) {
        // --- Silent token refresh on 401 ---
        if (error.response?.status === 401) {
            console.warn("[createOrderV2] 401 received — attempting silent token refresh before logging out");
            const refreshed = await silentRefreshToken();

            if (refreshed) {
                // Retry the original request once with the new token
                try {
                    const retryResponse = await doRequest();
                    return retryResponse.data;
                } catch (retryError) {
                    console.error("[createOrderV2] Retry after refresh failed:", retryError);
                    const message =
                        retryError.response?.data?.message ||
                        retryError.message ||
                        "Failed to create order";
                    throw new Error(message);
                }
            }

            // Refresh itself failed — session is truly invalid
            console.error("[createOrderV2] Token refresh failed. Logging user out.");
            dispatchUserUnauthorized();
        }

        const message =
            error.response?.data?.message ||
            error.message ||
            "Failed to create order";
        throw new Error(message);
    }
};

/**
 * Verify payment using API
 * 
 * @param {string} reference - Paystack payment reference
 * @returns {Promise<Object>} Verified order with payment details
 */
export const verifyPaymentV2 = async (reference) => {
    const requestConfig = {
        withCredentials: true, // ✅ Send cookies for authentication
        headers: { "Content-Type": "application/json" },
    };

    const doRequest = () =>
        axios.post(`/api/orders/v2/verify/${reference}`, {}, requestConfig);

    /**
     * Converts an axios error into the structured error the UI expects.
     * Preserves the PAYMENT_FAILED special case.
     */
    const buildError = (error) => {
        // Business logic failure: payment was not successful at Paystack
        if (error.response?.status === 400 && error.response.data?.order) {
            const paymentError = new Error(error.response.data.message || "Payment not successful");
            paymentError.failedOrder = error.response.data.order;
            paymentError.code = "PAYMENT_FAILED";
            return paymentError;
        }

        const message =
            error.response?.data?.message ||
            error.message ||
            "Payment verification failed";
        const customError = new Error(message);
        customError.status = error.response?.status;
        return customError;
    };

    try {
        const response = await doRequest();
        return response.data;
    } catch (error) {
        // --- Silent token refresh on 401 (expired access token) ---
        // This is the most common cause of spurious logouts after Paystack:
        // the customer spent longer on the payment page than the token lifetime.
        if (error.response?.status === 401) {
            console.warn(
                "[verifyPaymentV2] 401 received — attempting silent token refresh before logging out.",
                "Reference:", reference
            );

            const refreshed = await silentRefreshToken();

            if (refreshed) {
                // Retry the verification once with the fresh token
                try {
                    console.log("[verifyPaymentV2] Retrying verification after successful token refresh.");
                    const retryResponse = await doRequest();
                    return retryResponse.data;
                } catch (retryError) {
                    console.error("[verifyPaymentV2] Retry after refresh failed:", retryError);
                    throw buildError(retryError);
                }
            }

            // Refresh itself failed — the session is genuinely invalid
            console.error(
                "[verifyPaymentV2] Token refresh failed. Session is invalid. Logging user out."
            );
            dispatchUserUnauthorized();
            // Throw so the UI lands on the failed state rather than hanging
            const sessionError = new Error("Session expired. Please log in again.");
            sessionError.status = 401;
            throw sessionError;
        }

        // All other errors (400, 500, network) — propagate normally
        console.error("[verifyPaymentV2] Verification error:", error);
        throw buildError(error);
    }
};

/**
 * Initialize Paystack payment (legacy support)
 * This function creates an order and returns the Paystack authorization URL
 * 
 * @param {Object} orderPayload - Order data to initialize payment
 * @returns {Promise<Object>} Paystack initialization response
 */
export const initializePayment = async (orderPayload) => {
    try {
        const result = await createOrderV2(orderPayload);

        // V2 API returns authorization_url in the response
        if (!result.authorization_url) {
            throw new Error("Payment initialization failed - no authorization URL");
        }

        return result;
    } catch (error) {
        console.error("Initialize Payment Error:", error);
        throw error;
    }
};
