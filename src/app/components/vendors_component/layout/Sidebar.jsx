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
  Wallet,
  TicketPercent,
  Bell,
  Bike,
  HelpCircle,
  Package
} from "lucide-react";
import Logo from "../../logo/Logo";
import { useApi } from "@/app/context/ApiContext";
import PermanentInstallButton from "@/app/components/PermanentInstallButton";
import { useVendorStorage } from "@/app/hooks/vendorStorage";

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
    name: "Coupons",
    icon: TicketPercent,
    href: "/vendors/coupons",
  },
  {
    name: "Orders",
    icon: ClipboardList,
    href: "/vendors/order",
  },
  {
    name: "Notifications",
    icon: Bell,
    href: "/vendors/notifications",
  },
  {
    name: "My Foods",
    icon: UtensilsCrossed,
    href: "/vendors/my-foods",
  },
  {
    name: "My Combos",
    icon: Package,
    href: "/vendors/my-combos",
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
  {
    name: "Help & FAQs",
    icon: HelpCircle,
    href: "/vendors/faqs",
  },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { baseUrl } = useApi();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useVendorStorage();

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
      await logout();
      setShowLogoutModal(false);
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
          ? { x: mobileOpen ? 0 : "-100%", width: 310 }
          : { x: 0, width: open ? 310 : 80 }
        }
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed md:sticky top-0 left-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-[60] flex flex-col`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-slate-100 dark:border-slate-800/50">
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
                  <span className="text-[10px] font-bold text-orange-500 tracking-wider uppercase">VENDOR PRO</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-md flex items-center justify-center text-white font-bold text-lg mx-auto"
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
        <nav className="flex-1 md:px-4 px-2 mt-6 space-y-2 overflow-y-auto custom-scrollbar">
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
                  className={`relative flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-200 ${active
                    ? "bg-orange-500 text-white"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 2}
                    className={`flex-shrink-0 transition-colors duration-200 ${active ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}
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
        <div className="p-2 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900 space-y-3">
          {(open || isMobile) && <PermanentInstallButton />}
          <button
            onClick={() => setShowLogoutModal(true)}
            disabled={logoutLoading}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all group ${open || isMobile
              ? "hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
              : "justify-center text-slate-500 hover:text-red-500"
              } ${logoutLoading ? "cursor-not-allowed opacity-70" : ""}`}
          >
            {logoutLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <LogOut size={18} className="flex-shrink-0 transition-transform group-hover:-translate-x-1" />
            )}

            {(open || isMobile) && (
              <span className="font-semibold text-sm">
                Sign Out
              </span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-6">
                <div className="size-12 rounded-md bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-600 mb-4">
                  <LogOut size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Confirm Logout</h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-widest leading-relaxed">
                  Are you sure you want to exit the dashboard? You will need to sign in again to manage your store.
                </p>

                <div className="grid grid-cols-2 gap-3 mt-8">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="h-10 px-4 rounded-md border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="h-10 px-4 rounded-md bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all font-bold disabled:opacity-50"
                  >
                    {logoutLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Sign Out Forever"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
