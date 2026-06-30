"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  HelpCircle,
  Loader2,
  Mail,
  MessageCircle,
  Package,
  Phone,
  Send,
  ShieldAlert,
  Truck,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupportTicket, getMySupportTickets } from "@/app/lib/api";
import { useUserStorage } from "@/app/hooks/useUserStorage";

const categories = [
  { id: "payment_issue", label: "Payment issue", icon: CreditCard },
  { id: "refund_request", label: "Refund request", icon: ShieldAlert },
  { id: "cancelled_order", label: "Cancelled order", icon: Package },
  { id: "missing_or_wrong_item", label: "Missing or wrong item", icon: FileText },
  { id: "late_delivery", label: "Late delivery", icon: Truck },
  { id: "vendor_issue", label: "Restaurant issue", icon: Package },
  { id: "rider_issue", label: "Rider issue", icon: Truck },
  { id: "account_issue", label: "Account issue", icon: User },
  { id: "app_bug", label: "App issue", icon: HelpCircle },
  { id: "other", label: "Other", icon: MessageCircle },
];

const statusStyles = {
  open: "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20",
  pending: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
  escalated: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  closed: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
};

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ContactMethod({ icon: Icon, name, description, url, colorClass }) {
  return (
    <motion.a
      href={url}
      target={url.startsWith("http") ? "_blank" : undefined}
      rel={url.startsWith("http") ? "noopener noreferrer" : undefined}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-orange-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-orange-500/30"
    >
      <div className={`rounded-lg p-3 ${colorClass}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">{name}</h3>
        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{description}</p>
      </div>
      <ChevronRight size={16} className="text-zinc-300 dark:text-zinc-600" />
    </motion.a>
  );
}

function TicketStatus({ status }) {
  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${statusStyles[status] || statusStyles.open}`}>
      {String(status || "open").replace(/_/g, " ")}
    </span>
  );
}

