"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/app/context/ApiContext";
import { FaUser, FaUpload } from "react-icons/fa";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Logs, X,ArrowLeft } from "lucide-react";
import { FaUserCheck } from "react-icons/fa";
import { MdMarkEmailRead } from "react-icons/md";
import { FaPhone } from "react-icons/fa6";
import SidebarContent from "./SidebarContent";
import ProfileForm from "./ProfileForm";
import DeleteModal from "./DeleteModal";


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

const User_Profile = ({ userData, isLoading, onProfileUpdate }) => {
  const { baseUrl } = useApi();
  const router = useRouter();
  const { clearUser } = useUserStorage();
  const fileInputRef = useRef(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;

  const [userState, setUserState] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    avatar: "",
  });

  // console.log(userData); 

  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [openProfileImageMessage, setOpenProfileMessage] = useState(false);

  useEffect(() => {
    if (userData) {
      setUserState({
        firstname: userData.firstname || "",
        lastname: userData.lastname || "",
        email: userData.email || "",
        phone: userData.phone || "",
        avatar: userData.avatar || "",
      });
    }
  }, [userData]);

  if (isLoading || !userData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-pulse flex flex-col gap-3 items-center">
          <div className="w-24 h-24 bg-gray-300 rounded-full" />
          <div className="w-40 h-5 bg-gray-300 rounded-md" />
          <div className="w-52 h-4 bg-gray-200 rounded-md" />
        </div>
        <p className="text-gray-500 mt-6">Loading your profile...</p>
      </div>
    );
  }

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
        onProfileUpdate?.();
        setTimeout(() => setAvatarSuccess(""), 3000);
      } else {
        setAvatarSuccess("Failed to update profile");
        setTimeout(() => setAvatarSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Update profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  // handle upload profile image and save to the database 
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarLoading(true);

    try {
      // 1️⃣ Upload to Cloudinary
      const url = await uploadToCloudinary(file);
      if (!url) throw new Error("Failed to upload image");

      // 2️⃣ Update avatar in DB immediately
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
        setAvatarSuccess("Profile image updated successfully!");
        setOpenProfileMessage(true); // open modal
        onProfileUpdate?.(); // trigger any parent callback
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
      // Clear the message after 3s
      setTimeout(() => setOpenProfileMessage(false), 3000);
    }
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      const res = await fetch(`${baseUrl}/user/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        localStorage.removeItem("userToken");
        clearUser();
        router.push("/auth/signin");
      } else {
        console.error("Logout failed:", data.message);
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleDeleteAccountPrompt = () => {
    setIsDeleteModalOpen(true);
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const res = await fetch(`${baseUrl}/user/auth/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        localStorage.removeItem("token");
        clearUser();
        router.push("/auth/signup");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="scroll-smooth -webkit-overflow-scrolling-touch flex flex-col md:flex-row gap-3 md:mb-0 mb-20 md:pt-6 max-w-5xl mx-auto">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white p-6 rounded-lg">
        <SidebarContent
          userState={userState}
          avatarLoading={avatarLoading}
          handleAvatarClick={handleAvatarClick}
          fileInputRef={fileInputRef}
          handleAvatarChange={handleAvatarChange}
          logoutLoading={logoutLoading}
          handleLogout={handleLogout}
          handleDeleteAccountPrompt={handleDeleteAccountPrompt}
        />
      </aside>

      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden flex justify-between items-center z-50 bg-white px-4 py-3 rounded-xl sticky top-0">
        <button onClick={() => router.back()} className="rounded-full cursor-pointer hover:bg-gray-100 transition" aria-label="Go back">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <button onClick={() => setMobileSidebarOpen(true)} className="text-orange-500 text-xl font-bold cursor-pointer">
          <Logs />
        </button>
      </div>
      
      <div className="md:hidden block">
        <div className="relative w-24 mx-auto">
          {userState.avatar ? (
            <img src={userState.avatar} alt="User Avatar" className="w-24 h-24 rounded-full border-4 border-orange-500 mb-3 object-cover"/>
          ) : (
            <FaUser className="text-gray-400 w-24 h-24 mb-3" />
          )}
          <button onClick={handleAvatarClick} className="cursor-pointer absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full text-white hover:bg-orange-600 transition">
            {avatarLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            ) : (
              <FaUpload className="w-4 h-4" />
            )}
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} accept="image/*"/>
        </div>
        <div className="flex justify-center flex-col items-center">
          <h2 className="font-semibold text-lg flex items-center gap-1 text-gray-600">
            <span className="text-orange-500"><FaUserCheck/></span>
            {userState.firstname} {userState.lastname}
          </h2>
          <p className="text-gray-500 text-sm flex items-center gap-1"><span className="text-orange-500"><MdMarkEmailRead/></span> {userState.email}</p>
          <p className="text-gray-500 text-sm flex items-center gap-1"><span className="text-orange-500"><FaPhone/></span> {userState.phone}</p>
        </div>
      </div>

      {openProfileImageMessage && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white p-6 rounded shadow-md w-full max-w-md"
            >
              <h3 className="text-green-500 text-xl font-semibold">Profile Image</h3>
              <p className="text-gray-600 mt-4">{avatarSuccess}</p>
              <div className="w-full flex justify-end mt-6">
                <button
                  onClick={() => setOpenProfileMessage(false)}
                  className="py-2 px-6 bg-green-500 rounded text-white hover:bg-green-600"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="fixed inset-y-0 left-0 bg-white w-[100%] z-50 p-6 shadow-lg flex flex-col"
          >
            <div className="absolute top-0 right-0 m-2">
              <button onClick={() => setMobileSidebarOpen(false)} className="mb-4 text-white bg-red-500 rounded-md p-1 cursor-pointer">
                <X />
              </button>
            </div>
            <SidebarContent
              userState={userState}
              avatarLoading={avatarLoading}
              handleAvatarClick={handleAvatarClick}
              fileInputRef={fileInputRef}
              handleAvatarChange={handleAvatarChange}
              logoutLoading={logoutLoading}
              handleLogout={handleLogout}
              handleDeleteAccountPrompt={handleDeleteAccountPrompt}
              openProfileImageMessage={openProfileImageMessage}
              setOpenProfileMessage={setOpenProfileMessage}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 bg-white md:p-6 p-3 rounded-lg">
        <ProfileForm
          userState={userState}
          setUserState={setUserState}
          loading={loading}
          handleSaveProfile={handleSaveProfile}
          avatarSuccess={avatarSuccess}
          openProfileImageMessage={openProfileImageMessage}
          setOpenProfileMessage={setOpenProfileMessage}
        />
      </main>

      <DeleteModal
        isDeleteModalOpen={isDeleteModalOpen}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        confirmDelete={confirmDelete}
        deleteLoading={deleteLoading}
      />
    </div>
  );
};

export default User_Profile;