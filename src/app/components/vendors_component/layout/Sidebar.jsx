"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { PanelLeftClose, PanelRightClose } from "lucide-react";
import { useVendors } from "@/app/hooks/useVendorQueries";
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

export default function Sidebar() {
  const [open, setOpen] = useState(true); // expanded by default
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState(null); // tooltip state (nav name)
  const pathname = usePathname(); // e.g. "/vendors/my-foods"
  const [logoutLoading, setLogoutLoading] = useState(false);
  const {vendors, isLoading} = useVendors();
  const {baseUrl} = useApi();

  // determine active by checking if any path segment equals the nav href
  const pathSegments = (pathname || "") // ["vendors","my-foods"]
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
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ width: 80 }}
        animate={{ width: open ? 300 : 80 }}
        transition={{ duration: 0.28 }}
        className=" bg-white h-screen p-4 flex flex-col justify-between shadow-sm shadow-gray-100 hidden md:flex z-40"
        aria-label="Sidebar"
      >
        {/* Top: Logo + toggle */}
        <div>
          <div className="flex items-center justify-between mb-8">
            {open ? <Logo /> : <div className="w-8" aria-hidden />}
            <button
              onClick={() => setOpen((v) => !v)}
              className="text-gray-500 hover:text-[#FF6600] p-1 rounded focus:outline-none focus:ring-2 focus:ring-orange-200"
              aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            >
              {open ? <PanelLeftClose /> : <PanelRightClose />}
            </button>
          </div>

          {/* Vendor Info Card */}
          {
            open && (
              <div className="bg-white rounded-xl shadow border-gray-100 p-4 flex flex-col items-center text-center space-y-2 transition-all hover:shadow-lg hover:-translate-y-0.5">
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
            )
          }
          {/* Nav list */}
          <nav aria-label="Main navigation">
            <ul className="border-t border-gray-100 space-y-4 pt-10">
              {navItems.map((item) => {
                const active = isSegmentActive(item.href);
                return (
                  <li key={item.name} className="relative">
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-150 ease-in-out font-medium ${
                        active
                          ? "bg-orange-500/80 text-gray-100"
                          : "hover:bg-orange-50 bg-orange-50 text-gray-700 hover:text-orange-600"
                      }`}
                      onMouseEnter={() => setHovered(item.name)}
                      onMouseLeave={() => setHovered((h) => (h === item.name ? null : h))}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="text-lg">{item.icon}</span>

                      {/* label: animate in/out */}
                      <AnimatePresence mode="popLayout">
                        {open && (
                          <motion.span
                            key="label"
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            transition={{ duration: 0.18 }}
                            className="whitespace-nowrap"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>

                    {/* JS tooltip (shows when collapsed AND hovered) */}
                    {!open && hovered === item.name && (
                      <div
                        className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50"
                        style={{ pointerEvents: "none" }}
                      >
                        <div className="bg-[#FF6600] text-white text-xs px-3 py-2 rounded-md shadow-lg max-w-xs">
                          {item.tooltip}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Bottom: Logout */}
        <div>
          <button type="button" className="flex items-center gap-3 text-gray-600 hover:text-red-600 mt-6 transition px-2 py-2 rounded-md w-full justify-start" onClick={handleLogout}>
            <FaSignOutAlt className="text-lg" />
            {open && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
