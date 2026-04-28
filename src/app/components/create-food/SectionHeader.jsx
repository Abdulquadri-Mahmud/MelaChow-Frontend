import { ChevronDown, Check } from "lucide-react";

export default function SectionHeader({
    title,
    icon: Icon,
    section,
    isExpanded,
    onToggle,
    isValid,
    subtitle,
    accentColor = "orange", // orange, emerald, purple, blue
}) {
    const colorMap = {
        orange: {
            bg: "bg-orange-50 dark:bg-orange-500/10",
            text: "text-orange-500 dark:text-orange-400",
            iconBox: "bg-[#FF6600] text-white shadow-lg shadow-orange-500/30",
            iconBoxCollapsed: "bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20",
            progress: "bg-orange-500",
        },
        emerald: {
            bg: "bg-emerald-50 dark:bg-emerald-500/10",
            text: "text-emerald-500 dark:text-emerald-400",
            iconBox: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30",
            iconBoxCollapsed: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20",
            progress: "bg-emerald-500",
        },
        purple: {
            bg: "bg-purple-50 dark:bg-purple-500/10",
            text: "text-purple-500 dark:text-purple-400",
            iconBox: "bg-purple-500 text-white shadow-lg shadow-purple-500/30",
            iconBoxCollapsed: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20",
            progress: "bg-purple-500",
        },
        blue: {
            bg: "bg-blue-50 dark:bg-blue-500/10",
            text: "text-blue-500 dark:text-blue-400",
            iconBox: "bg-blue-500 text-white shadow-lg shadow-blue-500/30",
            iconBoxCollapsed: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20",
            progress: "bg-blue-500",
        },
        pink: {
            bg: "bg-pink-50 dark:bg-pink-500/10",
            text: "text-pink-500 dark:text-pink-400",
            iconBox: "bg-pink-500 text-white shadow-lg shadow-pink-500/30",
            iconBoxCollapsed: "bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 group-hover:bg-pink-100 dark:group-hover:bg-pink-500/20",
            progress: "bg-pink-500",
        },
    };

    const theme = colorMap[accentColor] || colorMap.orange;

    return (
        <div
            id={`section-${section}`}
            className={`group relative overflow-hidden rounded-t-3xl border-b border-zinc-100 dark:border-zinc-800 transition-all duration-300 scroll-mt-32 ${isExpanded
                ? "bg-white dark:bg-[#1E293B]"
                : "bg-white dark:bg-[#1E293B] hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
        >
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 text-left outline-none"
            >
                <div className="flex items-center gap-4">
                    <div
                        className={`p-3 rounded-2xl transition-all duration-300 ${isExpanded ? theme.iconBox : theme.iconBoxCollapsed
                            }`}
                    >
                        <Icon size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isValid !== undefined && (
                        <div
                            className={`hidden sm:flex px-3 py-1 rounded-full text-xs font-bold items-center gap-1.5 transition-colors ${isValid
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                                }`}
                        >
                            {isValid ? (
                                <Check size={14} strokeWidth={3} />
                            ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-current opacity-60" />
                            )}
                            {isValid ? "Complete" : "Required"}
                        </div>
                    )}
                    <div
                        className={`p-2 rounded-full transition-transform duration-300 ${isExpanded ? "rotate-180 bg-zinc-100 dark:bg-zinc-800" : ""
                            }`}
                    >
                        <ChevronDown size={20} className="text-gray-400" />
                    </div>
                </div>
            </button>
            {/* Progress Line for collapsed state */}
            {!isExpanded && isValid !== undefined && (
                <div
                    className={`absolute bottom-0 left-0 h-1 transition-all duration-500 ${isValid ? "w-full bg-emerald-500" : "w-0.5 bg-zinc-200 dark:bg-zinc-700"
                        }`}
                />
            )}
        </div>
    );
}
