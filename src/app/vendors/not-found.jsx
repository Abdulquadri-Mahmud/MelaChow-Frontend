"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Store, ArrowLeft, AlertCircle, ShoppingBag, Utensils } from "lucide-react";

export default function VendorNotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm mx-auto max-w-4xl py-12">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-24 h-24 bg-orange-50 dark:bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mb-8 border border-orange-100 dark:border-orange-500/20"
            >
                <Utensils size={48} strokeWidth={1.5} />
            </motion.div>

            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-4 uppercase italic">Kitchen closed!</h1>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2 italic">Module or Order not found</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-12 font-medium leading-relaxed">
                The food item, order detail, or kitchen setting you're looking for isn't on the menu right now. It might have been recently cooked up or deleted.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                <Link
                    href="/vendors/dashboard"
                    className="flex-1 sm:flex-none items-center justify-center gap-2 h-14 px-10 bg-orange-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 dark:shadow-none flex"
                >
                    <Store size={18} />
                    My Kitchen
                </Link>
                <button
                    onClick={() => window.history.back()}
                    className="flex-1 sm:flex-none items-center justify-center gap-2 h-14 px-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm flex"
                >
                    <ArrowLeft size={18} />
                    Previous Station
                </button>
            </div>

            <div className="mt-16 pt-8 border-t border-gray-100 dark:border-slate-800 w-full grid grid-cols-1 sm:grid-cols-3 gap-6 opacity-60">
                <Link href="/vendors/orders" className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl transition-all group flex flex-col items-center">
                    <ShoppingBag size={20} className="mb-2 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Order History</span>
                </Link>
                <Link href="/vendors/menu" className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl transition-all group flex flex-col items-center">
                    <Utensils size={20} className="mb-2 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">My Menu</span>
                </Link>
                <Link href="/vendors/settings" className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl transition-all group flex flex-col items-center">
                    <AlertCircle size={20} className="mb-2 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Support Desk</span>
                </Link>
            </div>
        </div>
    );
}
