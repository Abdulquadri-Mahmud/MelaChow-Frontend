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
        <h3 className="text-xl font-black italic uppercase tracking-tight text-zinc-800 dark:text-white mb-2 text-center">
          Still need help?
        </h3>
        <p className="text-center text-zinc-500 dark:text-zinc-400 mb-8 text-sm font-medium">
          Our support team is available 24/7 to assist you with your questions.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          {/* <button onClick={() => setIsChatOpen(true)} className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl w-full md:w-auto transition-all shadow-lg shadow-emerald-500/20 font-bold">
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            Live Chat
          </button> */}
          <Link href="mailto:support@melachow.com" className="w-full md:w-auto">
            <button className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl w-full transition-all shadow-lg shadow-orange-500/20 font-bold">
              <EnvelopeIcon className="w-5 h-5" />
              Email Support
            </button>
          </Link>
          <Link href="tel:+2340000000000" className="w-full md:w-auto">
            <button className="flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white px-6 py-3 rounded-2xl w-full transition-all shadow-lg shadow-zinc-900/20 font-bold">
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
              className="bg-white dark:bg-zinc-900 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl w-full md:w-[400px] h-[70vh] md:h-[550px] flex flex-col border border-zinc-100 dark:border-zinc-800 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-50 dark:border-zinc-800 bg-emerald-500 text-white">
                <h4 className="font-bold text-lg flex items-center gap-3">
                  <ChatBubbleLeftRightIcon className="w-6 h-6" />
                  Live Support
                </h4>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm bg-zinc-50 dark:bg-zinc-950">
                {chatHistory.length > 0 ? (
                  chatHistory.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-emerald-500 text-white p-3 rounded-2xl rounded-tr-none self-end max-w-[85%] ml-auto shadow-md"
                    >
                      {msg}
                    </motion.div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 mb-2 text-zinc-300 dark:text-zinc-600" />
                    <p className="font-bold uppercase tracking-widest text-[10px] text-zinc-400 dark:text-zinc-500">
                      Our team is ready ðŸ‘‹
                    </p>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="bg-white dark:bg-zinc-900 p-4 flex items-center gap-3 border-t border-zinc-50 dark:border-zinc-800">
                <input
                  type="text"
                  placeholder="Ask us anything..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-800 border-transparent dark:border-zinc-700 rounded-2xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl p-3 flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-90 transition-all font-bold"
                >
                  <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

