"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ChevronDown, ShoppingBag } from "lucide-react";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { useRouter } from "next/navigation";

export default function HomeHeader() {
  const { user, isLoading } = useUserStorage();
  const { cart } = useCart();
  const router = useRouter();
  const totalItems = cart.length;
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const defaultAddress = user?.addresses?.find(addr => addr.isDefault);

  const handleLocationClick = () => {
    // Check if user is authenticated (has user data)
    if (user) {
      // User is authenticated, redirect to address location page
      router.push('/profile/address');
    } else {
      // User is not authenticated (cookies expired or never logged in), redirect to login
      router.push('/auth/signin');
    }
  };

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-between px-5 py-2 bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 dark:border-zinc-800 dark:bg-zinc-900/90"
    >
      {/* Location / Greeting */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            {greeting}, {user?.firstname || user?.firstName || 'Guest'}
          </span>
          <span className="text-lg">👋</span>
        </div>

        <div
          onClick={handleLocationClick}
          className="flex items-center gap-1 cursor-pointer group"
        >
          <span className="text-sm font-black text-gray-800 dark:text-gray-100 truncate max-w-[200px]">
            {defaultAddress
              ? `${defaultAddress.city}, ${defaultAddress.state}`
              : "Select Location"}
          </span>
          <ChevronDown size={14} className="text-gray-400 group-hover:text-orange-500 transition-colors mt-0.5" />
        </div>
      </div>


      {/* Right Icons */}
      <div className="flex items-center gap-4">
        <Link href={'/orders'}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2.5 bg-gray-50 dark:bg-zinc-800 rounded-2xl hover:bg-orange-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <ShoppingBag className="text-gray-700 dark:text-gray-200" size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-md ring-2 ring-white dark:ring-zinc-900">
                {totalItems}
              </span>
            )}
          </motion.div>
        </Link>

        {isLoading ? (
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800 animate-pulse" />
        ) : user?.avatar ? (
          <Link href='/profile'>
            <motion.div whileHover={{ scale: 1.05 }} className="relative">
              <img
                src={user.avatar}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-zinc-800 shadow-md"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>
            </motion.div>
          </Link>
        ) : (
          <Link href='/profile'>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shadow-sm text-orange-600 font-bold border-2 border-white">
              {user?.firstname?.[0] || user?.firstName?.[0] || "G"}
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
