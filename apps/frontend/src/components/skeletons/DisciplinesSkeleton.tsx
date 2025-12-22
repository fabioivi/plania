import { cn } from "@/lib/utils"

export function DisciplinesGridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="group relative bg-white dark:bg-card rounded-3xl border border-slate-200 dark:border-border shadow-sm flex flex-col h-full overflow-hidden"
                >
                    {/* Inner Body */}
                    <div className="p-7 flex-1 flex flex-col">
                        {/* Header Row: Turma (Left) vs Periodo (Right) */}
                        <div className="flex items-start justify-between mb-5">
                            <div className="h-6 w-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg animate-pulse" /> {/* Turma */}
                            <div className="h-6 w-20 bg-slate-50 dark:bg-secondary/50 rounded-md animate-pulse" /> {/* Periodo */}
                        </div>

                        {/* Title Section */}
                        <div className="mb-6 space-y-3">
                            {/* Title */}
                            <div className="h-7 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
                            <div className="h-7 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />

                            {/* Course & Time Info */}
                            <div className="pt-2 space-y-2">
                                <div className="h-4 w-40 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                                <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                            </div>
                        </div>

                        {/* Plans Section Stub */}
                        <div className="mt-auto space-y-2">
                            <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /> {/* Label */}
                            <div className="h-10 w-full bg-slate-50 dark:bg-secondary/30 rounded-xl animate-pulse" /> {/* Plan Item */}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-5 bg-slate-50/50 dark:bg-secondary/30 border-t border-slate-100 dark:border-border">
                        <div className="h-12 w-full bg-slate-200 dark:bg-card rounded-xl animate-pulse" /> {/* Button */}
                    </div>

                    {/* Shimmer Overlay for premium feel */}
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent z-10 pointer-events-none" />
                </div>
            ))}
        </div>
    )
}

export function DisciplinesSkeleton() {
    return (
        <div className="space-y-6 min-h-screen pb-20 animate-in fade-in duration-500">

            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                    {/* Title */}
                    <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                    {/* Subtitle */}
                    <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/50 rounded-lg animate-pulse" />
                    {/* Badge */}
                    <div className="flex items-center gap-2 pt-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-200 dark:bg-emerald-900 animate-pulse" />
                        <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                    </div>
                </div>

                {/* Sync Button Skeleton */}
                <div>
                    <div className="h-14 w-48 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                </div>
            </div>

            {/* Toolbar Skeleton (Search & Filters) */}
            <div className="p-2 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row gap-2">
                <div className="flex-1 h-14 bg-slate-50 dark:bg-slate-800/30 rounded-xl animate-pulse" />
                <div className="h-14 w-32 bg-slate-50 dark:bg-slate-800/30 rounded-xl animate-pulse" />
            </div>

            {/* Grid Skeleton */}
            <DisciplinesGridSkeleton />
        </div>
    )
}
