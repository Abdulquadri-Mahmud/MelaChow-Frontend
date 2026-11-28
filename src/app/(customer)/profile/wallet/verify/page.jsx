"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyWalletTransaction } from "@/app/lib/api";
import { Loader2, Check, XCircle, Wallet, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

function VerifyWalletComponent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const reference = searchParams.get("reference");

    const [status, setStatus] = useState("verifying"); // verifying | success | failed
    const [message, setMessage] = useState("Verifying transaction...");
    const didVerify = useRef(false);
    const retryTimeoutRef = useRef(null);
    const retryCountRef = useRef(0);

    const runVerification = async () => {
        if (!reference) return;
        setStatus("verifying");
        try {
            const res = await verifyWalletTransaction(reference);
            if (res.success) {
                setStatus("success");
                window.__melachowPaymentVerified?.(reference);
                setMessage(res.message || "Wallet funded successfully!");
                toast.success("Wallet funded successfully!");
                return;
            }
            throw Object.assign(new Error(res.message || "Verification failed."), {
                paymentPending: Boolean(res.paymentPending),
                status: res.paymentPending ? 202 : 400,
            });
        } catch (error) {
            const statusCode = error.status || error.response?.status;
            const retryable = Boolean(error.paymentPending) || !statusCode || statusCode === 202 || statusCode === 408 || statusCode === 429 || statusCode >= 500;
            const retryDelays = [1500, 2500, 3500, 5000];
            if (retryable && retryCountRef.current < retryDelays.length) {
                const delay = retryDelays[retryCountRef.current];
                retryCountRef.current += 1;
                setStatus("verifying");
                setMessage("Confirming your wallet funding with Paystack...");
                retryTimeoutRef.current = setTimeout(() => {
                    retryTimeoutRef.current = null;
                    runVerification();
                }, delay);
                return;
            }
            console.error(error);
            setStatus("failed");
            setMessage(error.response?.data?.message || error.message || "An error occurred during verification.");
            toast.error(error.response?.data?.message || "An error occurred during verification.");
        }
    };

    useEffect(() => {
        if (!reference || didVerify.current) return;
        didVerify.current = true;
        const initialDelay = process.env.NEXT_PUBLIC_MOBILE_BUILD === "true" ? 700 : 0;
        if (initialDelay > 0) {
            retryTimeoutRef.current = setTimeout(() => {
                retryTimeoutRef.current = null;
                runVerification();
            }, initialDelay);
        } else {
            runVerification();
        }
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }
        };
    }, [reference]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-xl border border-gray-100"
            >
                {status === "verifying" && (
                    <div className="flex flex-col items-center">
                        <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                            <div className="w-20 h-20 border-4 border-orange-100 rounded-full" />
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 0.95, ease: "linear" }}
                                className="w-20 h-20 border-4 border-orange-500 rounded-full border-t-transparent border-l-transparent absolute inset-0"
                            />
                            <motion.span
                                animate={{ rotate: -360 }}
                                transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <Loader2 className="text-orange-500" size={24} />
                            </motion.span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
                        <p className="text-gray-500 text-sm">{message || "Please wait while we confirm your wallet funding..."}</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <Check size={40} strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
                        <p className="text-gray-500 text-sm mb-8">{message}</p>

                        <button
                            onClick={() => router.push("/profile/wallet")}
                            className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Wallet size={18} /> Back to Wallet
                        </button>
                    </div>
                )}

                {status === "failed" && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <XCircle size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
                        <p className="text-gray-500 text-sm mb-8">{message}</p>

                        <div className="w-full space-y-2.5">
                            <button
                                onClick={() => {
                                    retryCountRef.current = 0;
                                    runVerification();
                                }}
                                className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all active:scale-[0.98]"
                            >
                                Retry Verification
                            </button>
                            <button
                                onClick={() => router.push("/profile/wallet")}
                                className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all active:scale-[0.98]"
                            >
                                Return to Wallet
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

export default function VerifyWalletPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-orange-500" size={32} />
            </div>
        }>
            <VerifyWalletComponent />
        </Suspense>
    );
}
