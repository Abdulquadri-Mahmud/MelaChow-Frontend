"use client";

import Header2 from "@/app/components/App_Header/Header2";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  HelpCircle,
  MessageCircle,
  Mail,
  ChevronRight,
  ShoppingBag,
  User,
  CreditCard,
  Phone,
  FileQuestion,
  ShieldCheck
} from "lucide-react";

const SupportCategory = ({ icon: Icon, title, description, href, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <Link
      href={href}
      className="flex flex-col p-5 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 hover:border-orange-500/30 hover:shadow-md transition-all group h-full"
    >
      <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/10 flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
        <Icon size={20} />
      </div>
      <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">{title}</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
        {description}
      </p>
    </Link>
  </motion.div>
);

const ContactOption = ({ icon: Icon, title, subtitle, href = "#" }) => (
  <Link
    href={href}
    className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all group"
  >
    <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 group-hover:text-orange-600 transition-colors">
      <Icon size={18} />
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h4>
      <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{subtitle}</p>
    </div>
    <ChevronRight size={16} className="text-zinc-400 group-hover:translate-x-1 transition-transform" />
  </Link>
);

export default function Support() {
  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 pb-20">
      <Header2 />

      {/* Hero Section */}
      <div className="relative bg-zinc-900 text-white pt-8 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 max-w-xl mx-auto text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-orange-400"
          >
            <HelpCircle size={12} />
            <span>Support Center</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-black italic tracking-tight"
          >
            How can we help?
          </motion.h1>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative max-w-sm mx-auto mt-6 group"
          >
            <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white dark:bg-zinc-800 rounded-2xl shadow-lg flex items-center p-1.5 pl-4 overflow-hidden">
              <Search className="text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Search related issues..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-white px-3 py-2 font-medium placeholder:text-zinc-400"
              />
              <button className="bg-orange-600 text-white p-2 rounded-xl font-bold text-xs hover:bg-orange-700 transition-colors">
                Search
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-8 relative z-20 space-y-8">

        {/* Main Categories */}
        <div className="grid grid-cols-2 gap-3">
          <SupportCategory
            icon={ShoppingBag}
            title="Orders"
            description="Track, modify, or cancel orders"
            href="/orders"
            delay={0.3}
          />
          <SupportCategory
            icon={User}
            title="Account"
            description="Profile, addresses, and login"
            href="/profile"
            delay={0.4}
          />
          <SupportCategory
            icon={CreditCard}
            title="Payments"
            description="Refunds, cards, and pricing"
            href="/profile/wallet"
            delay={0.5}
          />
          <SupportCategory
            icon={ShieldCheck}
            title="Safety"
            description="Trust & safety guidelines"
            href="/faqs"
            delay={0.6}
          />
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">Quick Actions</h3>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-2 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-1">
            <Link
              href="/get-help"
              className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-2xl transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                  <FileQuestion size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Get Help</h4>
                  <p className="text-[10px] text-zinc-500 font-medium">Browse help articles</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-300 group-hover:text-emerald-500 transition-colors" />
            </Link>

            <div className="h-px bg-zinc-50 dark:bg-zinc-800 mx-4" />

            <Link
              href="/faqs"
              className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-2xl transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">FAQs</h4>
                  <p className="text-[10px] text-zinc-500 font-medium">Common questions</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-300 group-hover:text-blue-500 transition-colors" />
            </Link>
          </div>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between px-1 mb-3">
            <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">Contact Us</h3>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
              Available 24/7
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ContactOption
              icon={MessageCircle}
              title="Chat Support"
              subtitle="Average wait: 2 mins"
              href="#"
            />
            <ContactOption
              icon={Mail}
              title="Email Us"
              subtitle="Response within 24h"
              href="mailto:support@grubdash.com"
            />
            <ContactOption
              icon={Phone}
              title="Call Us"
              subtitle="0800-GRUB-DASH"
              href="tel:08000000000"
            />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
