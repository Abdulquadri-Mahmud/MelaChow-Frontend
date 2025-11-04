"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Header2 from "../components/App_Header/Header2";

const faqData = [
  {
    question: "How do I create an account?",
    answer:
      "Click the profile button at the bottom nav bar, fill in your details, and verify your email to activate your account.",
  },
  {
    question: "How can I reset my password?",
    answer:
      "Go to the Sign In page, click on 'Forgot Password', and follow the steps to reset your password via email.",
  },
  {
    question: "How do I track my order?",
    answer:
      "After logging in, go to 'My Orders' under your profile to view the order status and tracking details.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept credit/debit cards, Paystack, Flutterwave, and other major online payment methods.",
  },
  {
    question: "How can I contact customer support?",
    answer:
      "You can reach out to us via the 'Get Help' page or email support@grubdash.com for assistance.",
  },
  {
    question: "Can I cancel my order?",
    answer:
      "Yes, you can cancel your order before it’s shipped by going to 'My Orders' and selecting 'Cancel Order'.",
  },
];

export default function FAQs() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [search, setSearch] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  const filteredFAQs = useMemo(() => {
    return faqData.filter(
      (faq) =>
        faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    setChatHistory((prev) => [...prev, message]);
    setMessage("");
  };

  return (
    <div className="bg-zinc-50 min-h-screen">
      <Header2 />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-3xl bg-white md:mx-auto m-3 rounded-xl md:py-6 py-4 md:px-6 px-4 font-display shadow-sm md:mb-[6rem] mb-[6rem]"
      >
        <h2 className="text-3xl font-semibold text-center mb-8 text-orange-600">
          Frequently Asked Questions
        </h2>

        {/* Search Bar */}
        <div className="relative mb-8">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for a question..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
          />
        </div>

        {/* FAQ List */}
        {filteredFAQs.length > 0 ? (
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-100 rounded-lg bg-white"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex justify-between items-center px-4 py-3 text-left text-gray-700 cursor-pointer font-medium focus:outline-none"
                >
                  <span>{faq.question}</span>
                  <motion.div
                    animate={{ rotate: activeIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDownIcon className="w-5 h-5 text-orange-500" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {activeIndex === index && (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-4 pb-4 text-gray-600 text-sm leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 italic mt-8">
            No results found for “{search}”.
          </p>
        )}

        {/* Contact Support Section */}
        <div className="mt-12 border-t border-gray-100 pt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            Still need help?
          </h3>
          <p className="text-center text-gray-500 mb-6 text-sm">
            Our support team is available 24/7 to assist you with your questions.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md w-full md:w-auto transition"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              Live Chat
            </button>
            <Link href="mailto:support@grubdash.com">
              <button className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-md w-full md:w-auto transition">
                <EnvelopeIcon className="w-5 h-5" />
                Email Support
              </button>
            </Link>
            <Link href="tel:+2340000000000">
              <button className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-5 py-2 rounded-md w-full md:w-auto transition">
                <PhoneIcon className="w-5 h-5" />
                Call Us
              </button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            className="fixed bottom-14 inset-0 bg-black bg-opacity-40 flex justify-center items-end md:items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-t-2xl md:rounded-xl shadow-lg w-full md:w-[400px] h-[70vh] md:h-[500px] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-green-500" />
                  Live Chat Support
                </h4>
                <button onClick={() => setIsChatOpen(false)}>
                  <XMarkIcon className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 text-sm">
                {chatHistory.length > 0 ? (
                  chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className="bg-green-100 text-gray-800 p-2 rounded-lg self-end max-w-[80%] ml-auto"
                    >
                      {msg}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 mt-10">
                    Start a conversation 👋
                  </p>
                )}
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-100 p-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-md px-3 py-2 flex items-center justify-center"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
