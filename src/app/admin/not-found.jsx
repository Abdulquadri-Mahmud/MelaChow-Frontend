"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutDashboard, ArrowLeft, ShieldAlert, BookOpen } from "lucide-react";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";

export default function AdminNotFound() {
    return (
        <AdminProtectedRoute>
            <AdminDashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-slate-200 mb-6 border border-slate-800"
                    >
                        <ShieldAlert size={40} className="text-orange-500" strokeWidth={1.5} />
                    </motion.div>

                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 italic">Resource Not Found</h1>
                    <p className="text-slate-500 text-sm max-w-sm font-medium mb-10 leading-relaxed">
                        The administrative record or dashboard module you're attempting to reach is either restricted, moved, or deleted from the ledger.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                        <Link
                            href="/admin/dashboard"
                            className="flex items-center justify-center gap-2 h-11 px-6 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200"
                        >
                            <LayoutDashboard size={16} />
                            Dashboard Home
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center justify-center gap-2 h-11 px-6 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <ArrowLeft size={16} />
                            Go Back
                        </button>
                    </div>

                    <div className="mt-12 flex flex-col items-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Common Navigation</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/admin/vendors" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Vendors
                            </Link>
                            <Link href="/admin/orders" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Orders
                            </Link>
                            <Link href="/admin/finance" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Financials
                            </Link>
                        </div>
                    </div>
                </div>
            </AdminDashboardLayout>
        </AdminProtectedRoute>
    );
}
