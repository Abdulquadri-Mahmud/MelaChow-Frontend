"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";
import Header2 from "@/app/components/App_Header/Header2";
import { addSupportTicketMessage, getMySupportTicket } from "@/app/lib/api";

export default function SupportTicketPage() {
  const { ticketId } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const load = async () => { try { setLoading(true); const response = await getMySupportTicket(ticketId); setTicket(response.data?.ticket); } catch (error) { toast.error(error.message || "Could not load ticket"); } finally { setLoading(false); } };
  useEffect(() => { if (ticketId) load(); }, [ticketId]);
  const send = async (event) => { event.preventDefault(); if (message.trim().length < 2) return; try { setSending(true); const response = await addSupportTicketMessage(ticketId, { message }); setTicket(response.data?.ticket); setMessage(""); toast.success("Message sent to support"); } catch (error) { toast.error(error.message || "Could not send message"); } finally { setSending(false); } };
  if (loading) return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950"><Header2 /><div className="flex justify-center p-20"><Loader2 className="animate-spin text-orange-600" /></div></div>;
  if (!ticket) return <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-950"><Header2 /><p className="text-center text-zinc-500">Ticket not found.</p></div>;
  const messages = ticket.conversation?.length ? ticket.conversation : [{ body: ticket.message, senderRole: "customer", senderName: ticket.customerName, createdAt: ticket.createdAt }];
  return <div className="min-h-screen bg-zinc-50 pb-24 dark:bg-zinc-950"><Header2 /><main className="mx-auto max-w-2xl p-4"><button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-300"><ArrowLeft size={16} /> Back</button><section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><p className="text-xs font-black uppercase tracking-widest text-orange-600">{ticket.ticketNumber}</p><h1 className="mt-2 text-xl font-black text-zinc-900 dark:text-white">{ticket.subject}</h1><p className="mt-2 text-sm text-zinc-500">Status: <span className="font-bold uppercase">{ticket.status}</span>{ticket.assignedAdminName ? " · Assigned to " + ticket.assignedAdminName : ""}</p></section><section className="mt-4 space-y-3">{messages.map((item, index) => <article key={index} className={"rounded-xl p-4 " + (item.senderRole === "customer" ? "ml-8 bg-orange-600 text-white" : "mr-8 border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white")}><p className="text-xs font-bold opacity-75">{item.senderRole === "customer" ? "You" : item.senderName || "MelaChow Support"}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{item.body}</p>{item.attachments?.map((url) => <a key={url} href={url} target="_blank" className="mt-2 block text-xs underline">View attachment</a>)}</article>)}</section><form onSubmit={send} className="mt-5 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Add more information for support..." className="w-full resize-none bg-transparent p-2 text-sm outline-none" /><button disabled={sending} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send message</button></form></main></div>;
}