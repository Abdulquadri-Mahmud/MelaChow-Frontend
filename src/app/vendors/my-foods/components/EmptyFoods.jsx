import { Plus } from "lucide-react";

export default function EmptyFoods({ isFiltered, onClearFilters, onAddFood }) {
    return (
        <div className="col-span-full py-16 flex flex-col items-center gap-4 text-center">
            <div className="size-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl">
                🍽️
            </div>
            <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                    {isFiltered ? "No foods match your filters" : "No foods yet"}
                </h3>
                <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs">
                    {isFiltered
                        ? "Try adjusting your search or filters."
                        : "Add your first food item to get started."
                    }
                </p>
            </div>
            {isFiltered ? (
                <button
                    onClick={onClearFilters}
                    className="h-10 px-6 rounded-md border border-zinc-200 dark:border-zinc-700 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 transition-all"
                >
                    Clear Filters
                </button>
            ) : (
                <button
                    onClick={onAddFood}
                    className="h-10 px-6 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-orange-500/20"
                >
                    <Plus size={14} /> Add First Food
                </button>
            )}
        </div>
    );
}
