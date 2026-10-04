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
  const isOrderActive = pathname === "/orders" || pathname.startsWith("/orders/");
  const { cartItemCount, isModalOpen } = useCart();
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
    <div className="fixed inset-x-0 bottom-0 z-[9999] mx-auto w-full md:max-w-md" style={{ overflow: "visible" }}>

      {/* ── Floating Order Button ── rendered OUTSIDE the nav so border-radius never clips it */}
      <div className="absolute left-1/2 top-0 z-[10000] -translate-x-1/2 -translate-y-1/2">
        <Link href="/orders" aria-label={`Orders${cartItemCount ? `, ${cartItemCount} items in cart` : ""}`}>
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
            {cartItemCount > 0 && (
              <motion.div
                key={cartItemCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 z-10 bg-orange-500 text-white text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full ring-2 ring-white px-1"
              >
                {cartItemCount}
              </motion.div>
            )}
            <div className={`bg-gradient-to-tr from-orange-500 to-orange-700 p-3 rounded-full text-white transition-transform hover:rotate-[10deg] ${
              isOrderActive
                ? "ring-4 ring-orange-100 shadow-[0_8px_28px_rgba(234,88,12,0.55)]"
                : "shadow-[0_8px_24px_rgba(249,115,22,0.45)]"
            }`}>
              <ShoppingCart size={22} strokeWidth={2.5} />
            </div>
          </motion.div>
          <p className="mt-0.5 text-center text-[10px] font-black uppercase tracking-widest text-orange-700">
            Order
          </p>
        </Link>
      </div>

      {/* ── Nav bar ── no overflow clipping issue since Order button is outside */}
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="rounded-t-[24px] border border-gray-200/50 bg-white px-2 pt-2 shadow-[0_-8px_32px_rgba(0,0,0,0.10)] dark:border-white/10 dark:bg-[#09090b] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.3)] pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-5 items-end">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const isOrder = item.name === "Order";

            // Render a blank spacer in place of the Order slot so spacing stays symmetric
            if (isOrder) {
              return <div key={item.name} aria-hidden="true" className="h-11" />;
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className="group relative flex min-w-0 justify-center"
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.05 }}
                  className="relative flex min-h-11 w-full flex-col items-center justify-center gap-1 rounded-2xl py-1"
                >
                  {/* Active pill background */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-x-1 inset-y-0 z-0 rounded-2xl bg-orange-600 shadow-sm shadow-orange-200/70"
                      transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                    />
                  )}

                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`relative z-10 transition-all ${
                      isActive
                        ? "text-white drop-shadow-sm"
                        : "text-slate-600 group-hover:text-slate-800"
                    }`}
                  />

                  <span
                    className={`relative z-10 text-[9px] font-extrabold uppercase tracking-[0.08em] leading-none transition-all sm:text-[10px] ${
                      isActive
                        ? "text-white opacity-100 drop-shadow-sm"
                        : "text-slate-600 opacity-90 group-hover:text-slate-800 group-hover:opacity-100"
                    }`}
                  >
                    {item.name}
                  </span>

                  {/* Active dot */}
                  {isActive && (
                    <motion.div
                      layoutId="activeDot"
                      className="absolute -bottom-1 left-1/2 z-10 h-1 w-1 -translate-x-1/2 rounded-full bg-orange-700 shadow-[0_0_8px_rgba(234,88,12,0.7)]"
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
