"use client";

import { motion } from "framer-motion";
import { Home, Search, ShoppingCart, Headset, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "../context/CartContext";

const navItems = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Search", href: "/search", icon: Search },
  { name: "Order", href: "/orders", icon: ShoppingCart },
  { name: "Support", href: "/support", icon: Headset },
  { name: "Profile", href: "/profile", icon: User },
];

export default function BottomBar() {
  const pathname = usePathname();
  const { cart } = useCart();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const isOrder = item.name === "Order";

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center justify-center ${
                  isOrder
                    ? "bg-orange-500 text-white rounded-full w-10 h-10"
                    : isActive
                    ? "text-orange-500"
                    : "text-gray-500 hover:text-orange-600"
                }`}
              >
                <Icon className={`w-6 h-6 ${isOrder ? "text-white" : ""}`} />
              </motion.div>
              <span
                className={`text-xs font-medium mt-1 ${
                  isOrder ? "text-orange-500" : ""
                }`}
              >
                {item.name}
              </span>

              {/* Animated Cart Badge */}
              {isOrder && cart.length > 0 && (
                <motion.span
                  key={cart.length} // triggers animation on cart change
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.4, 0.9, 1] }}
                  transition={{ type: "keyframes", duration: 0.5 }}
                  className="absolute -top-2 -right-2 bg-white text-orange-500 text-xs font-semibold px-2 py-0.5 rounded-full shadow-md"
                >
                  {cart.length}
                </motion.span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
