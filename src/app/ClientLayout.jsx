"use client";

import AppBootstrapper from "./components/AppBootstrapper";
import { ApiProvider } from "./context/ApiContext";
import QueryProvider from "./providers/QueryProvider";
import { ProfileProvider } from "./context/ProfileContext";
import { AdminProvider } from "./context/AdminContext";
import { CartProvider } from "./context/CartContext";
import GlobalLogoutHandler from "./components/GlobalLogoutHandler";
import ConditionalBottomNav from "./components/conditional_bottom_nav/ConditionalBottomNav";
import { Toaster } from "react-hot-toast";
import "@/app/lib/api"; // Register axios interceptors

export default function ClientLayout({ children }) {
    return (
        <>
            <ApiProvider>
                <QueryProvider>
                    <AdminProvider>
                        <CartProvider>
                            <ProfileProvider>
                                <AppBootstrapper>
                                    {children}
                                    <GlobalLogoutHandler />
                                    <ConditionalBottomNav />
                                </AppBootstrapper>
                            </ProfileProvider>
                        </CartProvider>
                    </AdminProvider>
                </QueryProvider>
            </ApiProvider>
            <Toaster position="top-right" reverseOrder={false} />
        </>
    );
}
