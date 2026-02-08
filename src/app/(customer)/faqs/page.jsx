"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Search,
  MessageCircle,
  Mail,
  Phone,
  ArrowRight,
  ShoppingBag,
  CreditCard,
  MapPin,
  User,
  Sparkles,
  ShieldCheck,
  Store
} from "lucide-react";
import Link from "next/link";
import Header2 from "@/app/components/App_Header/Header2";

// Comprehensive FAQ Data
const FAQ_DATA = [
  // General
  {
    category: "general",
    question: "What is GrubDash?",
    answer: "GrubDash is your premium local food delivery companion. We connect you with the best restaurants, hidden gems, and local favorites in your city, delivering authentic flavors right to your doorstep with speed and care."
  },
  {
    category: "general",
    question: "Where does GrubDash operate?",
    answer: "We currently operate in major cities across the region. You can check if we deliver to your area by entering your delivery address on the home page."
  },

  // Orders
  {
    category: "orders",
    question: "How do I place an order?",
    answer: "Simply browse through our curated list of restaurants, select your favorite dishes, add them to your cart, and proceed to checkout. You'll need to create an account or log in to finalize your purchase."
  },
  {
    category: "orders",
    question: "Can I cancel my order?",
    answer: "Yes, you can cancel your order within the first 5 minutes of placing it without any charge. After the restaurant has started preparing your food, cancellation may be subject to a fee. Go to 'Orders' > 'Track Order' to see your options."
  },
  {
    category: "orders",
    question: "What if something is missing from my order?",
    answer: "We're sorry about that! Please go to your Orders page, select the specific order, and use the 'Get Help' button to report missing items. We will process a refund or credit for the missing items immediately."
  },
  {
    category: "orders",
    question: "Can I schedule an order for later?",
    answer: "Absolutely. At checkout, you can toggle 'Schedule for later' and select your preferred delivery date and time window."
  },

  // Payments
  {
    category: "payment",
    question: "What payment methods do you accept?",
    answer: "We accept all major credit and debit cards (Visa, Mastercard, Verve), Paystack, Flutterwave, and direct bank transfers. We also offer a secure Digital Wallet for faster checkouts."
  },
  {
    category: "payment",
    question: "Is my payment information secure?",
    answer: "Yes, 100%. We use industry-standard encryption and do not store your full card details. All transactions are processed through secure, PCI-DSS compliant payment gateways."
  },
  {
    category: "payment",
    question: "How do refunds work?",
    answer: "Refunds are processed to your GrubDash Wallet instantly or to your original payment method within 3-5 business days, depending on your bank."
  },

  // Delivery
  {
    category: "delivery",
    question: "How much is the delivery fee?",
    answer: "Delivery fees vary based on the distance between you and the restaurant. You will always see the exact fee at checkout before you pay. We also offer free delivery promotions occasionally!"
  },
  {
    category: "delivery",
    question: "Can I track my rider?",
    answer: "Yes! Once your order is picked up, you can track your rider in real-time on the map via the 'Track Order' page."
  },
  {
    category: "delivery",
    question: "Do you offer contactless delivery?",
    answer: "Yes. You can select 'Leave at door' instructions at checkout for a contactless experience. Our rider will drop off your food and notify you."
  },

  // Account
  {
    category: "account",
    question: "How do I reset my password?",
    answer: "Go to the Sign In page and click 'Forgot Password'. detailed instructions will be sent to your registered email address."
  },
  {
    category: "account",
    question: "Can I change my phone number?",
    answer: "Yes, you can update your profile details including phone number and email address from the 'Profile' section in the app."
  },

  // Vendors
  {
    category: "vendors",
    question: "How can I become a vendor partner?",
    answer: "We'd love to have you! Click on 'Join as Vendor' in the footer or visit our Vendor Registration page to submit your application. Our team will review it within 48 hours."
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Questions', icon: Sparkles },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'payment', label: 'Payments', icon: CreditCard },
  { id: 'delivery', label: 'Delivery', icon: MapPin },
  { id: 'account', label: 'Account', icon: User },
  { id: 'vendors', label: 'Vendors', icon: Store },
];

export default function FAQs() {
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      <Header2 />

      {/* Hero Section */}
      <div className="relative bg-zinc-900 pt-12 pb-24 px-6 mb-10 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight italic mb-2">
              Frequently Asked <span className="text-orange-500">Questions</span>
            </h1>
            <p className="text-zinc-400 text-sm md:text-base font-medium max-w-md mx-auto">
              Everything you need to know about ordering, payments, delivery, and more.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative group max-w-lg mx-auto"
          >
            <div className="absolute inset-0 bg-orange-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-white dark:bg-zinc-800 p-2 rounded-2xl shadow-xl">
              <Search className="ml-3 text-zinc-400" size={20} />
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 w-full"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-20">

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border
                  ${isActive
                    ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-orange-500/50 hover:text-orange-500'
                  }
                `}
              >
                <Icon size={14} />
                {cat.label}
              </motion.button>
            )
          })}
        </div>

        {/* FAQ List */}
        <div className="space-y-4 min-h-[400px]">
          {filteredData.length > 0 ? (
            filteredData.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  bg-white dark:bg-zinc-900 rounded-xl border transition-all overflow-hidden
                  ${openIndex === index
                    ? 'border-orange-500/30 shadow-md ring-1 ring-orange-500/10'
                    : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700'
                  }
                `}
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex items-center justify-between p-5 text-left group"
                >
                  <span className={`font-bold text-sm md:text-base transition-colors ${openIndex === index ? 'text-orange-600' : 'text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white'}`}>
                    {item.question}
                  </span>
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all bg-zinc-50 dark:bg-zinc-800 
                    ${openIndex === index ? 'bg-orange-50 dark:bg-orange-900/20 rotate-180' : 'group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700'}
                  `}>
                    <ChevronDown size={16} className={openIndex === index ? 'text-orange-500' : 'text-zinc-500'} />
                  </div>
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 pt-0">
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed border-t border-dashed border-zinc-100 dark:border-zinc-800 pt-4">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                <Search size={24} />
              </div>
              <p className="text-zinc-900 dark:text-white font-bold mb-1">No results found</p>
              <p className="text-zinc-400 text-xs">Try adjusting your search terms</p>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="mt-20 text-center space-y-8">
          <div className="inline-flex flex-col items-center">
            <div className="w-12 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mb-4" />
            <h3 className="text-2xl font-black italic tracking-tight text-zinc-900 dark:text-white">Still have questions?</h3>
            <p className="text-zinc-500 text-sm mt-2 max-w-sm mx-auto">
              Can't find the answer you're looking for? Please chat to our friendly team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {/* Live Chat */}
            <Link href="/support" className="group">
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Live Chat</h4>
                  <p className="text-xs text-zinc-500 mt-1">Available 24/7</p>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center justify-center gap-1">
                  Chat Now <ArrowRight size={12} />
                </div>
              </div>
            </Link>

            {/* Email */}
            <Link href="mailto:support@grubdash.com" className="group">
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Send Email</h4>
                  <p className="text-xs text-zinc-500 mt-1">Response in 24h</p>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600 flex items-center justify-center gap-1">
                  Write Us <ArrowRight size={12} />
                </div>
              </div>
            </Link>

            {/* Call */}
            <Link href="tel:+23400000000" className="group">
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-500 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Call Us</h4>
                  <p className="text-xs text-zinc-500 mt-1">Mon-Fri, 9am-6pm</p>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-purple-600 flex items-center justify-center gap-1">
                  Call Now <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
