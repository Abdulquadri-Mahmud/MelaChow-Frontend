"use client";

import { motion } from "framer-motion";
import { Home, Search, ShoppingCart, Headset , User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Search", href: "/search", icon: Search },
  { name: "Order", href: "/cart", icon: ShoppingCart },
  { name: "Support", href: "/menu", icon: Headset  },
  { name: "Profile", href: "/profile", icon: User },
];

export default function BottomBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center ${
                  isActive ? "text-orange-500" : "text-gray-500 hover:text-orange-600"
                }`}
              >
                <Icon className={`w-6 h-6 mb-1 ${isActive ? "fill-orange-600" : ""}`} />
                <span className="text-xs font-medium">{item.name}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
