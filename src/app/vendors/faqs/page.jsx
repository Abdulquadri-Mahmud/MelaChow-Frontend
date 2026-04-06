"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Search,
  MessageCircle,
  Mail,
  Store,
  Wallet,
  ClipboardList,
  ShieldCheck,
  HeadphoneTree,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

// Comprehensive FAQ Data for Vendors
const FAQ_DATA = [
  // Account & Registration
  {
    category: "account",
    question: "How do I get my account approved?",
    answer: "After verifying your email and setting a password, your account is placed in 'Pending Approval' status. Our admin team will review your submitted business details (store name, address, menu, etc.). Usually, this takes less than 24 hours. You'll receive an email notification once your store is live!"
  },
  {
    category: "account",
    question: "How do I update my payout bank account?",
    answer: "You can update your payout details (Bank Name, Account Name, Account Number) in the 'Profile' section of your dashboard. Make sure the name on your bank account matches your registered store name or personal name to avoid payout delays."
  },

  // Escrow & Payments
  {
    category: "finance",
    question: "How do payments and payouts work?",
    answer: "MelaChow uses a secure Escrow system to protect both you and the customer. When a customer pays for an order, the funds are safely held by MelaChow. We do not release the food revenue to your wallet immediately upon payment."
  },
  {
    category: "finance",
    question: "When is my money released from Escrow?",
    answer: "The exact moment the order status is marked as 'Delivered' (by the rider or by you, if you manage your own deliveries), the system automatically releases the escrowed funds directly into your Vendor Wallet. This ensures fair play and system integrity."
  },
  {
    category: "finance",
    question: "What happens if an order is cancelled?",
    answer: "If an order is cancelled before it is delivered, the escrowed funds are automatically refunded to the customer. Since the money was in escrow and never touched your wallet, you do not have to worry about negative balances or clawbacks."
  },
  {
    category: "finance",
    question: "When can I withdraw my funds?",
    answer: "As soon as funds are released from escrow into your Vendor Wallet, they are available for withdrawal. You can request a payout to your registered bank account from the 'Transactions' page."
  },

  // Orders & Deliveries
  {
    category: "orders",
    question: "How do I know when I have a new order?",
    answer: "Keep your vendor dashboard open! Our real-time WebSocket system will trigger an audio alert and a visual pop-up immediately when a new order arrives. You'll also see it appear in your 'Orders' tab."
  },
  {
    category: "orders",
    question: "I manage my own deliveries. How do I get paid for delivery?",
    answer: "If you have set 'Delivery Managed By' to 'Vendor' and configured a Flat Rate Delivery Fee, the delivery fee paid by the customer is bundled into your Escrow hold. When you mark the order as 'Delivered', both your food revenue and the delivery fee are released to your wallet."
  },
  {
    category: "orders",
    question: "Why can't I update the status to 'Delivered'?",
    answer: "If 'Delivery Managed By' is set to 'Admin', our platform riders handle the delivery. Once you mark an order as 'Ready for Pickup', only the assigned rider can update the status to 'Out for Delivery' and 'Delivered'."
  },

  // Menu Management
  {
    category: "menu",
    question: "How do I add or edit food items?",
    answer: "Go to the 'Create Food' tab to add a new item with images, descriptions, categories, and price. To edit an existing item (like updating the price or marking it out of stock), navigate to 'My Foods' and click the edit icon on the specific item."
  },
  {
    category: "menu",
    question: "Can I offer discounts on my food?",
    answer: "Yes! Currently, you can adjust the base price of your food. We are also rolling out a dedicated 'Coupons' feature where you can create promotional codes specifically for your store."
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All FAQs', icon: ShieldCheck },
  { id: 'account', label: 'Account & Setup', icon: Store },
  { id: 'finance', label: 'Escrow & Payouts', icon: Wallet },
  { id: 'orders', label: 'Orders & Delivery', icon: ClipboardList },
];

export default function VendorFAQs() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndex, setOpenIndex] = useState(null);

  // Filter Logic
  const filteredData = useMemo(() => {
    let data = FAQ_DATA;

    // 1. Filter by Category
    if (activeCategory !== 'all') {
      data = data.filter(item => item.category === activeCategory);
    }

    // 2. Filter by Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(item =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
      );
    }

    return data;
  }, [activeCategory, searchQuery]);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 w-full max-w-5xl mx-auto space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic mb-2">
            Vendor <span className="text-orange-500">Help Center</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md text-sm leading-relaxed">
            Everything you need to know about operating your store, managing orders, and understanding how our secure Escrow payouts work.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72 z-10 filter drop-shadow-sm">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border
                ${isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md cursor-default'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }
              `}
            >
              <Icon size={16} className={isActive ? (isActive ? '' : 'text-slate-400') : 'text-slate-400'} />
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* FAQ List */}
      <div className="space-y-3 pb-8">
        {filteredData.length > 0 ? (
          filteredData.map((item, index) => {
            const isOpen = openIndex === index;
            // Identify if this is a finance/escrow item to give it a special badge or completely style it
            const isEscrow = item.category === 'finance';
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  bg-white dark:bg-slate-900 rounded-2xl border transition-all overflow-hidden
                  ${isOpen
                    ? isEscrow ? 'border-orange-500 shadow-md ring-4 ring-orange-500/10' : 'border-slate-300 dark:border-slate-600 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }
                `}
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex items-center justify-between p-5 text-left group"
                >
                  <div className="flex items-center gap-3 pr-4">
                    {isEscrow && (
                      <div className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 p-1.5 rounded-lg flex-shrink-0 hidden sm:block">
                        <Wallet size={16} />
                      </div>
                    )}
                    <span className={`font-bold text-sm md:text-[15px] transition-colors ${isOpen ? (isEscrow ? 'text-orange-600' : 'text-slate-900 dark:text-white') : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                      {item.question}
                    </span>
                  </div>
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all bg-slate-50 dark:bg-slate-800 flex-shrink-0
                    ${isOpen ? (isEscrow ? 'bg-orange-50 dark:bg-orange-900/40 rotate-180' : 'bg-slate-100 dark:bg-slate-700 rotate-180') : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-700'}
                  `}>
                    <ChevronDown size={16} className={isOpen ? (isEscrow ? 'text-orange-600' : 'text-slate-900 dark:text-white') : 'text-slate-400'} />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 pt-0">
                        <div className="pl-0 sm:pl-[42px]">
                           <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-t border-dashed border-slate-200 dark:border-slate-700 pt-4">
                             {item.answer}
                           </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search size={24} />
            </div>
            <p className="text-slate-900 dark:text-white font-bold mb-1">No FAQs matched</p>
            <p className="text-slate-500 text-sm">Try using different keywords.</p>
          </div>
        )}
      </div>

      {/* Support CTA */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
        
        <div className="flex items-center gap-5 relative z-10 w-full justify-center sm:justify-start">
          <div className="w-14 h-14 bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/5 flex items-center justify-center text-emerald-400 hidden sm:flex">
             <MessageCircle size={28} />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-white font-bold text-lg">Need direct assistance?</h3>
            <p className="text-slate-400 text-sm mt-1">Our vendor support team is ready to help you thrive.</p>
          </div>
        </div>

        <Link
          href="mailto:vendorsupport@melachow.com"
          className="relative z-10 shrink-0 w-full sm:w-auto text-center bg-white hover:bg-slate-100 text-slate-900 px-6 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 group"
        >
          Contact Support
          <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
        </Link>
      </div>

    </div>
  );
}

