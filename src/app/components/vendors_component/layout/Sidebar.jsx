"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  PlusCircle,
  ClipboardList,
  Star,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wallet
} from "lucide-react";
import Logo from "../../logo/Logo";
import { useApi } from "@/app/context/ApiContext";

const navItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    href: "/vendors/dashboard",
  },
  {
    name: "Transactions",
    icon: Wallet,
    href: "/vendors/transactions",
  },
  {
    name: "Orders",
    icon: ClipboardList,
    href: "/vendors/order",
  },
  {
    name: "My Foods",
    icon: UtensilsCrossed,
    href: "/vendors/my-foods",
  },
  {
    name: "Create Food",
    icon: PlusCircle,
    href: "/vendors/create-food",
  },
  {
    name: "Reviews",
    icon: Star,
    href: "/vendors/reviews",
  },
  {
    name: "Profile",
    icon: User,
    href: "/vendors/profile",
  },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { baseUrl } = useApi();
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Check active path
  const isSegmentActive = (href) => pathname?.includes(href);

  // Handle Resize for Mobile Check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);

    // Initial check
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      const res = await fetch(`${baseUrl}/vendor/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        // localStorage.removeItem("vendorToken"); // Removed
        router.push("/vendors/auth/login");
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (setMobileOpen) setMobileOpen(false);
            }}
            className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={isMobile
          ? { x: mobileOpen ? 0 : "-100%", width: 280 }
          : { x: 0, width: open ? 280 : 80 }
        }
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed md:sticky top-0 left-0 h-screen bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 z-[60] flex flex-col`}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-3 border-b border-slate-100 dark:border-slate-800/50">
          <AnimatePresence mode="wait">
            {(open || isMobile) ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 w-full"
              >
                <div className="scale-75 origin-left">
                  <Logo />
                </div>
                <div className="flex flex-col -ml-4">
                  <span className="font-bold text-slate-800 dark:text-white text-xl leading-tight">Premium Eats</span>
                  <span className="text-[10px] font-bold text-[#FF6B00] tracking-wider uppercase">VENDOR PRO</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-10 h-10 bg-gradient-to-br from-[#FF6B00] to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/30 mx-auto"
              >
                G
              </motion.div>
            )}
          </AnimatePresence>

          {!isMobile && open && (
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {/* Close button for Mobile */}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {!open && !isMobile && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 mt-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const active = isSegmentActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="block group"
                onClick={() => isMobile && setMobileOpen(false)}
              >
                <div
                  className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${active
                    ? "bg-[#FF6B00] text-white shadow-lg shadow-orange-500/25"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 2}
                    className={`flex-shrink-0 transition-colors duration-300 ${active ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}
                  />

                  <AnimatePresence>
                    {(open || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`font-medium text-sm whitespace-nowrap ${active ? 'font-semibold' : ''}`}
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Collapsed Tooltip Indicator - Optional polish */}
                  {!open && !active && !isMobile && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all pointer-events-none z-50 whitespace-nowrap hidden md:block">
                      {item.name}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-[#0F172A]">
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${open || isMobile
              ? "hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
              : "justify-center text-slate-500 hover:text-red-500"
              } ${logoutLoading ? "cursor-not-allowed opacity-70" : ""}`}
          >
            {logoutLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <LogOut size={20} className="flex-shrink-0 transition-transform group-hover:-translate-x-1" />
            )}

            {(open || isMobile) && (
              <span className="font-semibold text-sm">
                {logoutLoading ? "Signing out..." : "Sign Out"}
              </span>
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
