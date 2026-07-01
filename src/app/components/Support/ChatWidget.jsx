"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, ArrowUp, Mail } from "lucide-react";

// Hardcoded greeting — no API call on open
const CUSTOMER_GREETING = {
  role: "assistant",
  content:
    "Hi! I'm Chow, MelaChow's support assistant. Ask me anything about ordering, payments, delivery, or your account.",
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Show greeting when chat is first opened — no API call
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setMessages([CUSTOMER_GREETING]);
      setHasGreeted(true);
    }
  }, [isOpen, hasGreeted]);

  // Scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg = { role: "user", content: trimmed };

    // 1. Append user message and clear input
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // 2. Build history slice (last 16 items before the new message)
    //    We include the greeting in history for context, but keep to 16 max.
    const history = [...messages, userMsg].slice(-16);

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-16), // history BEFORE the current message
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } else if (res.status === 429) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error, isError: true, is429: true },
        ]);
      } else if (res.status === 502 || res.status === 503) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error, isError: true, is502: true },
        ]);
      } else {
        // 400 or other
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I couldn't process that message. Please try rephrasing.",
            isError: true,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I couldn't process that message. Please try rephrasing.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Chat Panel ─────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
          style={{ width: "min(360px, calc(100vw - 24px))", height: "480px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 dark:bg-zinc-950 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                <MessageCircle size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-none">Chow</p>
                <p className="text-zinc-400 text-[11px] mt-0.5">MelaChow Support</p>
              </div>
            </div>
            <button
              id="chat-widget-close-btn"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-orange-500 text-white rounded-br-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                  {msg.is502 && (
                    <a
                      href="mailto:support@melachow.com"
                      className="flex items-center gap-1 mt-2 text-orange-500 hover:text-orange-600 font-semibold text-xs transition-colors"
                    >
                      <Mail size={12} />
                      Email support
                    </a>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="px-3 pb-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
            <div className="flex items-end gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2">
              <textarea
                id="chat-widget-input"
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Ask a question…"
                className="flex-1 bg-transparent resize-none outline-none text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 max-h-24 leading-relaxed disabled:opacity-50"
                style={{ fieldSizing: "content" }}
              />
              <button
                id="chat-widget-send-btn"
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-200 dark:disabled:bg-zinc-700 flex items-center justify-center transition-colors shrink-0"
                aria-label="Send message"
              >
                <ArrowUp size={16} className="text-white disabled:text-zinc-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toggle Button ───────────────────────────────────────────── */}
      <button
        id="chat-widget-toggle-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95"
        aria-label={isOpen ? "Close chat" : "Open support chat"}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
