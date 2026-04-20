"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import adminAPI from "@/app/lib/adminApi";
import { TokenManager } from "@/app/lib/auth-token";

const AdminContext = createContext(undefined);

export const AdminProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Check admin session on mount
    useEffect(() => {
        checkAdminSession();
    }, []);

    const checkAdminSession = async () => {
        // Skip check if we're on the login page to avoid infinite loops
        if (typeof window !== 'undefined' && window.location.pathname === '/admin/auth/login') {
            setIsLoading(false);
            return;
        }

        try {
            // Try to fetch admin data - if this succeeds, we're authenticated
            const response = await adminAPI.getMe();

            if (response.success) {
                setAdmin(response.admin);
            }
        } catch (error) {
            // Not authenticated - silent fail is expected
            if (error.message === "Unauthorized - Please login") {
                setAdmin(null);
                return;
            }

            // Real error occurred
            console.error("Admin session check failed:", error);
            setAdmin(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await adminAPI.login(email, password);

            if (response.success) {
                // Save token for iOS fallback
                const finalToken = response.accessToken || response.token;
                if (finalToken) {
                    TokenManager.setToken(finalToken, 'admin');
                }

                setAdmin(response.admin);
                return { success: true, admin: response.admin };
            } else {
                return { success: false, message: response.message || "Login failed" };
            }
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, message: error.message || "Network error. Please try again." };
        }
    };

    const logout = async () => {
        try {
            await adminAPI.logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setAdmin(null);
            TokenManager.clearToken('admin'); // ✅ Clear fallback token
            sessionStorage.removeItem("splashShown");
            
            // Avoid hard reload if already on login page OR using router
            if (typeof window !== 'undefined') {
                if (window.location.pathname !== '/admin/auth/login') {
                    router.push('/admin/auth/login');
                }
            }
        }
    };

    const register = async (name, email, password, role = "admin") => {
        try {
            const response = await adminAPI.register(name, email, password, role);

            if (response.success) {
                setAdmin(response.admin);
                return { success: true, admin: response.admin };
            } else {
                return { success: false, message: response.message || "Registration failed" };
            }
        } catch (error) {
            console.error("Registration error:", error);
            return { success: false, message: error.message || "Network error. Please try again." };
        }
    };

    return (
        <AdminContext.Provider
            value={{
                admin,
                isLoading,
                login,
                logout,
                register,
                checkAdminSession,
            }}
        >
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error("useAdmin must be used within AdminProvider");
    }
    return context;
};
