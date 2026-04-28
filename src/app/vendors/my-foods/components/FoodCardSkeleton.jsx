export default function FoodCardSkeleton() {
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden animate-pulse">
            <div className="h-44 bg-zinc-100 dark:bg-zinc-800" />
            <div className="p-4 space-y-3">
                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-3/4" />
                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-1/2" />
                <div className="flex gap-2 pt-1">
                    <div className="h-7 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-16" />
                    <div className="h-7 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-16" />
                </div>
            </div>
        </div>
    );
}
