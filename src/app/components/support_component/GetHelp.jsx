"use client";

import React from "react";
import { FaRegCommentDots, FaInstagram } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { FaXTwitter, FaPhoneVolume } from "react-icons/fa6";

const links = [
  {
    name: "Chat",
    icon: <FaRegCommentDots className="text-xl text-orange-500" />,
    url: "https://wa.me/2349134831368",
  },
  {
    name: "Phone",
    icon: <FaPhoneVolume className="text-xl text-orange-500" />,
    url: "tel:2349134831368",
  },
  {
    name: "Email",
    icon: <MdOutlineEmail className="text-xl text-orange-500" />,
    url: "mailto:abdulquadrimahmud@gmail.com",
  },
  {
    name: "Twitter",
    icon: <FaXTwitter className="text-xl text-orange-500" />,
    url: "https://twitter.com/yourhandle",
  },
  {
    name: "Instagram",
    icon: <FaInstagram className="text-xl text-orange-500" />,
    url: "https://instagram.com/yourhandle",
  },
];

export default function GetHelp() {
  return (
    <div className="bg-white min-h-screen px-4 py-6">
      <div className="divide-y divide-orange-200">
        {links.map((item, index) => (
          <a
            key={index}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between my-4 py-2 px-3 rounded-t-xl hover:bg-orange-50 transition"
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="text-base font-medium">{item.name}</span>
            </div>
            <span className="text-orange-500 text-lg">›</span>
          </a>
        ))}
      </div>
    </div>
  );
}
