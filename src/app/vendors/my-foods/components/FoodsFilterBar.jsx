"use client";

import { Search, X } from "lucide-react";

const STATUS_TABS = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Archived", value: "archived" },
];

export default function FoodsFilterBar({
    search, onSearch,
    status, onStatus,
    sections, activeSection, onSection,
    stats,
}) {
    return (
        <div className="space-y-4">

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    {
                        label: "Total Foods",
                        value: stats?.total ?? 0,
                        color: "text-slate-900 dark:text-white"
                    },
                    {
                        label: "Active",
                        value: stats?.active ?? 0,
                        color: "text-emerald-600 dark:text-emerald-400"
                    },
                    {
                        label: "Archived",
                        value: stats?.archived ?? 0,
                        color: "text-slate-400 dark:text-slate-500"
                    },
                    {
                        label: "Out of Stock",
                        value: stats?.out_of_stock ?? 0,
                        color: "text-amber-600 dark:text-amber-400"
                    },
                ].map(s => (
                    <div
                        key={s.label}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md"
                    >
                        <div className={`text-xl font-black tracking-tight ${s.color}`}>
                            {s.value}
                        </div>
                        <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                            {s.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                />
                <input
                    type="text"
                    value={search}
                    onChange={e => onSearch(e.target.value)}
                    placeholder="Search menu..."
                    className="w-full h-10 pl-9 pr-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
                />
                {search && (
                    <button
                        onClick={() => onSearch("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                    >
                        <X size={15} />
                    </button>
                )}
            </div>

            {/* Status Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-md w-fit">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => onStatus(tab.value)}
                        className={`h-8 px-4 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${status === tab.value
                                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Section Pills */}
            {sections?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                        onClick={() => onSection(null)}
                        className={`shrink-0 h-7 px-3 rounded-md text-[10px] font-black uppercase tracking-widest border transition-all ${!activeSection
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                                : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                            }`}
                    >
                        All
                    </button>
                    {sections.map(sec => (
                        <button
                            key={sec._id}
                            onClick={() => onSection(
                                activeSection === sec._id ? null : sec._id
                            )}
                            className={`shrink-0 h-7 px-3 rounded-md text-[10px] font-black uppercase tracking-widest border transition-all ${activeSection === sec._id
                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                                    : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                                }`}
                        >
                            {sec.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
