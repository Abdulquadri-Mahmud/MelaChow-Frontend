export default function FoodCardSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden animate-pulse">
            <div className="h-44 bg-slate-100 dark:bg-slate-800" />
            <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/2" />
                <div className="flex gap-2 pt-1">
                    <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-xl w-16" />
                    <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-xl w-16" />
                </div>
            </div>
        </div>
    );
}
