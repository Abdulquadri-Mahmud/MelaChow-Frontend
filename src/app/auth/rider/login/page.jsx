"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Lock, Eye, EyeOff, Bike, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { riderLogin } from "@/app/lib/riderApi";
import { TokenManager } from "@/app/lib/auth-token";
import toast from "react-hot-toast";

export default function RiderLoginPage() {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = await riderLogin(phone, password);

            console.log(data);

            if (data.accessToken) {
                TokenManager.setToken(data.accessToken, 'rider');
                toast.success("Welcome back, Rider!");
                router.replace("/rider/dashboard");
            }
        } catch (err) {
            console.error("Rider Login Error:", err);
            const status = err.response?.status;
            const message = err.response?.data?.message || "Invalid credentials. Please try again.";

            if (status === 403) {
                setError("Account Locked. Too many failed attempts. Please contact support.");
            } else if (status === 401) {
                setError("Invalid phone number or password.");
            } else {
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0F1115] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-orange-600/5 dark:bg-orange-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-red-600/5 dark:bg-red-600/10 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-600 text-white mb-4 shadow-lg shadow-orange-600/20"
                    >
                        <Bike size={32} />
                    </motion.div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Rider Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Earn on your own terms. Log in to start.</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 dark:bg-[#1A1D23]/80 backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-3xl md:p-8 p-4 shadow-2xl dark:shadow-none relative overflow-hidden">
                    {/* Error Display */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3"
                            >
                                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                <p className="text-red-500 text-sm font-medium">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Phone Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 ml-1">Phone Number</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Phone size={18} className="text-gray-400 dark:text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                                </div>
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="08012345678"
                                    className="w-full bg-gray-50 dark:bg-[#252A31] border border-gray-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-bold text-gray-600 dark:text-gray-400">Password</label>
                                <button type="button" className="text-orange-500 text-xs font-bold hover:underline">Forgot?</button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-400 dark:text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-gray-50 dark:bg-[#252A31] border border-gray-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-12 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50 text-white rounded-2xl py-4 font-black transition-all shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 group relative overflow-hidden active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In as Rider</span>
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Links */}
                <div className="mt-8 text-center">
                    <p className="text-gray-600 dark:text-gray-500 font-medium">
                        New at GrubDash? <button className="text-orange-500 font-bold hover:underline">Join as a Rider</button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
