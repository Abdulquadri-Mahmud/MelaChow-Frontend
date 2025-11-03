"use client";

import { useApi } from "@/app/context/ApiContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import Link from "next/link";

const LogoImage = () => (
  <img
    src="/logo.png"
    alt="ChowConnect Logo"
    className="w-[170px] object-contain"
  />
);

export default function Signup() {
  const { baseUrl } = useApi();
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    avatar: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${baseUrl}/user/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Signup successful! 🎉");
        setFormData({
          firstname: "",
          lastname: "",
          email: "",
          phone: "",
          avatar: "",
          password: "",
        });
        router.push("/auth/signin");
      } else {
        setMessage(data.message || "Signup failed. Please try again.");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center overflow-auto">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl flex-shrink-0">
        <div className="flex justify-center mb-4">
          <LogoImage />
        </div>
        <p className="text-center text-sm text-gray-600 mb-6">
          Create your account to start ordering
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <FiUser className="absolute left-3 top-3.5 text-gray-400 text-lg" />
              <input
                type="text"
                name="firstname"
                placeholder="First name"
                value={formData.firstname}
                onChange={handleChange}
                className="border border-gray-200 rounded-lg p-3 pl-10 w-full focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                required
              />
            </div>
            <div className="relative">
              <FiUser className="absolute left-3 top-3.5 text-gray-400 text-lg" />
              <input
                type="text"
                name="lastname"
                placeholder="Last name"
                value={formData.lastname}
                onChange={handleChange}
                className="border border-gray-200 rounded-lg p-3 pl-10 w-full focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="relative">
            <FiMail className="absolute left-3 top-3.5 text-gray-400 text-lg" />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              className="border border-gray-200 rounded-lg w-full p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              required
            />
          </div>

          {/* Phone */}
          <div className="relative">
            <FiPhone className="absolute left-3 top-3.5 text-gray-400 text-lg" />
            <input
              type="number"
              name="phone"
              placeholder="Phone number"
              value={formData.phone}
              onChange={handleChange}
              className="border border-gray-200 rounded-lg w-full p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <FiLock className="absolute left-3 top-3.5 text-gray-400 text-lg" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="border border-gray-200 rounded-lg w-full p-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF6B00] text-white py-3 rounded-lg mt-2 font-medium hover:bg-[#e65c00] transition-colors"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        {message && (
          <p
            className={`text-center mt-4 text-sm ${
              message.includes("successful") ? "text-green-600" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        <p className="text-start text-gray-500 text-sm mt-3">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="text-[#FF6B00] font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
        <p className="text-sm text-start mt-4">
          Looking to grow your food business?{" "}
          <Link
            href="/vendors/auth/register"
            className="text-orange-500 font-medium hover:underline"
          >
            Join the GrubDash Vendor Network
          </Link>
        </p>
      </div>
    </div>
  );
}
