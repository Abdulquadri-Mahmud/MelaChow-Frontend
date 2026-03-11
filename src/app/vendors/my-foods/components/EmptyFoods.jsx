import { Plus } from "lucide-react";

export default function EmptyFoods({ isFiltered, onClearFilters, onAddFood }) {
    return (
        <div className="col-span-full py-20 flex flex-col items-center gap-5 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl">
                🍽️
            </div>
            <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {isFiltered ? "No foods match your filters" : "No foods yet"}
                </h3>
                <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                    {isFiltered
                        ? "Try adjusting your search or filters."
                        : "Add your first food item to get started."
                    }
                </p>
            </div>
            {isFiltered ? (
                <button
                    onClick={onClearFilters}
                    className="h-11 px-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-600 dark:text-slate-300 hover:border-slate-400 transition-all active:scale-95"
                >
                    Clear Filters
                </button>
            ) : (
                <button
                    onClick={onAddFood}
                    className="h-11 px-6 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-black flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                >
                    <Plus size={16} /> Add Your First Food
                </button>
            )}
        </div>
    );
}
