"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import { FaUser, FaUpload, FaUserCheck, FaPhone } from "react-icons/fa";
import { MdMarkEmailRead } from "react-icons/md";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { ArrowLeft, CheckCircle2, User, Mail, Phone, Camera, Save } from "lucide-react";
import Header2 from "@/app/components/App_Header/Header2";
import ProtectedRoute from "@/app/components/protected-route/ProtectedRoute";
import { useQuery } from "@tanstack/react-query";
import { fetchUser } from "@/app/lib/api";

// Cloudinary upload helper
const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "GrubDash");
    try {
        const res = await axios.post(
            "https://api.cloudinary.com/v1_1/dypn7gna0/image/upload",
            formData
        );
        return res.data.secure_url;
    } catch (err) {
        console.error("Cloudinary upload error:", err);
        return null;
    }
};

export default function EditProfilePage() {
    const { baseUrl } = useApi();
    const router = useRouter();
    const { user } = useUserStorage();
    const fileInputRef = useRef(null);
    const token = user?.token;

    const { data: userData, isLoading, refetch } = useQuery({
        queryKey: ["user", token],
        queryFn: () => fetchUser(token),
        enabled: !!token,
    });

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
        if (userData?.user) {
            setUserState({
                firstname: userData.user.firstname || "",
                lastname: userData.user.lastname || "",
                email: userData.user.email || "",
                phone: userData.user.phone || "",
                avatar: userData.user.avatar || "",
            });
        }
    }, [userData]);

    const handleSaveProfile = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${baseUrl}/user/auth/update-profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
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
                setAvatarSuccess("Profile updated successfully!");
                localStorage.setItem("user", JSON.stringify(data.user));
                setOpenProfileMessage(true);
                refetch();
                setTimeout(() => setOpenProfileMessage(false), 3000);
            } else {
                setAvatarSuccess("Failed to update profile");
                setOpenProfileMessage(true);
                setTimeout(() => setOpenProfileMessage(false), 3000);
            }
        } catch (err) {
            console.error("Update profile error:", err);
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

            const res = await fetch(`${baseUrl}/user/auth/update-profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ avatar: url }),
            });
            const data = await res.json();

            if (data.status) {
                setUserState((prev) => ({ ...prev, avatar: url }));
                localStorage.setItem("user", JSON.stringify(data.user));
                setAvatarSuccess("Profile image updated!");
                setOpenProfileMessage(true);
                refetch();
            } else {
                setAvatarSuccess("Failed to update profile image.");
                setOpenProfileMessage(true);
            }
        } catch (err) {
            console.error(err);
            setAvatarSuccess("An error occurred during upload.");
            setOpenProfileMessage(true);
        } finally {
            setAvatarLoading(false);
            setTimeout(() => setOpenProfileMessage(false), 3000);
        }
    };

    if (isLoading || !userData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-full" />
                    <div className="w-32 h-4 bg-gray-200 rounded-md" />
                </div>
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50/50">
                <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 flex items-center gap-4 px-6 py-4 shadow-sm">
                    <motion.button
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.back()}
                        className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </motion.button>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Edit Profile</h1>
                </header>

                <main className="max-w-xl mx-auto pt-24 pb-20 px-4">
                    <section className="bg-white rounded-[32px] shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                        {/* Profile Hero Section */}
                        <div className="relative h-32 overflow-hidden">
                            {userState.avatar ? (
                                <>
                                    <img
                                        src={userState.avatar}
                                        alt="Cover"
                                        className="w-full h-full object-cover blur-[2px] brightness-[0.8] scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
                                </>
                            ) : (
                                <div className="w-full h-full bg-orange-500" />
                            )}
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-orange-400/20 blur-3xl opacity-50" />
                            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-white/10 blur-2xl opacity-50" />
                        </div>

                        <div className="relative px-6 pb-8">
                            <div className="relative -mt-16 mb-6 flex flex-col items-center">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-3xl border-4 border-white overflow-hidden bg-gray-100 shadow-xl">
                                        {userState.avatar ? (
                                            <img src={userState.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                <User className="w-12 h-12 text-gray-300" />
                                            </div>
                                        )}
                                        {avatarLoading && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleAvatarClick}
                                        className="absolute -bottom-2 -right-2 p-3 bg-white text-orange-500 rounded-2xl shadow-lg border border-gray-100 hover:scale-110 active:scale-95 transition-all group"
                                    >
                                        <Camera size={20} />
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} accept="image/*" />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">First Name</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                                <User size={16} />
                                            </div>
                                            <input
                                                type="text"
                                                value={userState.firstname}
                                                onChange={(e) => setUserState((prev) => ({ ...prev, firstname: e.target.value }))}
                                                className="w-full bg-gray-50 border border-transparent focus:border-orange-500 focus:bg-white rounded-2xl py-3.5 pl-10 pr-4 text-sm font-semibold outline-none transition-all focus:ring-4 focus:ring-orange-500/5 text-gray-800"
                                                placeholder="John"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Last Name</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                                <User size={16} />
                                            </div>
                                            <input
                                                type="text"
                                                value={userState.lastname}
                                                onChange={(e) => setUserState((prev) => ({ ...prev, lastname: e.target.value }))}
                                                className="w-full bg-gray-50 border border-transparent focus:border-orange-500 focus:bg-white rounded-2xl py-3.5 pl-10 pr-4 text-sm font-semibold outline-none transition-all focus:ring-4 focus:ring-orange-500/5 text-gray-800"
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Phone Number</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                            <Phone size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            value={userState.phone}
                                            onChange={(e) => setUserState((prev) => ({ ...prev, phone: e.target.value }))}
                                            className="w-full bg-gray-50 border border-transparent focus:border-orange-500 focus:bg-white rounded-2xl py-3.5 pl-10 pr-4 text-sm font-semibold outline-none transition-all focus:ring-4 focus:ring-orange-500/5 text-gray-800"
                                            placeholder="080 0000 0000"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1 opacity-60">Email Address (Read Only)</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
                                            <Mail size={16} />
                                        </div>
                                        <input
                                            type="email"
                                            value={userState.email}
                                            disabled
                                            className="w-full bg-gray-50/50 border border-transparent rounded-2xl py-3.5 pl-10 pr-4 text-sm font-semibold text-gray-400 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveProfile}
                                    disabled={loading}
                                    className="w-full mt-4 bg-orange-500 text-white rounded-[20px] py-4 text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </section>
                </main>

                <AnimatePresence>
                    {openProfileMessage && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setOpenProfileMessage(false)}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-white rounded-[32px] p-8 w-full max-w-sm text-center relative z-10 shadow-2xl"
                            >
                                <div className="mx-auto w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
                                    <CheckCircle2 className="text-green-500" size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
                                <p className="text-sm font-medium text-gray-400 mb-6">{avatarSuccess}</p>
                                <button
                                    onClick={() => setOpenProfileMessage(false)}
                                    className="w-full bg-green-500 text-white py-3.5 rounded-2xl font-bold hover:bg-green-600 transition-all"
                                >
                                    Awesome
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </ProtectedRoute>
    );
}
