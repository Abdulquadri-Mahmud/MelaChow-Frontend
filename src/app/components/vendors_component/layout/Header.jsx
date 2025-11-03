"use client";
import { useVendors } from "@/app/hooks/useVendorQueries";
import { FaBell } from "react-icons/fa";
import VendorProfileImageSkeleton from "../../skeletons/VendorProfileImageSkeleton";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FaUtensils,
  FaClipboardList,
  FaUser,
  FaStar,
  FaSignOutAlt,
  FaHome,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import Logo from "../../logo/Logo";
import { useState } from "react";
import { useApi } from "@/app/context/ApiContext";

const navItems = [
  {
    name: "Dashboard",
    icon: <FaHome />,
    href: "/vendors/dashboard",
    tooltip: "View key metrics and insights at a glance",
  },
  {
    name: "My Foods",
    icon: <FaUtensils />,
    href: "/vendors/my-foods",
    tooltip: "Manage, edit, and view all your food items",
  },
  {
    name: "Create Food",
    icon: <FaUtensils />,
    href: "/vendors/create-food",
    tooltip: "Create food items",
  },
  {
    name: "Orders",
    icon: <FaClipboardList />,
    href: "/vendors/orders",
    tooltip: "Track and manage customer orders in real time",
  },
  {
    name: "Reviews",
    icon: <FaStar />,
    href: "/vendors/reviews",
    tooltip: "Check customer ratings and feedback",
  },
  {
    name: "Profile",
    icon: <FaUser />,
    href: "/vendors/profile",
    tooltip: "View and edit your vendor profile details",
  },
];

export default function Header() {
  const {vendors, isLoading} = useVendors()
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname(); // e.g. "/vendors/my-foods"
  const [logoutLoading, setLogoutLoading] = useState(false);
  const {baseUrl} = useApi();

  const router = useRouter();

  // determine active by checking if any path segment equals the nav href
  const pathSegments = (pathname || "/vendors") // ["vendors","my-foods"]
  const isSegmentActive = (href) => pathSegments.includes(href);
  
  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      const res = await fetch(`${baseUrl}/vendor/auth/logout`, {
        method: "POST",
        credentials: "include",
        // headers: {
        //   Authorization: `Bearer ${token}`,
        // },
      });

      const data = await res.json();

      if (data.success) {
        localStorage.removeItem("vendorToken");
        localStorage.removeItem("vendorToken");
        router.push("/vendors/auth/login");
      } else {
        console.error("Logout failed:", data);
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <header className="flex justify-between items-center bg-white p-4">
      {/* Mobile toggle button */}
      <button onClick={() => setMobileOpen(true)} className="fixed top-4 left-4 z-50 bg-[#FF6600] text-white p-2 rounded-md shadow-md md:hidden" aria-label="Open menu">
        <FaBars size={18} />
      </button>

      <h2 className="md:text-xl sm:text-lg md:ml-0 ml-12 font-semibold text-gray-800">Welcome, {vendors?.data?.storeName}</h2>
      <div className="flex items-center gap-4">
        <button className="relative">
          <FaBell className="text-gray-600 text-xl" />
          <span className="absolute -top-1 -right-1 bg-[#FF6600] w-2 h-2 rounded-full"></span>
        </button>
        {
          isLoading ? <>
            <VendorProfileImageSkeleton/>
          </> : <>
            <img
              src={`${vendors ? `${vendors?.data?.logo}` : `${vendors?.data?.logo}`}`}
              alt={`${vendors?.data?.storeName}`}
              className="w-10 h-10 rounded-full border-2 border-orange-400"
            />
          </>
        }
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 bg-black z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              exit={{ x: -250 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="fixed top-0 left-0 w-[350px] h-screen bg-white shadow-lg p-2 z-50 md:hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <Logo />
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="text-gray-500 hover:text-[#FF6600]"
                    aria-label="Close menu"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                {/* Vendor Info Card */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 flex flex-col items-center text-center space-y-2 transition-all hover:shadow-lg hover:-translate-y-0.5">
                  {/* Avatar or Logo */}
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-2xl">
                    {vendors?.data?.storeName?.charAt(0)?.toUpperCase() || "V"}
                  </div>

                  {/* Vendor Details */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{vendors?.data?.storeName}</h2>
                    <p className="text-sm text-gray-500">
                      {vendors?.data?.email || "vendor@email.com"}
                    </p>
                    <p className="text-sm mt-1 text-gray-500">
                      {vendors?.data?.phone || "vendor@email.com"}
                    </p>
                  </div>

                  {/* Stats / Quick Info */}
                  {/* <div className="flex items-center justify-center gap-3 mt-2 text-xs">
                    <div className="bg-orange-50 px-2 py-1 rounded-full text-orange-700 font-medium">
                      Foods: {vendors?.data?.foods?.length || 0}
                    </div>
                    <div className="bg-green-50 px-2 py-1 rounded-full text-green-700 font-medium">
                      Active: {vendors?.data?.isActive ? "Yes" : "No"}
                    </div>
                  </div> */}

                  {/* Optional Button / Link */}
                  {/* <button
                    onClick={() => router.push("/vendors/profile")}
                    className="mt-3 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 px-4 py-1.5 rounded-lg transition-all"
                  >
                    View Profile
                  </button> */}
                </div>



                <nav className="mt-4">
                  <ul className="space-y-3">
                    {navItems.map((item) => {
                      const active = isSegmentActive(item.href);
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all font-medium ${
                              active
                                ? "bg-orange-500 text-white shadow-md"
                                : "hover:bg-orange-50 bg-orange-50 text-gray-700 hover:text-orange-600"
                            }`}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span className="text-sm">{item.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>

              <div>
                <button className="flex items-center gap-3 bg-gray-800 font-medium cursor-pointer text-red-300 hover:text-red-400 mt-6 transition w-full justify-start px-3 py-2 rounded-md" onClick={handleLogout}>
                  <FaSignOutAlt /> <span className="ml-2">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
} 
