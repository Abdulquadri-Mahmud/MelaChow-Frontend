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
  User,
  Sparkles,
  Store,
  Wallet,
  TicketPercent,
  Truck,
  Star
} from "lucide-react";
import Link from "next/link";
import Header2 from "@/app/components/App_Header/Header2";

const FAQ_DATA = [
  {
    category: "general",
    question: "What is MelaChow?",
    answer: "MelaChow helps customers discover restaurants, browse foods and combo deals, customize items, place orders, pay securely, track deliveries, and review meals after delivery."
  },
  {
    category: "general",
    question: "Where does MelaChow operate?",
    answer: "Availability depends on your saved delivery address and the restaurants currently active in your area. Add or update your default address from Profile > Address so the app can show the most relevant restaurants and delivery fees."
  },
  {
    category: "orders",
    question: "How do I place an order?",
    answer: "Browse from Home, All Foods, All Restaurants, Search, or a restaurant details page. Choose a food or combo, select any required options, add it to your cart, then open Orders > Cart and checkout from the restaurant group you want to order from."
  },
  {
    category: "orders",
    question: "Can I add food from different restaurants to my cart?",
    answer: "Yes. Your cart groups items by restaurant. Each restaurant group has its own Checkout button, so place separate orders for items from different restaurants."
  },
  {
    category: "orders",
    question: "Why do I need to checkout one restaurant at a time?",
    answer: "Each order can only contain items from one restaurant. This keeps restaurant preparation, delivery fees, rider assignment, tracking, and refunds clear for each order."
  },
  {
    category: "orders",
    question: "Can I edit items in my cart?",
    answer: "You can increase or reduce quantities, remove items, and edit customizable food items from the cart. Combo items can be removed or checked out, but their bundle structure is handled from the combo details flow."
  },
  {
    category: "orders",
    question: "Can I add a note for the restaurant?",
    answer: "Yes. On the checkout page, each restaurant section includes a note box. Use it for preparation requests such as spice level, no onions, or delivery-related instructions the restaurant should see."
  },
  {
    category: "orders",
    question: "Can I cancel my order?",
    answer: "You can cancel while the order is still pending from the Track Order page. Once the restaurant accepts or starts preparing the order, cancellation may no longer be available. Cancelled order funds are returned to your MelaChow wallet when the cancellation succeeds."
  },
  {
    category: "orders",
    question: "What if something is missing from my order?",
    answer: "Open Support or Get Help and include your order ID plus the missing item details. The support team can review the order and help with the right resolution."
  },
  {
    category: "payment",
    question: "What payment methods do you accept?",
    answer: "Checkout supports card or transfer payment through Paystack. If your MelaChow wallet balance can cover the full order total, you can also pay with wallet."
  },
  {
    category: "payment",
    question: "Is my payment information secure?",
    answer: "Yes. Card and transfer payments are handled by Paystack, and MelaChow does not ask you to type full card details directly into our own checkout form."
  },
  {
    category: "payment",
    question: "What is the service fee?",
    answer: "A service fee may appear at checkout when enabled by the platform. The exact amount is shown before you complete payment. Some platform promos may reduce or remove specific fees when you are eligible."
  },
  {
    category: "payment",
    question: "How do refunds work?",
    answer: "When an eligible cancellation or refund is processed, funds may be returned to your MelaChow wallet. For payment-gateway issues, support can help trace the transaction using your order or payment reference."
  },
  {
    category: "wallet",
    question: "What can I use my wallet for?",
    answer: "Your MelaChow wallet stores your balance and transaction history. You can fund it and use it to pay for checkout when the wallet balance is enough to cover the full order total."
  },
  {
    category: "wallet",
    question: "How do I fund my wallet?",
    answer: "Go to Profile > Wallet, tap the fund wallet action, enter an amount or choose a preset amount, and complete the Paystack payment. Your wallet page also shows credit and debit transactions."
  },
  {
    category: "promos",
    question: "How do free delivery promos work?",
    answer: "MelaChow can run platform free delivery promos with a limited number of slots. If you are eligible, checkout can apply free delivery while slots remain. Restaurants can also sponsor free delivery for their own store."
  },
  {
    category: "promos",
    question: "Why did a free delivery promo not apply to my order?",
    answer: "A promo may not apply if it has ended, all slots have been used, you are not eligible, or the order does not meet the promo rules. Checkout always shows the final delivery fee before payment."
  },
  {
    category: "promos",
    question: "Can I use a coupon code?",
    answer: "Yes. Enter your coupon code in the Promo Code section at checkout and apply it before completing payment. The order total updates after a valid code is verified."
  },
  {
    category: "delivery",
    question: "How much is the delivery fee?",
    answer: "Delivery fees depend on the restaurant, location, and delivery setup. You will see the fee for the restaurant at checkout before you pay. Vendor-sponsored or platform free delivery promos can reduce it to zero when active and eligible."
  },
  {
    category: "delivery",
    question: "How do I track my order?",
    answer: "Go to Orders and open the order tracking page. You can follow status updates such as Order Placed, Confirmed, Preparing, Ready, Rider Assigned, On the way, Delivered, and Completed."
  },
  {
    category: "delivery",
    question: "Can I contact my rider?",
    answer: "When a rider has been assigned and rider details are available, the tracking page can show rider information and contact options."
  },
  {
    category: "account",
    question: "How do I reset my password?",
    answer: "Go to the Sign In page, choose Forgot Password, enter your registered email, and follow the reset instructions sent to you."
  },
  {
    category: "account",
    question: "How do I manage my delivery addresses?",
    answer: "Open Profile > Address to add, edit, delete, or set a default delivery address. Checkout requires a default address before an order can be placed."
  },
  {
    category: "account",
    question: "Can I update my profile details?",
    answer: "Yes. Use the Profile and Edit Profile pages to update your customer information. Keeping your phone number and email current helps with delivery and support."
  },
  {
    category: "account",
    question: "How do notifications work?",
    answer: "MelaChow can send real-time in-app and browser notifications for order updates and other activity. You can manage notification preferences from Profile > Notification Settings."
  },
  {
    category: "reviews",
    question: "Can I review my order?",
    answer: "Yes. After an order is delivered or completed, the Track Order page lets you review the order or individual items. You may also see a review prompt shortly after delivery."
  },
  {
    category: "reviews",
    question: "Where can I see restaurant or food reviews?",
    answer: "Restaurant and food detail pages include review sections where available. You can view ratings, feedback, and rating filters before choosing what to order."
  },
  {
    category: "vendors",
    question: "How can I become a vendor partner?",
    answer: "Use the vendor registration flow from the partner or vendor auth pages to apply. After submission, the MelaChow team reviews vendor accounts before they can start selling."
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Questions', icon: Sparkles },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'payment', label: 'Payments', icon: CreditCard },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'promos', label: 'Promos', icon: TicketPercent },
  { id: 'delivery', label: 'Delivery', icon: Truck },
  { id: 'account', label: 'Account', icon: User },
  { id: 'reviews', label: 'Reviews', icon: Star },
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
              Can&apos;t find the answer you&apos;re looking for? Please chat to our friendly team.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
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

            {/* Email Support */}
            <Link href="mailto:support@melachow.com" className="group">
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Email Support</h4>
                  <p className="text-xs text-zinc-500 mt-1">support@melachow.com</p>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600 flex items-center justify-center gap-1">
                  Write Us <ArrowRight size={12} />
                </div>
              </div>
            </Link>

            {/* Email Help */}
            <Link href="mailto:help@melachow.com" className="group">
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-500 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Help Desk</h4>
                  <p className="text-xs text-zinc-500 mt-1">help@melachow.com</p>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-orange-600 flex items-center justify-center gap-1">
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

