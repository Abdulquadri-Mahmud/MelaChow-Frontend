"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdmin } from "@/app/context/AdminContext";

export default function AdminProtectedRoute({ children }) {
    const { admin, isLoading } = useAdmin();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !admin && pathname !== "/admin/login") {
            router.push("/admin/login");
        }
    }, [admin, isLoading, pathname, router]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Verifying admin session...</p>
                </div>
            </div>
        );
    }

    // Show nothing while redirecting
    if (!admin && pathname !== "/admin/login") {
        return null;
    }

    return <>{children}</>;
}
