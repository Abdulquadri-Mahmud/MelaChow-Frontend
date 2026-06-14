"use client";

import { motion } from "framer-motion";
import { Home, Search, ShoppingCart, Headset, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useUserStorage } from "../hooks/useUserStorage";
import { useFoodModalStore } from "../store/foodModalStore";
import { useComboModalStore } from "../store/comboModalStore";

const navItems = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Search", href: "/search", icon: Search },
  { name: "Order", href: "/orders", icon: ShoppingCart },
  { name: "Support", href: "/support", icon: Headset },
  { name: "Profile", href: "/profile", icon: User },
];

export default function BottomBar() {
  const pathname = usePathname();
  const { cart, isModalOpen } = useCart();
  const { user, isLoading } = useUserStorage();
  const { isOpen: isFoodModalOpen } = useFoodModalStore();
  const { isOpen: isComboModalOpen } = useComboModalStore();

  // Hide the bottom nav when the customization modal is open,
  // or on specific pages (Restaurant Storefront, Food/Combo Details, Checkout)
  const isFoodDetailsPage = pathname.startsWith("/food-details/");
  const isComboDetailsPage = pathname.startsWith("/combo-details/");
  const isCheckoutPage = pathname === "/checkout";

  // Also hide if logged in but no addresses (mandatory address modal state)
  const isNoAddress = !isLoading && user && user?.addresses?.length === 0;

  if (
    isModalOpen ||
    isFoodModalOpen ||
    isComboModalOpen ||
    isFoodDetailsPage ||
    isComboDetailsPage ||
    isCheckoutPage ||
    isNoAddress
  ) return null;

  return (
    // Outer wrapper: fixed to bottom, overflow-visible so the Order button can float above
    <div className="fixed bottom-0 left-0 right-0 md:max-w-md md:mx-auto z-[9999]" style={{ overflow: "visible" }}>

      {/* ── Floating Order Button ── rendered OUTSIDE the nav so border-radius never clips it */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-[10000]">
        <Link href="/orders">
          <motion.div
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.08 }}
            className="relative"
          >
            {/* Pulsing ring */}
            <motion.div
              animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-orange-400"
            />
            {/* Badge */}
            {cart.length > 0 && (
              <motion.div
                key={cart.length}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 z-10 bg-orange-500 text-white text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full ring-2 ring-white px-1"
              >
                {cart.length}
              </motion.div>
            )}
            <div className="bg-gradient-to-tr from-orange-400 to-orange-600 p-3.5 rounded-full shadow-[0_8px_24px_rgba(249,115,22,0.45)] text-white hover:rotate-[10deg] transition-transform">
              <ShoppingCart size={22} strokeWidth={2.5} />
            </div>
          </motion.div>
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 text-center mt-0.5">
            Order
          </p>
        </Link>
      </div>

      {/* ── Nav bar ── no overflow clipping issue since Order button is outside */}
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-zinc-900 border border-gray-200/50 dark:border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.10)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.3)] rounded-t-[32px] px-2 pt-3 pb-2"
      >
        <div className="flex justify-between items-end">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const isOrder = item.name === "Order";

            // Render a blank spacer in place of the Order slot so spacing stays symmetric
            if (isOrder) {
              return <div key={item.name} className="flex-1" />;
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className="relative flex-1 group"
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center gap-1 py-1"
                >
                  {/* Active pill background */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 -m-1 rounded-2xl"
                      transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                    />
                  )}

                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-all ${
                      isActive
                        ? "text-orange-500"
                        : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    }`}
                  />

                  <span
                    className={`text-[10px] font-black uppercase tracking-widest leading-none transition-all ${
                      isActive
                        ? "text-orange-500 opacity-100"
                        : "text-slate-400 opacity-40 group-hover:opacity-70"
                    }`}
                  >
                    {item.name}
                  </span>

                  {/* Active dot */}
                  {isActive && (
                    <motion.div
                      layoutId="activeDot"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}
