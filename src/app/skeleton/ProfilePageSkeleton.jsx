import Header2 from "@/app/components/App_Header/Header2";

const Line = ({ className = "" }) => <div className={`animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 ${className}`} />;

export default function ProfilePageSkeleton() {
  return <div className="min-h-screen bg-zinc-50 pb-20 dark:bg-zinc-950"><Header2 /><main className="mx-auto max-w-xl space-y-4 pt-4"><section className="mx-2 rounded-[8px] border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center gap-5"><Line className="h-20 w-20 shrink-0 rounded-[8px]" /><div className="flex-1 space-y-3"><Line className="h-5 w-40" /><Line className="h-3 w-24" /></div></div><div className="mt-5 space-y-2 border-t border-zinc-100 pt-5 dark:border-zinc-800"><Line className="h-10 w-full" /><Line className="h-10 w-4/5" /></div></section><div className="mx-2 space-y-2"><Line className="h-3 w-32" /><Line className="h-16 w-full" /></div><div className="mx-2 space-y-2"><Line className="h-3 w-28" /><Line className="h-52 w-full" /></div></main></div>;
}