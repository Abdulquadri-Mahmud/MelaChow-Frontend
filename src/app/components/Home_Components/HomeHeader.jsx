"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronDown, ShoppingBag, Search } from "lucide-react";
import { useUserStorage } from "@/app/hooks/useUserStorage";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { useRouter } from "next/navigation";
import NotificationBell from "@/app/components/NotificationBell";
import ProfileIconWithBadge from "../App_Header/ProfileIconWithBadge";

export default function HomeHeader() {
  const { user, isLoading } = useUserStorage();
  const { cart } = useCart();
  const router = useRouter();
  const totalItems = cart.length;
  const [greeting, setGreeting] = useState("Hello");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const defaultAddress = user?.addresses?.find(addr => addr.isDefault);

  const handleLocationClick = () => {
    if (user) {
      router.push('/profile/address');
    } else {
      router.push('/auth/signin');
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full"
    >
      {/* Premium Glassmorphism Container */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-20">

            {/* Left Section: Branding & Location */}
            <div className="flex items-center gap-4">
              {/* Optional: Logo Mark */}
              <Link href="/" className="hidden lg:flex items-center gap-2 group">
                <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                  <span className="text-white font-black italic text-xl">G</span>
                </div>
              </Link>

              {/* Location Picker - Refined UI */}
              <motion.div
                onClick={handleLocationClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col cursor-pointer group px-3 py-1.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest italic opacity-80">
                    Deliver to
                  </span>
                  <ChevronDown size={10} className="text-orange-400 group-hover:translate-y-0.5 transition-transform" />
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-orange-500" />
                  <span className="text-sm font-black text-gray-900 dark:text-gray-100 truncate max-w-[140px] sm:max-w-[200px]">
                    {defaultAddress
                      ? `${defaultAddress.city}, ${defaultAddress.state}`
                      : "Select Location"}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Right Section: Actions & User */}
            <div className="flex items-center gap-3 md:gap-4">

              {/* Notification Bell with connection state handling built in */}
              <div className="">
                <NotificationBell />
              </div>

              {/* Cart Button - Styled for Premium Feel */}
              <Link href="/orders?activeTab=cart">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2.5 bg-gray-100 dark:bg-zinc-800 rounded-2xl hover:bg-orange-50 dark:hover:bg-zinc-700 transition-all border border-transparent hover:border-orange-200 dark:hover:border-zinc-700"
                >
                  <ShoppingBag className="text-gray-700 dark:text-gray-200" size={20} />
                  <AnimatePresence>
                    {totalItems > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black ring-2 ring-white dark:ring-zinc-900"
                      >
                        {totalItems}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>

              
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

{/* <h2 className="font-semibold text-gray-800 text-sm">
  {defaultAddress 
    ? defaultAddress.addressLine 
    : "Select your address"}
</h2> */}
