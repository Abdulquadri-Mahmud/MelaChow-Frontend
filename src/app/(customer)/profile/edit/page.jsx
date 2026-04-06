"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

import {
    ArrowLeft, CheckCircle2, User, Mail, Phone, Camera, Save,
    Loader2, Edit3, Image as ImageIcon, X
} from "lucide-react";
import ProtectedRoute from "@/app/components/protected-route/ProtectedRoute";

// Cloudinary upload helper
const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "MelaChow");

    try {
        // âœ… Use fetch instead of axios to avoid Authorization header
        const res = await fetch(
            "https://api.cloudinary.com/v1_1/dypn7gna0/image/upload",
            {
                method: "POST",
                body: formData,
            }
        );

        if (!res.ok) {
            throw new Error(`Cloudinary upload failed: ${res.status}`);
        }

        const data = await res.json();
        return data.secure_url;
    } catch (err) {
        console.error("Cloudinary upload error:", err);
        return null;
    }
};

export default function EditProfilePage() {
    const { baseUrl } = useApi();
    const router = useRouter();
    const { user, isLoading: isUserLoading } = useUserStorage();
    const fileInputRef = useRef(null);

    const [userState, setUserState] = useState({
        firstname: "",
        lastname: "",
        email: "",
        phone: "",
        avatar: "",
    });

    const [loading, setLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarSuccess, setAvatarSuccess] = useState("");
    const [openProfileMessage, setOpenProfileMessage] = useState(false);

    useEffect(() => {
        if (user) {
            setUserState({
                firstname: user.firstname || "",
                lastname: user.lastname || "",
                email: user.email || "",
                phone: user.phone || "",
                avatar: user.avatar || "",
            });
        }
    }, [user]);

    const queryClient = useQueryClient();

    const handleSaveProfile = async (e) => {
        e.preventDefault(); // Prevent accidental form submit refreshing
        try {
            setLoading(true);
            const res = await fetch(`${baseUrl}/user/auth/update-profile`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firstname: userState.firstname,
                    lastname: userState.lastname,
                    phone: userState.phone,
                    avatar: userState.avatar,
                }),
            });
            const data = await res.json();
            if (data.status) {
                setAvatarSuccess("Your profile details have been updated.");
                setOpenProfileMessage(true);

                // âœ… Invalidate profile queries
                queryClient.invalidateQueries({ queryKey: ["userProfile"] });
                queryClient.invalidateQueries({ queryKey: ["user"] });

                setTimeout(() => {
                    // window.location.reload(); // Removed to allow cache to handle it
                }, 1500);
            } else {
                setAvatarSuccess("Failed to update profile. Please try again.");
                setOpenProfileMessage(true);
                setTimeout(() => setOpenProfileMessage(false), 3000);
            }
        } catch (err) {
            console.error("Update profile error:", err);
            setAvatarSuccess("An error occurred. Please check your connection.");
            setOpenProfileMessage(true);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarLoading(true);
        try {
            const url = await uploadToCloudinary(file);
            if (!url) throw new Error("Failed to upload image");

            // Optimistic update
            setUserState((prev) => ({ ...prev, avatar: url }));

            const res = await fetch(`${baseUrl}/user/auth/update-profile`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatar: url }),
            });
            const data = await res.json();

            if (data.status) {
                setAvatarSuccess("Profile photo updated!");
                setOpenProfileMessage(true);

                // âœ… Invalidate profile queries
                queryClient.invalidateQueries({ queryKey: ["userProfile"] });
                queryClient.invalidateQueries({ queryKey: ["user"] });

                setTimeout(() => setOpenProfileMessage(false), 2000);
            } else {
                setAvatarSuccess("Failed to save profile photo.");
                setOpenProfileMessage(true);
            }
        } catch (err) {
            console.error(err);
            setAvatarSuccess("Could not upload photo.");
            setOpenProfileMessage(true);
        } finally {
            setAvatarLoading(false);
        }
    };

    if (isUserLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={40} className="text-orange-500 animate-spin" />
                    <p className="text-gray-400 dark:text-zinc-500 font-medium text-sm animate-pulse">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans pb-20">
                {/* Custom Header for Edit Page */}
                <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between px-4 py-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 rounded-xl bg-gray-100/50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <span className="text-sm font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Edit Profile</span>
                    <div className="w-10"></div> {/* Spacer for balance */}
                </div>

                <div className="max-w-xl mx-auto pt-6 px-4">

                    {/* AVATAR UPLOAD SECTION */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="relative group">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1.5 bg-white dark:bg-zinc-900 border-2 border-dashed border-gray-300 dark:border-zinc-700 shadow-xl overflow-hidden cursor-pointer" onClick={handleAvatarClick}>
                                <div className="w-full h-full rounded-full overflow-hidden relative bg-gray-100 dark:bg-zinc-800">
                                    {userState.avatar ? (
                                        <img
                                            src={userState.avatar}
                                            alt="Avatar"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-zinc-600">
                                            <User size={48} />
                                        </div>
                                    )}

                                    {/* Hosting Overlay */}
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                        <Camera size={24} className="mb-1" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Change</span>
                                    </div>

                                    {avatarLoading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                            <Loader2 size={24} className="text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleAvatarClick}
                                className="absolute bottom-1 right-1 p-2.5 bg-gray-900 text-white rounded-full border-[3px] border-white shadow-lg hover:bg-orange-600 transition-colors"
                            >
                                <Edit3 size={16} />
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} accept="image/*" />
                        </div>
                        <p className="mt-4 text-sm font-bold text-gray-400 dark:text-zinc-500">Tap to update your photo</p>
                    </div>

                    {/* FORM SECTION */}
                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 md:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none space-y-6 border border-gray-100 dark:border-zinc-800"
                        onSubmit={handleSaveProfile}
                    >
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider pl-1">First Name</label>
                                <input
                                    type="text"
                                    value={userState.firstname}
                                    onChange={(e) => setUserState((prev) => ({ ...prev, firstname: e.target.value }))}
                                    className="w-full bg-gray-50 dark:bg-zinc-800 rounded-2xl px-4 py-3.5 font-bold text-gray-900 dark:text-white outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all border border-transparent dark:border-zinc-700 dark:placeholder-zinc-500"
                                    placeholder="First Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider pl-1">Last Name</label>
                                <input
                                    type="text"
                                    value={userState.lastname}
                                    onChange={(e) => setUserState((prev) => ({ ...prev, lastname: e.target.value }))}
                                    className="w-full bg-gray-50 dark:bg-zinc-800 rounded-2xl px-4 py-3.5 font-bold text-gray-900 dark:text-white outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all border border-transparent dark:border-zinc-700 dark:placeholder-zinc-500"
                                    placeholder="Last Name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider pl-1">Phone Number</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500">
                                    <Phone size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={userState.phone}
                                    onChange={(e) => setUserState((prev) => ({ ...prev, phone: e.target.value }))}
                                    className="w-full bg-gray-50 dark:bg-zinc-800 rounded-2xl pl-12 pr-4 py-3.5 font-bold text-gray-900 dark:text-white outline-none focus:bg-white dark:focus:bg-zinc-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all border border-transparent dark:border-zinc-700 dark:placeholder-zinc-500"
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 opacity-60">
                            <label className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider pl-1">Email <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-gray-500 dark:text-zinc-400">Read-only</span></label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={userState.email}
                                    disabled
                                    className="w-full bg-gray-100/50 dark:bg-zinc-800/50 rounded-2xl pl-12 pr-4 py-3.5 font-bold text-gray-500 dark:text-zinc-500 outline-none cursor-not-allowed border border-gray-100 dark:border-zinc-800"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 py-4 rounded-[20px] font-bold text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800 border border-transparent dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-[2] py-4 rounded-[20px] font-bold text-white bg-gray-900 shadow-xl shadow-gray-900/20 hover:bg-orange-600 hover:shadow-orange-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 size={20} className="animate-spin text-white" />
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.form>
                </div>

                {/* SUCCESS TOAST MODAL */}
                <AnimatePresence>
                    {openProfileMessage && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-white rounded-[32px] p-8 w-full max-w-sm text-center shadow-2xl border border-white/50"
                            >
                                <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="text-emerald-500" size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Updated!</h3>
                                <p className="text-gray-500 font-medium mb-6 leading-relaxed">{avatarSuccess}</p>
                                <button
                                    onClick={() => setOpenProfileMessage(false)}
                                    className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all text-sm uppercase tracking-widest"
                                >
                                    Dismiss
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </ProtectedRoute>
    );
}