export default function GetHelp() {
  const router = useRouter();
  const { user } = useUserStorage();
  const [form, setForm] = useState({
    category: "payment_issue",
    subject: "",
    orderReference: "",
    paymentReference: "",
    customerPhone: user?.phone || "",
    customerEmail: user?.email || "",
    message: "",
  });
  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCategory = useMemo(
    () => categories.find((item) => item.id === form.category) || categories[0],
    [form.category]
  );

  const loadTickets = async () => {
    try {
      setIsLoadingTickets(true);
      const response = await getMySupportTickets();
      setTickets(response.data?.tickets || []);
    } catch (error) {
      if (!String(error.message || "").toLowerCase().includes("unauthorized")) {
        toast.error(error.message || "Failed to load support history");
      }
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      customerPhone: prev.customerPhone || user?.phone || "",
      customerEmail: prev.customerEmail || user?.email || "",
    }));
  }, [user?.email, user?.phone]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.subject.trim() || form.subject.trim().length < 5) {
      toast.error("Please enter a clear subject.");
      return;
    }

    if (!form.message.trim() || form.message.trim().length < 15) {
      toast.error("Please describe the issue in more detail.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await createSupportTicket(form);
      toast.success(response.message || "Complaint submitted");
      setForm((prev) => ({
        ...prev,
        subject: "",
        orderReference: "",
        paymentReference: "",
        message: "",
      }));
      await loadTickets();
    } catch (error) {
      toast.error(error.message || "Failed to submit complaint");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-white">
      <section className="bg-orange-600 px-4 pb-14 pt-6 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.back()}
              className="rounded-lg border border-white/10 bg-white/10 p-3 text-white transition hover:bg-white/15"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </motion.button>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Support Online</span>
            </div>
            <div className="h-11 w-11" />
          </div>

          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest"
            >
              <HelpCircle size={14} />
              Customer Care
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl font-black tracking-tight sm:text-4xl"
            >
              Tell us what happened.
            </motion.h1>
            <p className="mt-3 max-w-xl text-sm font-bold leading-relaxed text-white/80">
              Lodge complaints for payments, refunds, cancelled orders, delivery issues, missing items, or account problems.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto -mt-8 grid max-w-6xl gap-5 px-4 lg:grid-cols-[1fr_380px]">
        <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight">Submit Complaint</h2>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">A support ticket will be created for admin review.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md bg-orange-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
              <activeCategory.icon size={14} />
              {activeCategory.label}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => updateField("category", category.id)}
                className={`flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-lg border p-2 text-center text-[10px] font-black uppercase tracking-wider transition ${
                  form.category === category.id
                    ? "border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300"
                    : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-orange-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                }`}
              >
                <category.icon size={18} />
                {category.label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Subject</span>
              <input
                value={form.subject}
                onChange={(event) => updateField("subject", event.target.value)}
                placeholder="Example: I paid but my order was not created"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Order ID</span>
              <input
                value={form.orderReference}
                onChange={(event) => updateField("orderReference", event.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Payment Reference</span>
              <input
                value={form.paymentReference}
                onChange={(event) => updateField("paymentReference", event.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Phone</span>
              <input
                value={form.customerPhone}
                onChange={(event) => updateField("customerPhone", event.target.value)}
                placeholder="Phone number"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email</span>
              <input
                value={form.customerEmail}
                onChange={(event) => updateField("customerEmail", event.target.value)}
                placeholder="Email address"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">What happened?</span>
              <textarea
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                rows={6}
                placeholder="Add details like restaurant name, amount paid, delivery address, what you expected, and what happened."
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm font-medium leading-relaxed outline-none focus:border-orange-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-bold uppercase leading-relaxed tracking-wider text-zinc-400">
              Payment and refund tickets are marked higher priority for admin review.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-orange-700 active:scale-[0.99] disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Submit Complaint
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tight">My Tickets</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Recent support history</p>
              </div>
              <Clock size={18} className="text-orange-600" />
            </div>

            {isLoadingTickets ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="animate-spin text-orange-600" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-200 p-6 text-center dark:border-zinc-800">
                <FileText className="mx-auto mb-3 text-zinc-300" size={36} />
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">No complaints yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.slice(0, 6).map((ticket) => (
                  <div key={ticket._id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-black uppercase tracking-widest text-orange-600">{ticket.ticketNumber}</p>
                        <h3 className="mt-1 line-clamp-2 text-sm font-black text-zinc-900 dark:text-white">{ticket.subject}</h3>
                      </div>
                      <TicketStatus status={ticket.status} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{formatDate(ticket.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <ContactMethod
              icon={MessageCircle}
              name="WhatsApp"
              description="Fast help for urgent issues"
              url="https://wa.me/2349134831368"
              colorClass="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"
            />
            <ContactMethod
              icon={Phone}
              name="Call support"
              description="Talk to a support agent"
              url="tel:2349134831368"
              colorClass="bg-blue-50 dark:bg-blue-500/10 text-blue-600"
            />
            <ContactMethod
              icon={Mail}
              name="Email Support"
              description="support@melachow.com"
              url="mailto:support@melachow.com"
              colorClass="bg-orange-50 dark:bg-orange-500/10 text-orange-600"
            />
            <ContactMethod
              icon={Mail}
              name="Email Help Desk"
              description="help@melachow.com"
              url="mailto:help@melachow.com"
              colorClass="bg-zinc-50 dark:bg-zinc-500/10 text-zinc-500"
            />
          </div>

          <div className="rounded-lg border border-orange-100 bg-orange-50 p-4 dark:border-orange-500/20 dark:bg-orange-500/10">
            <div className="mb-2 flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <CheckCircle2 size={16} />
              <h3 className="text-sm font-black">What to include</h3>
            </div>
            <p className="text-xs font-bold leading-relaxed text-orange-900/70 dark:text-orange-100/70">
              Add your order ID, payment reference, amount paid, restaurant name, and the exact problem. This helps support resolve the issue faster.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
