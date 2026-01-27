"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Bell } from "lucide-react";
import { FaUser } from "react-icons/fa";
import { fetchUser } from "@/app/lib/api";
import Link from "next/link";
import { BiCartAdd } from "react-icons/bi";
import { useCart } from "@/app/context/CartContext";

export default function HomeHeader() {
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);

  const { cart } = useCart();
  const totalItems = cart.length;

  useEffect(() => {
    const storedToken = localStorage.getItem("userToken");
    setToken(storedToken || null);
  }, []);

  // Fetch user data only if token exists
  const { data, isLoading, isError } = useQuery({
    queryKey: ["userProfile", token],
    queryFn: () => fetchUser(token),
    enabled: !!token,
    retry: false,
  });


  useEffect(() => {
    if (data?.user) {
      setUserData(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    }
  }, [data]);

  
  const defaultAddress = userData?.addresses?.find(addr => addr.isDefault);
  // console.log(defaultAddress)

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-50"
    >
      {/* Location Info */}
      <div>
        <p className="text-xs text-gray-700 flex items-center gap-1">
          <MapPin size={14} className="text-[#FF6B00]" />
          Deliver to
        </p>

        <h2 className="font-semibold text-gray-800 text-sm">
          {defaultAddress 
            ? `${defaultAddress?.city}, ${defaultAddress?.state}`
            : "Select your address"}
        </h2>
      </div>


      {/* Right Icons */}
      <div className="flex items-center gap-4">
        <Link href={'/orders'}>
          <motion.div whileHover={{ rotate: 15 }} className="relative">
            <BiCartAdd className="text-gray-700" size={22} />
            <span className="absolute -top-1 -right-1 bg-[#FF6B00] animate-bounce animation-duration-0.1 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold text-md">
              {totalItems}
            </span>
          </motion.div>
        </Link>

        {isLoading ? (
          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ) : userData?.avatar ? (
            <Link href='/profile'>
              <img src={userData.avatar} alt="User Avatar" className="w-9 h-9 rounded-full object-cover border-2 border-[#FF6B00]"/>
            </Link>
        ) : (
          <Link href='/profile'>
            <div className="bg-orange-50 p-2 rounded-full">
              <FaUser className="text-orange-500 w-4 h-4" />
            </div>
          </Link>
        )}
      </div>
    </motion.header>
  );
}

{/* <h2 className="font-semibold text-gray-800 text-sm">
  {defaultAddress 
    ? defaultAddress.addressLine 
    : "Select your address"}
</h2> */}
