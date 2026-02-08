/**
 * Secure Token Manager
 * 
 * Implements an in-memory token storage with localStorage fallback for iOS reliability.
 * Handles token persistence safely while avoiding XSS risks where possible.
 */

// In-memory storage (primary)
let memoryToken = null;

const STORAGE_KEY = 'grubdash_access_token_v1';

export const TokenManager = {
    /**
     * Set the access token
     * @param {string} token - The JWT access token
     */
    setToken: (token) => {
        if (!token) return;

        // Save to memory
        memoryToken = token;

        // Save to localStorage (fallback for iOS/Reloads)
        try {
            if (typeof window !== "undefined") {
                localStorage.setItem(STORAGE_KEY, token);
            }
        } catch (e) {
            console.warn("SecureAuth: LocalStorage unavailable", e);
        }
    },

    /**
     * Get the access token
     * @returns {string|null} - The token or null
     */
    getToken: () => {
        // Return memory token if available
        if (memoryToken) return memoryToken;

        // Fallback to localStorage
        try {
            if (typeof window !== "undefined") {
                return localStorage.getItem(STORAGE_KEY);
            }
        } catch (e) {
            // Ignore errors
        }
        return null;
    },

    /**
     * Clear the access token
     */
    clearToken: () => {
        memoryToken = null;
        try {
            if (typeof window !== "undefined") {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (e) {
            // Ignore errors
        }
    },

    /**
     * Initialize token from storage (call on app boot)
     */
    initialize: () => {
        try {
            if (typeof window !== "undefined") {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    memoryToken = stored;
                    console.log("[TokenManager] Initialized on app boot");
                }
            }
        } catch (e) { }
    }
};

// ✅ Auto-initialize on import (Client-side only)
if (typeof window !== 'undefined') {
    TokenManager.initialize();
}
