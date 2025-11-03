"use client";

import React from "react";
import { FaUser, FaUpload, FaUserCheck } from "react-icons/fa";
import { MdMarkEmailRead } from "react-icons/md";
import { FaPhone } from "react-icons/fa6";
import { ChevronRight, BadgeQuestionMark, HeartHandshake, MapPinHouse } from "lucide-react";
import { ArrowLeftOnRectangleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import NeedHelp from "@/app/profile/need_help_contact_info/NeedHelp";

// ===================
// SidebarContent Component
// ===================
const SidebarContent = ({
  userState,
  avatarLoading,
  handleAvatarClick,
  fileInputRef,
  handleAvatarChange,
  logoutLoading,
  handleLogout,
  handleDeleteAccountPrompt,
  openProfileImageMessage,
  setOpenProfileMessage,
}) => {
  return (
    <div className="overflow-y-scroll mb-12 scroll-smooth -webkit-overflow-scrolling-touch scroll_y flex flex-col items-center text-center">
      <div className="relative mt-10">
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
      <h2 className="font-semibold text-lg flex items-center gap-1 text-gray-600">
        <span className="text-orange-500"><FaUserCheck/></span>
        {userState.firstname} {userState.lastname}
      </h2>
      <p className="text-gray-500 text-sm flex items-center gap-1"><span className="text-orange-500"><MdMarkEmailRead/></span> {userState.email}</p>
      <p className="text-gray-500 text-sm flex items-center gap-1"><span className="text-orange-500"><FaPhone/></span> {userState.phone}</p>
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
      <div className="mt-8 flex flex-col gap-1 w-full">
        <Link href='/profile/address' className='py-3 rounded-t-2xl text-start px-4 hover:bg-gray-100 transition flex items-center justify-between gap-2 border-b border-gray-100 font-normal text-sm text-gray-700'>
          <div className="flex items-center gap-1">
            <MapPinHouse className='w-4 h-4'/>
            Address
          </div>
          <ChevronRight className='w-4 h-4' />
        </Link>
        <Link href='/get-help' className='py-3 rounded-t-2xl text-start px-4 hover:bg-gray-100 transition flex items-center justify-between gap-2 border-b border-gray-100 font-normal text-sm text-gray-700'>
          <div className="flex items-center gap-1">
            <HeartHandshake className='w-4 h-4'/>
            Get Help
          </div>
          <ChevronRight className='w-4 h-4' />
        </Link>
        <Link href='/faqs' className='py-3 rounded-t-2xl text-start px-4 hover:bg-gray-100 transition flex items-center justify-between gap-2 border-b border-gray-100 font-normal text-sm text-gray-700'>
          <div className="flex items-center gap-1">
            <BadgeQuestionMark className='w-4 h-4'/>
            FAQs
          </div>
          <ChevronRight className='w-4 h-4' />
        </Link>
      </div>
      
      <div className="w-full">
        <button onClick={handleLogout} className="cursor-pointer mt-2 rounded-t-2xl flex items-center justify-between text-sm font-normal border-b border-gray-100 gap-2 px-4 py-3 text-gray-700 hover:bg-gray-100 transition w-full">
          <div className="flex items-center gap-1">
            <ArrowLeftOnRectangleIcon className='w-4 h-4' />
            {logoutLoading ? "Logging out..." : "Logout"}
          </div>
          <ChevronRight className='w-4 h-4'/>
        </button>

        
        <button onClick={handleDeleteAccountPrompt} className="cursor-pointer mt-2 rounded-t-2xl flex items-center justify-between text-sm font-normal border-b border-gray-100 gap-2 px-4 py-3 text-red-500 hover:bg-gray-100 transition w-full">
          <div className="flex items-center gap-1">
            <ExclamationTriangleIcon className='w-4 h-4' />
            Delete Account
          </div>
          <ChevronRight className='w-4 h-4'/>
        </button>
        <NeedHelp/>
      </div>
    </div>
  );
};

export default SidebarContent;