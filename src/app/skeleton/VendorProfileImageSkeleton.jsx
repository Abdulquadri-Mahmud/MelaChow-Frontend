"use client";
import { motion } from "framer-motion";

export default function VendorProfileImageSkeleton() {
    const shimmer = {
        hidden: { opacity: 0 },
        visible: {
        opacity: 1,
        transition: {
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
        },
        },
    };

    return (
        <>
            <motion.div variants={shimmer} initial="hidden" animate="visible" className="bg-white">
                <div className="bg-gray-200 w-10 h-10 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
            </motion.div>
        </>
    )
}