"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Store, Bike, ArrowRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const VENDOR_PORTAL_URL = "https://vendor.melachow.com/vendors/auth/login";
const RIDER_PORTAL_URL = "https://rider.melachow.com/auth/rider/login";

export default function PartnerPortalPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0F1115] flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-10">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center mb-8 mx-auto text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-4xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white">
                        Partner <span className="text-orange-600">Portal</span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
                        Select your platform access to continue
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Vendor Card */}
                    <Link href={VENDOR_PORTAL_URL} target="_blank" rel="noopener noreferrer" className="block outline-none select-none group">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[32px] p-6 shadow-xl flex items-center justify-between transition-all duration-300 hover:border-orange-500/30 dark:hover:border-orange-500/30 hover:shadow-orange-500/10"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-[20px] bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-500 shadow-inner group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                    <Store size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Restaurants</h2>
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vendor Dashboard</p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-orange-500/10 group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </motion.div>
                    </Link>

                    {/* Rider Card */}
                    <Link href={RIDER_PORTAL_URL} target="_blank" rel="noopener noreferrer" className="block outline-none select-none group">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[32px] p-6 shadow-xl flex items-center justify-between transition-all duration-300 hover:border-blue-500/30 dark:hover:border-blue-500/30 hover:shadow-blue-500/10"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-[20px] bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Bike size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Riders</h2>
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Delivery Fleet</p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-blue-500/10 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </motion.div>
                    </Link>
                </div>

                <div className="mt-12 text-center pb-4 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                    Secure MelaChow Access
                </div>
            </motion.div>
        </div>
    );
}

