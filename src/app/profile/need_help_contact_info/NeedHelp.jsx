import React, { useState } from 'react'
import {
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from 'next/link';

import { motion, AnimatePresence } from "framer-motion";

export default function NeedHelp() {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    
     const handleSendMessage = () => {
        if (!message.trim()) return;
        setChatHistory((prev) => [...prev, message]);
        setMessage("");
    };
  return (
    <>
      <div className="mt-12 pt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          Still need help?
        </h3>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Our support team is available 24/7 to assist you with your questions.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button onClick={() => setIsChatOpen(true)} className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md w-full md:w-auto transition">
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

      {/* Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            className="fixed bottom-14 inset-0 bg-black/70 bg-opacity-40 flex justify-center items-end md:items-center z-50"
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
    </>
  )
}
