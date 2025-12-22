import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export function DiaryDetailsSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background pb-20 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto">

                {/* Back Button Placeholder */}
                <div className="mb-6">
                    <div className="inline-flex items-center gap-2 pl-0 text-slate-500 dark:text-muted-foreground opacity-50 cursor-not-allowed">
                        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-full p-1">
                            <ChevronLeft className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-sm">Voltar para Disciplinas</span>
                    </div>
                </div>

                {/* Header Action Bar Skeleton */}
                <div className="mb-8 flex flex-col gap-6 bg-white dark:bg-card p-6 rounded-[2rem] border border-slate-200 dark:border-border shadow-sm dark:shadow-none relative overflow-hidden">
                    <div className="relative z-10 w-full">

                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <div className="h-5 w-24 bg-slate-100 dark:bg-secondary rounded-full animate-pulse" />
                            <div className="h-5 w-20 bg-slate-100 dark:bg-secondary rounded-full animate-pulse" />
                            <div className="h-5 w-28 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-full animate-pulse" />
                        </div>

                        {/* Title */}
                        <div className="mb-3 space-y-2">
                            <div className="h-8 w-3/4 md:w-1/2 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                            <div className="h-8 w-1/2 md:w-1/3 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                        </div>

                        {/* Metadata Row */}
                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                            <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                            <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="relative z-10 flex flex-wrap gap-3 w-full">
                        <div className="h-10 w-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                        <div className="h-10 w-48 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl animate-pulse" />
                    </div>

                    {/* Shimmer Overlay */}
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent z-0 pointer-events-none" />
                </div>

                {/* Content List Skeleton */}
                <div className="space-y-6">
                    {/* Section Value */}
                    <div className="flex items-center justify-between px-2">
                        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
                        <div className="h-5 w-32 bg-slate-100 dark:bg-slate-800/50 rounded-md animate-pulse" />
                    </div>

                    {/* Table Container */}
                    <div className="bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-border shadow-sm dark:shadow-none overflow-hidden">
                        {/* Table Header */}
                        <div className="h-12 border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-secondary/30" />

                        {/* Table Rows */}
                        <div className="p-0">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-50 dark:border-border/50 last:border-0">
                                    <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" /> {/* Date Box */}
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 animate-pulse" />
                                        <div className="h-3 w-1/2 bg-slate-50 dark:bg-slate-800/50 animate-pulse" />
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800/50 animate-pulse" /> {/* Action */}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
