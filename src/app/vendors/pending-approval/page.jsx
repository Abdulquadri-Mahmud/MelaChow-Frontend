"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, Mail, Store, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useVendorStorage } from "@/app/hooks/vendorStorage";
import { useEffect } from "react";

export default function PendingApproval() {
    const { vendorDetails, hasCheckedSession } = useVendorStorage();
    const router = useRouter();

    useEffect(() => {
        if (hasCheckedSession && vendorDetails?.vendor?.isApproved) {
            router.replace("/vendors/dashboard");
        }
    }, [hasCheckedSession, vendorDetails, router]);

    return (
        <div className="w-full bg-white dark:bg-slate-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg text-center space-y-5"
            >
                <div className="relative mx-auto w-32 h-32">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-2 border-dashed border-orange-500/30 rounded-full"
                    />
                    <div className="absolute inset-4 bg-orange-50 dark:bg-orange-500/10 rounded-3xl flex items-center justify-center text-orange-600 shadow-inner">
                        <Store size={48} />
                    </div>
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-1 -right-1 bg-emerald-500 text-white p-2 rounded-full shadow-lg"
                    >
                        <Clock size={20} />
                    </motion.div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white">
                        Under <span className="text-orange-600">Review</span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                        Your vendor account is successfully verified and is now currently
                        <span className="text-slate-900 dark:text-white font-bold italic"> pending administrative approval.</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-left">
                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                            <Clock className="text-orange-600" size={20} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">Timeline</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Reviews typically take 24-48 hours.</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-left">
                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                            <Mail className="text-orange-600" size={20} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">Notification</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">We'll email you at your registered address.</p>
                    </div>
                </div>

                <div className="pt-8">
                    <Link
                        href="/vendors/auth/login"
                        className="inline-flex items-center gap-2 group text-xs font-black uppercase italic tracking-widest text-slate-400 hover:text-orange-600 transition-colors"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Login
                    </Link>
                </div>

                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700">
                    GrubDash Partner Network
                </p>
            </motion.div>
        </div>
    );
}
